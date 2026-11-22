import archive from './media-archive-manifest.json'
const archivedKeys = new Set(archive.objects.map(object => object.key))
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
  async fetch(request, env = {}) {
    const incoming = new URL(request.url)
    if (request.method === 'OPTIONS' && /^\/api\/(?:contact|quote)\/?$/.test(incoming.pathname) && incoming.hostname !== CDN_HOST) return formPreflight(request)
    const key = mediaKey(incoming)
    if (key && env.R2) return directMedia(request, env.R2, key, env.ARCHIVE_FIRST === 'true')
    const pathname = upstreamPath(incoming)
    if (!pathname) return new Response('Not found', { status: 404 })
    const upstream = new URL(`${pathname}${incoming.search}`, env.PAYLOAD_UPSTREAM || PAYLOAD_UPSTREAM)
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

function formPreflight(request) {
  const origin = request.headers.get('Origin')
  const allowed = origin === 'https://mdftungphat.com' || origin === 'https://www.mdftungphat.com'
  const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive', Vary: 'Origin' })
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')
  }
  return new Response(null, { status: allowed ? 204 : 403, headers })
}

function mediaKey(url) {
  const pathname = url.pathname.replace(/^\/media(?=\/)/, '')
  if (url.hostname !== CDN_HOST && !url.pathname.startsWith('/media/') && !url.hostname.endsWith('.pages.dev')) return undefined
  let parts
  try { parts = pathname.replace(/^\//, '').split('/').map(decodeURIComponent) } catch { return undefined }
  if (!['catalog', 'supplier', 'uploads', 'videos'].includes(parts[0])) return undefined
  if (parts.some(p => !p || p === '.' || p === '..' || /[\\\0/]/.test(p))) return undefined
  return parts.join('/')
}

async function directMedia(request, bucket, key, archiveFirst = false) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
  const object = archiveFirst && archivedKeys.has(key) ? null : await bucket.get(key, {
    onlyIf: request.headers,
    // Ignoring Range when If-Range is supplied is a valid full 200 response.
    // R2 does not implement If-Range evaluation; never send a mismatched 206.
    ...(request.method === 'GET' && !request.headers.has('If-Range') ? { range: request.headers } : {}),
  })
  if (!object) {
    if (archivedKeys.has(key)) {
      const headers = new Headers()
      for (const name of ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since']) {
        const value = request.headers.get(name)
        if (value) headers.set(name, value)
      }
      return fetch(new Request(`${archive.origin}/${key.split('/').map(encodeURIComponent).join('/')}`, { method: request.method, headers, redirect: 'manual' }))
    }
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  const metadata = object.httpMetadata || {}
  const headers = new Headers({
    'Cache-Control': metadata.cacheControl || 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff', ETag: object.httpEtag, 'Content-Length': String(object.size),
  })
  for (const [name, value] of Object.entries({ 'Content-Type': metadata.contentType, 'Content-Disposition': metadata.contentDisposition, 'Content-Encoding': metadata.contentEncoding, 'Content-Language': metadata.contentLanguage })) if (value) headers.set(name, value)
  headers.set('Accept-Ranges', 'bytes')
  if (!('body' in object)) {
    headers.delete('Content-Length')
    const failedWriteCondition = request.headers.has('If-Match') || request.headers.has('If-Unmodified-Since')
    return new Response(null, { status: failedWriteCondition ? 412 : 304, headers })
  }
  if (object.range && request.method !== 'HEAD' && request.headers.has('Range') && !request.headers.has('If-Range')) {
    const { offset, length } = object.range
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`)
    headers.set('Content-Length', String(length))
    return new Response(object.body, { status: 206, headers })
  }
  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}
