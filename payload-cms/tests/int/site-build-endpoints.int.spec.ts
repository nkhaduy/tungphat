import { afterEach, describe, expect, it, vi } from 'vitest'
import { siteBuildEndpoints } from '@/endpoints/siteBuilds'

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
    const find = vi.fn().mockResolvedValueOnce({ docs: [previous] }).mockResolvedValueOnce({ docs: [] })
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 4, ...data }))
    const payload = { find, create }
    const response = await handler('/site-builds/retry', 'post')(request('/site-builds/retry', 'POST', {
      Origin: 'https://tungphat-payload-cms-staging.nkhaduy.workers.dev',
    }, {}, { id: 1, role: 'super-admin' }, payload))

    expect(response.status).toBe(202)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      articleSlug: 'qa-article',
      triggerReason: 'unpublish',
    }) }))
  })
})
