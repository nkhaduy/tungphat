const PAYLOAD_UPSTREAM = 'https://tungphat-payload-cms.nkhaduy.workers.dev'
const CDN_HOST = 'cdn.mdftungphat.com'
const CDN_MEDIA_PATH = /^\/(?:catalog|gallery|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$)/
const PUBLIC_CONTENT_PATH = /^\/api\/(?:articles|pages|products|projects)(?:\/|$)/

function upstreamPath(incoming) {
  if (incoming.hostname !== CDN_HOST) return incoming.pathname
  const pathname = incoming.pathname.replace(/^\/media(?=\/)/, '')
  return CDN_MEDIA_PATH.test(pathname) ? `/media${pathname}` : undefined
}

const gateway = {
  async fetch(request) {
    const incoming = new URL(request.url)
    const pathname = upstreamPath(incoming)
    if (!pathname) return new Response('Not found', { status: 404 })
    const upstream = new URL(`${pathname}${incoming.search}`, PAYLOAD_UPSTREAM)
    const headers = new Headers(request.headers)
    headers.set('X-Forwarded-Host', incoming.host)
    headers.set('X-Forwarded-Proto', 'https')

    const cacheable = isPublicContentRequest(request, incoming)
    const cache = cacheable ? getEdgeCache() : undefined
    const cacheKey = cacheable ? new Request(incoming, { method: 'GET' }) : undefined
    if (cache && cacheKey) {
      try {
        const cached = await cache.match(cacheKey)
        if (cached) return cached
      } catch {
        // A cache failure should not take down the CMS gateway.
      }
    }

    let response
    for (let attempt = 0; attempt < 2; attempt += 1) {
      response = await fetch(new Request(upstream, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      }))
      if (request.method !== 'GET' || response.status !== 503 || attempt === 1) break
    }

    if (cache && cacheKey && response.ok) {
      const cacheHeaders = new Headers(response.headers)
      cacheHeaders.set('Cache-Control', 'public, max-age=30, s-maxage=300, stale-while-revalidate=60')
      const cacheableResponse = new Response(response.body, { status: response.status, statusText: response.statusText, headers: cacheHeaders })
      try {
        await cache.put(cacheKey, cacheableResponse.clone())
      } catch {
        // Return the live response even when edge storage is unavailable.
      }
      return cacheableResponse
    }

    return response
  },
}

function isPublicContentRequest(request, incoming) {
  return request.method === 'GET'
    && incoming.hostname === 'cms.mdftungphat.com'
    && PUBLIC_CONTENT_PATH.test(incoming.pathname)
    && !request.headers.has('cookie')
    && !request.headers.has('authorization')
}

function getEdgeCache() {
  try {
    return typeof caches === 'undefined' ? undefined : caches.default
  } catch {
    return undefined
  }
}

export default gateway
