export type ArticleStatus = 'draft' | 'published' | undefined

export function shouldTriggerSiteBuild(cmsEnvironment: string | undefined) {
  return cmsEnvironment === 'staging'
}

export type ArticlePublicationEvent = {
  operation: 'create' | 'update' | 'delete'
  status?: ArticleStatus
  previousStatus?: ArticleStatus
  submittedStatus?: ArticleStatus
  publicContentChanged?: boolean
  autosave?: boolean
}

const PUBLIC_ARTICLE_FIELDS = [
  'title', 'slug', 'excerpt', 'editorContent', 'body', 'legacyBodyHidden', 'category', 'tags', 'author',
  'relatedProducts', 'relatedArticles', 'faq', 'featuredImage', 'featuredImageAlt', 'gallery', 'publishedAt',
  'featured', 'seo',
] as const

/** Ignore Payload timestamps, build metadata and other fields that do not change the public page. */
export function hasPublicArticleChanged(previous: Record<string, unknown> | undefined, next: Record<string, unknown> | undefined) {
  if (!previous || !next) return true
  return PUBLIC_ARTICLE_FIELDS.some((field) => stableSerialize(previous[field]) !== stableSerialize(next[field]))
}

export function shouldRebuildPublishedSite(event: ArticlePublicationEvent): boolean {
  if (event.autosave) return false
  if (event.operation === 'delete') return event.previousStatus === 'published'
  if (event.previousStatus !== 'published' && event.status === 'published') return true
  if (event.operation === 'update' && event.previousStatus === 'published' && event.status === 'draft') return true
  return event.operation === 'update'
    && event.previousStatus === 'published'
    && event.status === 'published'
    && event.publicContentChanged === true
}

export type SiteRebuildResult =
  | { status: 'disabled' }
  | { status: 'invalid-hook' }
  | { status: 'queued'; httpStatus: number; buildId?: string }
  | { status: 'failed'; httpStatus?: number }

export async function triggerStaticSiteRebuild({
  hookUrl = process.env.SITE_REBUILD_HOOK_URL,
  fetchImpl = fetch,
}: {
  hookUrl?: string
  fetchImpl?: typeof fetch
} = {}): Promise<SiteRebuildResult> {
  if (!hookUrl) return { status: 'disabled' }

  let target: URL
  try {
    target = new URL(hookUrl)
  } catch {
    return { status: 'invalid-hook' }
  }
  if (!isCloudflareDeployHook(target)) return { status: 'invalid-hook' }

  try {
    const response = await fetchImpl(target, { method: 'POST', signal: AbortSignal.timeout(5_000) })
    const responseBody = await response.json().catch(() => null) as { success?: unknown; result?: { build_uuid?: unknown } } | null
    if (response.ok && responseBody?.success === true) {
      const buildId = typeof responseBody.result?.build_uuid === 'string' ? responseBody.result.build_uuid : undefined
      return { status: 'queued', httpStatus: response.status, ...(buildId ? { buildId } : {}) }
    }
    return { status: 'failed', httpStatus: response.status }
  } catch {
    return { status: 'failed' }
  }
}

export function isCloudflareDeployHook(target: URL) {
  return target.protocol === 'https:'
    && target.hostname === 'api.cloudflare.com'
    && !target.username
    && !target.password
    && !target.search
    && !target.hash
    && /^\/client\/v4\/accounts\/[A-Za-z0-9_-]+\/builds\/hooks\/[A-Za-z0-9_-]+\/?$/u.test(target.pathname)
}

/** Constant-work comparison for a high-entropy callback bearer secret. */
export function matchesSecret(expected: string | undefined, supplied: string | undefined) {
  if (!expected || !supplied) return false
  const left = new TextEncoder().encode(expected)
  const right = new TextEncoder().encode(supplied)
  let difference = left.length ^ right.length
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) difference |= (left[index] ?? 0) ^ (right[index] ?? 0)
  return difference === 0
}

export function parseSiteBuildEvent(value: unknown, expectedBranch: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const event = value as Record<string, unknown>
  if (typeof event.buildId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu.test(event.buildId)) return undefined
  if (event.branch !== expectedBranch || typeof event.commitSha !== 'string' || !/^[a-f0-9]{40}$/iu.test(event.commitSha)) return undefined
  if (!['building', 'deploying', 'live', 'failed'].includes(String(event.status))) return undefined
  if (event.requestId !== undefined && (typeof event.requestId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu.test(event.requestId))) return undefined
  if (event.errorCode !== undefined && !['artifact_validation', 'deploy_failed', 'preview_probe_failed', 'payload_unavailable', 'unknown'].includes(String(event.errorCode))) return undefined
  return {
    buildId: event.buildId,
    branch: event.branch,
    commitSha: event.commitSha,
    status: event.status as 'building' | 'deploying' | 'live' | 'failed',
    ...(event.requestId ? { requestId: event.requestId } : {}),
    ...(event.errorCode ? { errorCode: event.errorCode as 'artifact_validation' | 'deploy_failed' | 'preview_probe_failed' | 'payload_unavailable' | 'unknown' } : {}),
  }
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !['id', 'createdAt', 'updatedAt', '_status', 'version'].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableSerialize(child)}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}
