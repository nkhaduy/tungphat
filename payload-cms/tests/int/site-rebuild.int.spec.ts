import { describe, expect, it, vi } from 'vitest'
import { shouldRebuildPublishedSite, triggerStaticSiteRebuild } from '@/security/siteRebuild'

describe('static site rebuild triggers', () => {
  it('queues new and updated published articles, unpublishes, and deletions', () => {
    expect(shouldRebuildPublishedSite({ operation: 'create', status: 'published' })).toBe(true)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'published', previousStatus: 'published' })).toBe(true)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'draft', submittedStatus: 'draft', previousStatus: 'published' })).toBe(true)
    expect(shouldRebuildPublishedSite({ operation: 'delete', previousStatus: 'published' })).toBe(true)
  })

  it('does not rebuild for drafts or autosaves', () => {
    expect(shouldRebuildPublishedSite({ operation: 'create', status: 'draft' })).toBe(false)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'draft', previousStatus: 'published', submittedStatus: 'draft', autosave: true })).toBe(false)
    expect(shouldRebuildPublishedSite({ operation: 'delete', previousStatus: 'draft' })).toBe(false)
  })

  it('accepts only HTTPS Cloudflare hooks and retries transient responses', async () => {
    expect(await triggerStaticSiteRebuild({ hookUrl: 'http://api.cloudflare.com/builds/hooks/test' })).toEqual({ status: 'invalid-hook' })
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, result: { build_uuid: 'build-123' } }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      }))
    const delay = vi.fn(async () => undefined)
    const result = await triggerStaticSiteRebuild({
      hookUrl: 'https://api.cloudflare.com/client/v4/accounts/account/builds/hooks/hook',
      fetchImpl,
      delay,
    })
    expect(result).toEqual({ status: 'queued', httpStatus: 202, buildId: 'build-123' })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(delay).toHaveBeenCalledOnce()
  })
})
