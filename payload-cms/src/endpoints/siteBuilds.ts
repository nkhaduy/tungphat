import type { Endpoint, Payload } from 'payload'
import { canPublishContent, roleOf } from '@/access/roles'
import { matchesSecret, parseSiteBuildEvent, triggerStaticSiteRebuild } from '@/security/siteRebuild'

export type SiteBuildStatus = 'queued' | 'building' | 'deploying' | 'live' | 'failed'

export const siteBuildEndpoints: Endpoint[] = [
  {
    path: '/site-builds/status',
    method: 'get',
    handler: async (req) => {
      if (!roleOf(req)) return json({ error: 'unauthorized' }, 401)
      const latest = await req.payload.find({ collection: 'site-builds', limit: 1, depth: 0, sort: '-createdAt', overrideAccess: true })
      const doc = latest.docs[0] as unknown as SiteBuildRecord | undefined
      return json({
        build: doc ? publicBuildRecord(doc) : null,
        canRetry: canPublishContent({ req } as never) === true,
        targetLabel: process.env.CMS_ENVIRONMENT === 'staging' ? 'preview' : 'website',
      }, 200)
    },
  },
  {
    path: '/site-builds/context',
    method: 'get',
    handler: async (req) => {
      const request = req as unknown as Request
      const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/iu, '')
      if (!matchesSecret(process.env.SITE_BUILD_CALLBACK_SECRET, supplied)) return json({ error: 'unauthorized' }, 401)
      const buildId = new URL(request.url).searchParams.get('buildId') || ''
      if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu.test(buildId)) return json({ error: 'invalid_build' }, 400)
      const build = await findBuild(req.payload, buildId)
      if (!build) return json({ error: 'not_found' }, 404)
      const ready = Boolean(build.triggerReason)
      return json({ branch: build.branch, articleSlug: build.articleSlug || null, triggerReason: build.triggerReason || null, ready }, ready ? 200 : 202)
    },
  },
  {
    path: '/site-builds/events',
    method: 'post',
    handler: async (req) => {
      const request = req as unknown as Request
      const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/iu, '')
      if (!matchesSecret(process.env.SITE_BUILD_CALLBACK_SECRET, supplied)) return json({ error: 'unauthorized' }, 401)
      const body = await request.json().catch(() => null)
      const expectedBranch = process.env.SITE_BUILD_BRANCH || 'codex/editorial-cms'
      const event = parseSiteBuildEvent(body, expectedBranch)
      if (!event) return json({ error: 'invalid_event' }, 400)

      try {
        await applyBuildEvent(req.payload, event)
      } catch (error) {
        req.payload.logger.error({ err: error, msg: 'Failed to persist Workers Builds event' })
        return json({ error: 'persistence_failed' }, 503)
      }
      return json({ accepted: true }, 202)
    },
  },
  {
    path: '/site-builds/retry',
    method: 'post',
    handler: async (req) => {
      if (!canPublishContent({ req } as never)) return json({ error: 'forbidden' }, req.user ? 403 : 401)
      if (!sameOrigin(req as unknown as Request)) return json({ error: 'origin_rejected' }, 403)

      const latest = await req.payload.find({ collection: 'site-builds', limit: 1, depth: 0, sort: '-createdAt', overrideAccess: true })
      const previous = latest.docs[0] as unknown as SiteBuildRecord | undefined
      if (!previous || previous.status !== 'failed') return json({ error: 'no_failed_build' }, 409)
      const result = await requestBuild(req.payload, { articleSlug: previous.articleSlug, reason: 'retry' })
      return json({ build: result, accepted: result.status === 'queued' }, result.status === 'queued' ? 202 : 503)
    },
  },
]

export async function requestBuild(payload: Payload, input: { articleSlug?: string; reason: 'publish' | 'unpublish' | 'retry' }) {
  const result = await triggerStaticSiteRebuild()
  const now = new Date().toISOString()
  const buildId = result.status === 'queued' ? result.buildId : undefined
  const record: Record<string, unknown> = {
    requestId: crypto.randomUUID(),
    ...(buildId ? { buildId } : {}),
    status: result.status === 'queued' ? 'queued' : 'failed',
    branch: process.env.SITE_BUILD_BRANCH || 'codex/editorial-cms',
    articleSlug: input.articleSlug || undefined,
    triggerReason: input.reason,
    errorCode: result.status === 'disabled' ? 'hook_not_configured' : result.status === 'invalid-hook' ? 'hook_invalid' : result.status === 'failed' ? 'trigger_failed' : undefined,
    createdAt: now,
    completedAt: result.status === 'queued' ? undefined : now,
  }

  if (buildId) {
    const existing = await findBuild(payload, buildId)
    if (existing) {
      await payload.update({ collection: 'site-builds', id: existing.id, overrideAccess: true, data: {
        articleSlug: input.articleSlug || existing.articleSlug,
        triggerReason: input.reason,
        ...(existing.status === 'queued' ? { status: 'queued' } : {}),
      } as never })
      return publicBuildRecord({ ...existing, articleSlug: input.articleSlug || existing.articleSlug })
    }
  }

  const created = await payload.create({ collection: 'site-builds', overrideAccess: true, data: record as never })
  return publicBuildRecord(created as unknown as SiteBuildRecord)
}

async function applyBuildEvent(payload: Payload, event: NonNullable<ReturnType<typeof parseSiteBuildEvent>>) {
  const existing = await findBuild(payload, event.buildId)
  const now = new Date().toISOString()
  const terminal = existing?.status === 'live' || existing?.status === 'failed'
  const acceptedStatus = terminal && existing.status !== event.status ? existing.status : event.status
  const data = {
    ...(existing ? {} : { requestId: crypto.randomUUID(), buildId: event.buildId, branch: event.branch, createdAt: now }),
    status: acceptedStatus,
    commitSha: event.commitSha,
    errorCode: acceptedStatus === 'failed' ? event.errorCode || 'unknown' : undefined,
    completedAt: acceptedStatus === 'live' || acceptedStatus === 'failed' ? now : undefined,
  }
  if (existing) await payload.update({ collection: 'site-builds', id: existing.id, overrideAccess: true, data: data as never })
  else await payload.create({ collection: 'site-builds', overrideAccess: true, data: data as never })
}

async function findBuild(payload: Payload, buildId: string): Promise<SiteBuildRecord | undefined> {
  const found = await payload.find({ collection: 'site-builds', limit: 1, depth: 0, overrideAccess: true, where: { buildId: { equals: buildId } } })
  return found.docs[0] as unknown as SiteBuildRecord | undefined
}

function publicBuildRecord(record: SiteBuildRecord) {
  return {
    status: record.status,
    branch: record.branch,
    commitSha: record.commitSha,
    articleSlug: record.articleSlug,
    triggerReason: record.triggerReason,
    errorCode: record.errorCode,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    buildId: record.buildId,
  }
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const target = new URL(process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://127.0.0.1:3000')
  if (!origin) return false
  try { return new URL(origin).origin === target.origin } catch { return false }
}

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}

type SiteBuildRecord = {
  id: string | number
  status: SiteBuildStatus
  buildId?: string
  branch: string
  commitSha?: string
  articleSlug?: string
  triggerReason?: string
  errorCode?: string
  createdAt: string
  completedAt?: string
}
