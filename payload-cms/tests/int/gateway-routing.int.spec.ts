import { afterEach, describe, expect, it, vi } from 'vitest'
// The Pages gateway is deployed directly as JavaScript rather than compiled with Payload.
// @ts-expect-error No declaration file is emitted for the standalone gateway worker.
import gateway from '../../gateway/_worker.js'

describe('Pages hostname gateway', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('maps canonical CDN paths to the Payload R2 media route without changing the browser URL', async () => {
    const upstreamFetch = vi.fn(async (_request: Request) => new Response(null, {
      status: 200,
      headers: { 'content-type': 'image/webp' },
    }))
    vi.stubGlobal('fetch', upstreamFetch)

    const response = await gateway.fetch(new Request(
      'https://cdn.mdftungphat.com/catalog/thanh-thuy/sample.webp?version=1',
      { method: 'HEAD' },
    ))

    expect(response.status).toBe(200)
    const upstream = upstreamFetch.mock.calls[0]?.[0] as Request
    expect(upstream.url).toBe('https://tungphat-payload-cms.nkhaduy.workers.dev/media/catalog/thanh-thuy/sample.webp?version=1')
    expect(upstream.method).toBe('HEAD')
    expect(upstream.headers.get('x-forwarded-host')).toBe('cdn.mdftungphat.com')
  })

  it('keeps CMS requests unchanged and rejects non-media CDN paths', async () => {
    const upstreamFetch = vi.fn(async (_request: Request) => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', upstreamFetch)

    await gateway.fetch(new Request('https://cms.mdftungphat.com/api/health'))
    expect((upstreamFetch.mock.calls[0]?.[0] as Request).url).toBe('https://tungphat-payload-cms.nkhaduy.workers.dev/api/health')

    const rejected = await gateway.fetch(new Request('https://cdn.mdftungphat.com/api/health'))
    expect(rejected.status).toBe(404)
    expect(upstreamFetch).toHaveBeenCalledTimes(1)
  })

  it('retries transient public content failures once', async () => {
    const upstreamFetch = vi.fn()
      .mockResolvedValueOnce(new Response('temporary failure', { status: 503 }))
      .mockResolvedValueOnce(new Response('{"docs":[]}', { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', upstreamFetch)

    const response = await gateway.fetch(new Request('https://cms.mdftungphat.com/api/pages?limit=100&depth=1&sort=slug'))

    expect(response.status).toBe(200)
    expect(upstreamFetch).toHaveBeenCalledTimes(2)
  })

  it('serves public content cache hits without calling the Payload Worker', async () => {
    const upstreamFetch = vi.fn()
    const cache = { match: vi.fn(async () => new Response('{"docs":[{"slug":"cached"}]}', { status: 200 })), put: vi.fn() }
    vi.stubGlobal('fetch', upstreamFetch)
    vi.stubGlobal('caches', { default: cache })

    const response = await gateway.fetch(new Request('https://cms.mdftungphat.com/api/articles?limit=100&depth=1&sort=slug'))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('cached')
    expect(upstreamFetch).not.toHaveBeenCalled()
    expect(cache.match).toHaveBeenCalledTimes(1)
  })
})
