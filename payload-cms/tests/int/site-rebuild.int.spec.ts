import { describe, expect, it, vi } from 'vitest'
import { hasPublicArticleChanged, matchesSecret, parseSiteBuildEvent, shouldRebuildPublishedSite, triggerStaticSiteRebuild } from '@/security/siteRebuild'

describe('static site rebuild triggers', () => {
  it('queues publish transitions and deletes, but only public-content changes for published updates', () => {
    expect(shouldRebuildPublishedSite({ operation: 'create', status: 'published' })).toBe(true)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'published', previousStatus: 'published', publicContentChanged: true })).toBe(true)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'published', previousStatus: 'published', publicContentChanged: false })).toBe(false)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'published', previousStatus: 'draft', publicContentChanged: true })).toBe(true)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'draft', submittedStatus: 'draft', previousStatus: 'published' })).toBe(true)
    expect(shouldRebuildPublishedSite({ operation: 'delete', previousStatus: 'published' })).toBe(true)
  })

  it('detects public article fields without treating Payload bookkeeping as published content', () => {
    const before = { title: 'Tấm MDF', slug: 'tam-mdf', updatedAt: '2026-01-01', _status: 'published', editorContent: { root: { children: [] } } }
    expect(hasPublicArticleChanged(before, { ...before, updatedAt: '2026-01-02' })).toBe(false)
    expect(hasPublicArticleChanged(before, { ...before, editorContent: { root: { children: [{ type: 'paragraph' }] } } })).toBe(true)
    expect(hasPublicArticleChanged(before, { ...before, title: 'Tấm MDF chống ẩm' })).toBe(true)
  })

  it('authenticates callbacks and rejects events from any other branch', () => {
    expect(matchesSecret('a'.repeat(64), 'a'.repeat(64))).toBe(true)
    expect(matchesSecret('a'.repeat(64), 'b'.repeat(64))).toBe(false)
    expect(matchesSecret('', 'a'.repeat(64))).toBe(false)
    const event = { buildId: '8aa4ab24-74bd-4bb6-a082-443b1d4fb3d2', branch: 'codex/editorial-cms', commitSha: 'a'.repeat(40), status: 'live' }
    expect(parseSiteBuildEvent(event, 'codex/editorial-cms')).toMatchObject({ status: 'live' })
    expect(parseSiteBuildEvent({ ...event, branch: 'main' }, 'codex/editorial-cms')).toBeUndefined()
    expect(parseSiteBuildEvent({ ...event, status: 'queued' }, 'codex/editorial-cms')).toBeUndefined()
  })

  it('does not rebuild for drafts or autosaves', () => {
    expect(shouldRebuildPublishedSite({ operation: 'create', status: 'draft' })).toBe(false)
    expect(shouldRebuildPublishedSite({ operation: 'update', status: 'draft', previousStatus: 'published', submittedStatus: 'draft', autosave: true })).toBe(false)
    expect(shouldRebuildPublishedSite({ operation: 'delete', previousStatus: 'draft' })).toBe(false)
  })

  it('accepts only HTTPS Cloudflare Deploy Hooks and retries transient responses', async () => {
    expect(await triggerStaticSiteRebuild({ hookUrl: 'http://api.cloudflare.com/builds/hooks/test' })).toEqual({ status: 'invalid-hook' })
    expect(await triggerStaticSiteRebuild({ hookUrl: 'https://api.cloudflare.com/client/v4/accounts/account/workers/scripts' })).toEqual({ status: 'invalid-hook' })
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
