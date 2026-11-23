import type { Endpoint, Payload } from 'payload'
import { canPublishContent, roleOf } from '@/access/roles'
import { matchesSecret, parseSiteBuildEvent, triggerStaticSiteRebuild } from '@/security/siteRebuild'

export type SiteBuildStatus = 'queued' | 'building' | 'deploying' | 'live' | 'failed'
const BUILD_STALE_AFTER_MS = 25 * 60 * 1000

export const siteBuildEndpoints: Endpoint[] = [
  {
    path: '/site-builds/status',
    method: 'get',
    handler: async (req) => {
      if (!roleOf(req)) return json({ error: 'unauthorized' }, 401)
      const latest = await req.payload.find({ collection: 'site-builds', limit: 1, depth: 0, sort: '-createdAt', overrideAccess: true })
      let doc = latest.docs[0] as unknown as SiteBuildRecord | undefined
      if (doc && isStaleBuild(doc)) doc = await markBuildStale(req.payload, doc)
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
      return json({ branch: build.branch, articleSlug: build.articleSlug || null, triggerReason: build.triggerReason || null, requestId: build.requestId, updatedAt: build.updatedAt, ready }, ready ? 200 : 202)
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
        const accepted = await applyBuildEvent(req.payload, event)
        if (!accepted) return json({ error: 'stale_context' }, 409)
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
      let previous = latest.docs[0] as unknown as SiteBuildRecord | undefined
      if (previous && isStaleBuild(previous)) previous = await markBuildStale(req.payload, previous)
      if (!previous || previous.status !== 'failed') return json({ error: 'no_failed_build' }, 409)
      const reason = previous.triggerReason === 'unpublish' ? 'unpublish' : 'publish'
      const result = await requestBuild(req.payload, { articleSlug: previous.articleSlug, reason })
      return json({ build: result, accepted: result.status === 'queued' }, result.status === 'queued' ? 202 : 503)
    },
  },
]

export async function requestBuild(payload: Payload, input: { articleSlug?: string; reason: 'publish' | 'unpublish' | 'retry' }) {
  const branch = process.env.SITE_BUILD_BRANCH || 'codex/editorial-cms'
  const active = await findActiveBuild(payload, branch)
  if (active) {
    const updated = await payload.update({ collection: 'site-builds', id: active.id, overrideAccess: true, data: {
      requestId: crypto.randomUUID(),
      articleSlug: input.articleSlug || active.articleSlug,
      triggerReason: input.reason,
    } as never })
    return publicBuildRecord(updated as unknown as SiteBuildRecord)
  }

  const now = new Date().toISOString()
  const pending = await payload.create({ collection: 'site-builds', overrideAccess: true, data: {
    requestId: crypto.randomUUID(),
    status: 'queued',
    branch,
    articleSlug: input.articleSlug || undefined,
    triggerReason: input.reason,
    createdAt: now,
  } as never }) as unknown as SiteBuildRecord

  const result = await triggerStaticSiteRebuild()
  if (result.status !== 'queued') {
    const current = await findBuildRecordById(payload, pending.id) || pending
    if (current.status === 'queued' && !current.buildId) {
      const failed = await payload.update({ collection: 'site-builds', id: current.id, overrideAccess: true, data: {
        status: 'failed',
        errorCode: result.status === 'disabled' ? 'hook_not_configured' : result.status === 'invalid-hook' ? 'hook_invalid' : 'trigger_failed',
        completedAt: new Date().toISOString(),
      } as never })
      return publicBuildRecord(failed as unknown as SiteBuildRecord)
    }
    return publicBuildRecord(current)
  }

  if (!result.buildId) return publicBuildRecord(pending)
  return attachBuildId(payload, pending, result.buildId)
}

