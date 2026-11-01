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

describe('Free-tier fast paths', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('answers allowed form preflight without an upstream request', async () => {
    const upstream = vi.fn(async () => new Response('CPU exhausted', { status: 503 }))
    vi.stubGlobal('fetch', upstream)
    const response = await gateway.fetch(new Request('https://cms.mdftungphat.com/api/contact', {
      method: 'OPTIONS', headers: { Origin: 'https://mdftungphat.com', 'Access-Control-Request-Method': 'POST' },
    }))
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('https://mdftungphat.com')
    expect(response.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejects hostile preflight origins without forwarding them', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await gateway.fetch(new Request('https://cms.mdftungphat.com/api/quote/', {
      method: 'OPTIONS', headers: { Origin: 'https://attacker.example' },
    }))
    expect(response.status).toBe(403)
    expect(response.headers.has('access-control-allow-origin')).toBe(false)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('streams R2 bytes directly, handles HEAD and preserves original metadata', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const get = vi.fn(async () => ({ body: new Uint8Array([1, 2, 3]), size: 3, range: { offset: 0, length: 3 }, httpEtag: '"original"', httpMetadata: { contentType: 'image/webp' } }))
    const response = await gateway.fetch(new Request('https://cdn.mdftungphat.com/catalog/a.webp'), { R2: { get } })
    expect(response.status).toBe(200)
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
    expect(response.headers.get('etag')).toBe('"original"')
    expect(response.headers.get('content-type')).toBe('image/webp')
    expect(get).toHaveBeenCalledWith('catalog/a.webp', expect.objectContaining({ onlyIf: expect.any(Headers) }))
    expect(upstream).not.toHaveBeenCalled()
    const head = await gateway.fetch(new Request('https://cms.mdftungphat.com/media/catalog/a.webp', { method: 'HEAD' }), { R2: { get } })
    expect(await head.text()).toBe('')
    expect(head.headers.get('content-length')).toBe('3')
  })

  it('returns direct-media 404s and never accepts media writes', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const env = { R2: { get: vi.fn(async () => null) } }
    expect((await gateway.fetch(new Request('https://cdn.mdftungphat.com/catalog/missing.webp'), env)).status).toBe(404)
    expect((await gateway.fetch(new Request('https://cdn.mdftungphat.com/catalog/a.webp', { method: 'DELETE' }), env)).status).toBe(405)
  })
})

it('serves archived originals at the same canonical URL when the R2 copy is absent', async () => {
  const { readFileSync } = await import('node:fs')
  const manifest = JSON.parse(readFileSync('gateway/media-archive-manifest.json', 'utf8'))
  const key = manifest.objects[0].key
  const upstream = vi.fn(async (request: Request) => {
    expect(request.url).toBe(`${manifest.origin}/${key}`)
    expect(request.headers.has('cookie')).toBe(false)
    return new Response(new Uint8Array([9, 8, 7]), { headers: { 'content-type': 'image/jpeg' } })
  })
  vi.stubGlobal('fetch', upstream)
  const response = await gateway.fetch(new Request(`https://cdn.mdftungphat.com/${key}`, { headers: { Cookie: 'private=1' } }), { R2: { get: async () => null } })
  expect(response.status).toBe(200)
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([9, 8, 7]))
})

// Direct R2 delivery must preserve browser cache revalidation and ranged media.
it('returns 304 for conditional reads and 206 with the correct range length', async () => {
  const metadata = { size: 100, httpEtag: '"original"', httpMetadata: { contentType: 'video/mp4' } }
  const unchanged = await gateway.fetch(new Request('https://cdn.mdftungphat.com/videos/a.mp4', { headers: { 'If-None-Match': '"original"' } }), { R2: { get: async () => metadata } })
  expect(unchanged.status).toBe(304)
  expect(await unchanged.text()).toBe('')
  const get = vi.fn(async () => ({ ...metadata, body: new Uint8Array([1, 2, 3]), range: { offset: 4, length: 3 } }))
  const partial = await gateway.fetch(new Request('https://cdn.mdftungphat.com/videos/a.mp4', { headers: { Range: 'bytes=4-6' } }), { R2: { get } })
  expect(partial.status).toBe(206)
  expect(partial.headers.get('content-range')).toBe('bytes 4-6/100')
  expect(partial.headers.get('content-length')).toBe('3')
  expect((await partial.arrayBuffer()).byteLength).toBe(3)
})

it('can verify archive delivery in preview before removing any R2 original', async () => {
  const { readFileSync } = await import('node:fs')
  const manifest = JSON.parse(readFileSync('gateway/media-archive-manifest.json', 'utf8'))
  const get = vi.fn()
  const upstream = vi.fn(async () => new Response('verified archive bytes'))
  vi.stubGlobal('fetch', upstream)
  const response = await gateway.fetch(new Request(`https://gateway-free.tungphat-light-cms-production.pages.dev/${manifest.objects[0].key}`), { R2: { get }, ARCHIVE_FIRST: 'true' })
  expect(await response.text()).toBe('verified archive bytes')
  expect(get).not.toHaveBeenCalled()
  expect(upstream).toHaveBeenCalledOnce()
})
