import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestBuild, siteBuildEndpoints } from '@/endpoints/siteBuilds'

const buildId = '8aa4ab24-74bd-4bb6-a082-443b1d4fb3d2'

function handler(path: string, method: string) {
  const endpoint = siteBuildEndpoints.find((item) => item.path === path && item.method === method)
  if (!endpoint?.handler) throw new Error(`Missing endpoint ${method} ${path}`)
  return endpoint.handler as unknown as (req: unknown) => Promise<Response>
}

function request(path: string, method = 'GET', headers?: HeadersInit, body?: unknown, user?: { id: number; role: string }, payload = {}) {
  const requestHeaders = new Headers(headers)
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  const request = new Request(`https://tungphat-payload-cms-staging.nkhaduy.workers.dev/api${path}`, {
    method, headers: requestHeaders, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  return Object.assign(request, { user, payload })
}

describe('Workers Builds status endpoint authorization', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('does not reveal build status to anonymous callers', async () => {
    const find = vi.fn()
    const response = await handler('/site-builds/status', 'get')(request('/site-builds/status', 'GET', undefined, undefined, undefined, { find }))
    expect(response.status).toBe(401)
    expect(find).not.toHaveBeenCalled()
  })

  it('requires the callback bearer secret and the fixed preview branch', async () => {
    vi.stubEnv('SITE_BUILD_CALLBACK_SECRET', 'S'.repeat(64))
    const create = vi.fn().mockResolvedValue({ id: 1, status: 'building' })
    const payload = { find: vi.fn().mockResolvedValue({ docs: [] }), create }
    const denied = await handler('/site-builds/events', 'post')(request('/site-builds/events', 'POST', undefined, { buildId, branch: 'codex/editorial-cms', commitSha: 'a'.repeat(40), status: 'building' }, undefined, payload))
    expect(denied.status).toBe(401)

    const wrongBranch = await handler('/site-builds/events', 'post')(request('/site-builds/events', 'POST', { Authorization: `Bearer ${'S'.repeat(64)}` }, { buildId, branch: 'main', commitSha: 'a'.repeat(40), status: 'building' }, undefined, payload))
    expect(wrongBranch.status).toBe(400)
    expect(create).not.toHaveBeenCalled()

    const accepted = await handler('/site-builds/events', 'post')(request('/site-builds/events', 'POST', { Authorization: `Bearer ${'S'.repeat(64)}` }, { buildId, branch: 'codex/editorial-cms', commitSha: 'a'.repeat(40), status: 'building' }, undefined, payload))
    expect(accepted.status).toBe(202)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'site-builds', overrideAccess: true }))
  })

  it('restricts retry to publishers and same-origin admin requests', async () => {
    vi.stubEnv('PAYLOAD_PUBLIC_SERVER_URL', 'https://tungphat-payload-cms-staging.nkhaduy.workers.dev')
    const find = vi.fn()
    const payload = { find }
    const editor = await handler('/site-builds/retry', 'post')(request('/site-builds/retry', 'POST', { Origin: 'https://tungphat-payload-cms-staging.nkhaduy.workers.dev' }, {}, { id: 2, role: 'editor' }, payload))
    expect(editor.status).toBe(403)
    const crossSite = await handler('/site-builds/retry', 'post')(request('/site-builds/retry', 'POST', { Origin: 'https://attacker.example' }, {}, { id: 1, role: 'super-admin' }, payload))
    expect(crossSite.status).toBe(403)
    expect(find).not.toHaveBeenCalled()
  })

  it('preserves an unpublish action when retrying a failed build', async () => {
    vi.stubEnv('PAYLOAD_PUBLIC_SERVER_URL', 'https://tungphat-payload-cms-staging.nkhaduy.workers.dev')
    vi.stubEnv('SITE_REBUILD_HOOK_URL', 'https://api.cloudflare.com/client/v4/accounts/account/builds/hooks/hook')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: { build_uuid: buildId },
    }), { status: 202, headers: { 'content-type': 'application/json' } })))
    const previous = { id: 3, status: 'failed', branch: 'codex/editorial-cms', articleSlug: 'qa-article', triggerReason: 'unpublish' }
    const find = vi.fn().mockResolvedValue({ docs: [] }).mockResolvedValueOnce({ docs: [previous] })
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 4, ...data }))
    const update = vi.fn().mockImplementation(({ id, data }) => Promise.resolve({ id, status: 'queued', branch: 'codex/editorial-cms', ...data }))
    const payload = { find, create, update }
    const response = await handler('/site-builds/retry', 'post')(request('/site-builds/retry', 'POST', {
      Origin: 'https://tungphat-payload-cms-staging.nkhaduy.workers.dev',
    }, {}, { id: 1, role: 'super-admin' }, payload))

    expect(response.status).toBe(202)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      articleSlug: 'qa-article',
      triggerReason: 'unpublish',
    }) }))
  })

  it('coalesces a publish change into the active build instead of sending another hook', async () => {
    vi.stubEnv('SITE_REBUILD_HOOK_URL', 'https://api.cloudflare.com/client/v4/accounts/account/builds/hooks/hook')
    const active = { id: 9, requestId: 'old-request', buildId, status: 'building', branch: 'codex/editorial-cms', articleSlug: 'old-article', triggerReason: 'publish', createdAt: new Date().toISOString() }
    const find = vi.fn().mockResolvedValue({ docs: [active] })
    const update = vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...active, ...data }))
    const fetch = vi.fn<typeof globalThis.fetch>()
    vi.stubGlobal('fetch', fetch)
    const result = await requestBuild({ find, update } as never, { articleSlug: 'next-article', reason: 'publish' })

    expect(result).toMatchObject({ status: 'building', buildId, articleSlug: 'next-article' })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ articleSlug: 'next-article' }) }))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not coalesce into a build whose status callback has gone stale', async () => {
    vi.stubEnv('SITE_REBUILD_HOOK_URL', 'https://api.cloudflare.com/client/v4/accounts/account/builds/hooks/hook')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: { build_uuid: buildId },
    }), { status: 202, headers: { 'content-type': 'application/json' } })))
    const stale = {
      id: 19,
      requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      buildId,
      status: 'building',
      branch: 'codex/editorial-cms',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }
    const find = vi.fn().mockImplementation(({ where }) => Promise.resolve({ docs: where?.buildId ? [] : [stale] }))
    const update = vi.fn().mockImplementation(({ id, data }) => Promise.resolve({ id, status: 'queued', branch: 'codex/editorial-cms', ...data }))
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 20, ...data }))
    const result = await requestBuild({ find, update, create } as never, { articleSlug: 'new-article', reason: 'publish' })

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      id: stale.id,
      data: expect.objectContaining({ status: 'failed', errorCode: 'callback_timeout' }),
    }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ articleSlug: 'new-article' }) }))
    expect(result).toMatchObject({ status: 'queued' })
  })

  it('keeps the latest publish context when a hook response races its callback', async () => {
    vi.stubEnv('SITE_REBUILD_HOOK_URL', 'https://api.cloudflare.com/client/v4/accounts/account/builds/hooks/hook')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: { build_uuid: buildId },
    }), { status: 202, headers: { 'content-type': 'application/json' } })))
    const latest = {
      id: 21,
      requestId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      buildId,
      status: 'building',
      branch: 'codex/editorial-cms',
      articleSlug: 'newer-article',
      triggerReason: 'unpublish',
      createdAt: new Date().toISOString(),
    }
    const find = vi.fn().mockImplementation(({ where }) => Promise.resolve({ docs: where?.buildId ? [latest] : [] }))
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 22, ...data }))
    const update = vi.fn()
    const deleteRecord = vi.fn()
    const result = await requestBuild({ find, create, update, delete: deleteRecord } as never, { articleSlug: 'older-article', reason: 'publish' })

    expect(result).toMatchObject({ status: 'building', articleSlug: 'newer-article', triggerReason: 'unpublish' })
    expect(update).not.toHaveBeenCalled()
    expect(deleteRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 22, collection: 'site-builds' }))
  })

  it('does not fail a build callback already accepted when the hook request times out', async () => {
    vi.stubEnv('SITE_REBUILD_HOOK_URL', 'https://api.cloudflare.com/client/v4/accounts/account/builds/hooks/hook')
    let current: Record<string, unknown> | undefined
    const find = vi.fn().mockImplementation(({ where }) => Promise.resolve({ docs: where?.id ? current ? [current] : [] : [] }))
    const create = vi.fn().mockImplementation(({ data }) => {
      current = { id: 23, ...data }
      return Promise.resolve(current)
    })
    const update = vi.fn().mockImplementation(({ data }) => {
      current = { ...current, requestId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', articleSlug: 'newer-article', triggerReason: 'unpublish', ...data }
      return Promise.resolve(current)
    })
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async () => {
      current = { ...current, requestId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', articleSlug: 'newer-article', triggerReason: 'unpublish', buildId, status: 'building' }
      return new Response(null, { status: 503 })
    }))

    const result = await requestBuild({ find, create, update } as never, { articleSlug: 'older-article', reason: 'publish' })

    expect(result).toMatchObject({ status: 'building', articleSlug: 'newer-article', triggerReason: 'unpublish' })
    expect(update).not.toHaveBeenCalled()
    expect(current).toMatchObject({ articleSlug: 'newer-article', triggerReason: 'unpublish', status: 'building' })
  })

  it('rejects a live callback for an outdated publish request', async () => {
    vi.stubEnv('SITE_BUILD_CALLBACK_SECRET', 'S'.repeat(64))
    const existing = { id: 11, requestId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', buildId, status: 'deploying', branch: 'codex/editorial-cms', createdAt: new Date().toISOString() }
    const find = vi.fn().mockResolvedValue({ docs: [existing] })
    const update = vi.fn()
    const payload = { find, update }
    const response = await handler('/site-builds/events', 'post')(request('/site-builds/events', 'POST', {
      Authorization: `Bearer ${'S'.repeat(64)}`,
    }, {
      buildId,
      branch: 'codex/editorial-cms',
      commitSha: 'a'.repeat(40),
      status: 'live',
      requestId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    }, undefined, payload))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'stale_context' })
    expect(update).not.toHaveBeenCalled()
  })
})