async function applyBuildEvent(payload: Payload, event: NonNullable<ReturnType<typeof parseSiteBuildEvent>>) {
  const existing = await findBuild(payload, event.buildId) || await findUnassignedQueuedBuild(payload, event.branch)
  if (event.status === 'live' && existing && event.requestId && event.requestId !== existing.requestId) return false
  const now = new Date().toISOString()
  const terminal = existing?.status === 'live' || existing?.status === 'failed'
  const acceptedStatus = terminal && existing.status !== event.status ? existing.status : event.status
  const data = {
    ...(existing ? {} : { requestId: crypto.randomUUID(), buildId: event.buildId, branch: event.branch, createdAt: now }),
    ...(existing && !existing.buildId ? { buildId: event.buildId, branch: event.branch } : {}),
    status: acceptedStatus,
    commitSha: event.commitSha,
    errorCode: acceptedStatus === 'failed' ? event.errorCode || 'unknown' : undefined,
    completedAt: acceptedStatus === 'live' || acceptedStatus === 'failed' ? now : undefined,
  }
  if (existing) await payload.update({ collection: 'site-builds', id: existing.id, overrideAccess: true, data: data as never })
  else await payload.create({ collection: 'site-builds', overrideAccess: true, data: data as never })
  return true
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

function isStaleBuild(record: SiteBuildRecord) {
  if (!['queued', 'building', 'deploying'].includes(record.status)) return false
  const lastActivity = Date.parse(record.updatedAt || record.createdAt)
  return Number.isFinite(lastActivity) && Date.now() - lastActivity > BUILD_STALE_AFTER_MS
}

async function markBuildStale(payload: Payload, record: SiteBuildRecord): Promise<SiteBuildRecord> {
  const updated = await payload.update({ collection: 'site-builds', id: record.id, overrideAccess: true, data: {
    status: 'failed',
    errorCode: 'callback_timeout',
    completedAt: new Date().toISOString(),
  } as never })
  return updated as unknown as SiteBuildRecord
}

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}

type SiteBuildRecord = {
  id: string | number
  status: SiteBuildStatus
  requestId: string
  buildId?: string
  branch: string
  commitSha?: string
  articleSlug?: string
  triggerReason?: string
  errorCode?: string
  createdAt: string
  updatedAt?: string
  completedAt?: string
}

async function attachBuildId(payload: Payload, pending: SiteBuildRecord, buildId: string) {
  let existing = await findBuild(payload, buildId)
  if (existing) {
    if (pending.id !== existing.id) {
      const pendingActivity = Date.parse(pending.updatedAt || pending.createdAt)
      const existingActivity = Date.parse(existing.updatedAt || existing.createdAt)
      if (Number.isFinite(pendingActivity) && pendingActivity > existingActivity) {
        existing = await payload.update({ collection: 'site-builds', id: existing.id, overrideAccess: true, data: {
          requestId: pending.requestId,
          articleSlug: pending.articleSlug,
          triggerReason: pending.triggerReason,
        } as never }) as unknown as SiteBuildRecord
      }
      await payload.delete({ collection: 'site-builds', id: pending.id, overrideAccess: true })
    }
    return publicBuildRecord(existing)
  }

  try {
    const updated = await payload.update({ collection: 'site-builds', id: pending.id, overrideAccess: true, data: { buildId } as never })
    return publicBuildRecord(updated as unknown as SiteBuildRecord)
  } catch (error) {
    existing = await findBuild(payload, buildId)
    if (!existing) throw error
    if (pending.id !== existing.id) {
      const pendingActivity = Date.parse(pending.updatedAt || pending.createdAt)
      const existingActivity = Date.parse(existing.updatedAt || existing.createdAt)
      if (Number.isFinite(pendingActivity) && pendingActivity > existingActivity) {
        existing = await payload.update({ collection: 'site-builds', id: existing.id, overrideAccess: true, data: {
          requestId: pending.requestId,
          articleSlug: pending.articleSlug,
          triggerReason: pending.triggerReason,
        } as never }) as unknown as SiteBuildRecord
      }
      await payload.delete({ collection: 'site-builds', id: pending.id, overrideAccess: true })
    }
    return publicBuildRecord(existing)
  }
}

async function findActiveBuild(payload: Payload, branch: string): Promise<SiteBuildRecord | undefined> {
  const found = await payload.find({ collection: 'site-builds', limit: 10, depth: 0, sort: '-createdAt', overrideAccess: true, where: {
    and: [{ branch: { equals: branch } }, { status: { in: ['queued', 'building', 'deploying'] } }],
  } })
  for (const value of found.docs) {
    const record = value as unknown as SiteBuildRecord
    if (isStaleBuild(record)) {
      await markBuildStale(payload, record)
      continue
    }
    return record
  }
  return undefined
}

async function findUnassignedQueuedBuild(payload: Payload, branch: string): Promise<SiteBuildRecord | undefined> {
  const found = await payload.find({ collection: 'site-builds', limit: 10, depth: 0, sort: '-createdAt', overrideAccess: true, where: {
    and: [{ branch: { equals: branch } }, { status: { equals: 'queued' } }],
  } })
  return found.docs.find((doc) => !('buildId' in doc) || !doc.buildId) as unknown as SiteBuildRecord | undefined
}

async function findBuildRecordById(payload: Payload, id: SiteBuildRecord['id']): Promise<SiteBuildRecord | undefined> {
  const found = await payload.find({ collection: 'site-builds', limit: 1, depth: 0, overrideAccess: true, where: { id: { equals: id } } })
  return found.docs[0] as unknown as SiteBuildRecord | undefined
}
