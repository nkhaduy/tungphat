type ArticleStatus = 'draft' | 'published' | undefined

export type ArticlePublicationEvent = {
  operation: 'create' | 'update' | 'delete'
  status?: ArticleStatus
  previousStatus?: ArticleStatus
  submittedStatus?: ArticleStatus
  autosave?: boolean
}

export function shouldRebuildPublishedSite(event: ArticlePublicationEvent): boolean {
  if (event.autosave) return false
  if (event.operation === 'delete') return event.previousStatus === 'published'
  if (event.status === 'published') return true
  return event.operation === 'update'
    && event.previousStatus === 'published'
    && event.submittedStatus === 'draft'
}

export type SiteRebuildResult =
  | { status: 'disabled' }
  | { status: 'invalid-hook' }
  | { status: 'queued'; httpStatus: number; buildId?: string }
  | { status: 'failed'; httpStatus?: number }

export async function triggerStaticSiteRebuild({
  hookUrl = process.env.SITE_REBUILD_HOOK_URL,
  fetchImpl = fetch,
  delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
}: {
  hookUrl?: string
  fetchImpl?: typeof fetch
  delay?: (milliseconds: number) => Promise<unknown>
} = {}): Promise<SiteRebuildResult> {
  if (!hookUrl) return { status: 'disabled' }

  let target: URL
  try {
    target = new URL(hookUrl)
  } catch {
    return { status: 'invalid-hook' }
  }
  if (target.protocol !== 'https:' || target.hostname !== 'api.cloudflare.com') return { status: 'invalid-hook' }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(target, { method: 'POST', signal: AbortSignal.timeout(5_000) })
      if (response.ok) {
        const responseBody = await response.json().catch(() => null) as { result?: { build_uuid?: unknown } } | null
        const buildId = typeof responseBody?.result?.build_uuid === 'string' ? responseBody.result.build_uuid : undefined
        return { status: 'queued', httpStatus: response.status, ...(buildId ? { buildId } : {}) }
      }
      const retryable = response.status === 429 || response.status >= 500
      if (!retryable || attempt === 2) return { status: 'failed', httpStatus: response.status }
    } catch {
      if (attempt === 2) return { status: 'failed' }
    }
    await delay(250 * (attempt + 1))
  }
  return { status: 'failed' }
}
