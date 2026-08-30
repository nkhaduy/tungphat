const PAYLOAD_UPSTREAM = 'https://tungphat-payload-cms.nkhaduy.workers.dev'
const CDN_HOST = 'cdn.mdftungphat.com'
const CDN_MEDIA_PATH = /^\/(?:catalog|gallery|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$)/

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

    return fetch(new Request(upstream, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    }))
  },
}

export default gateway
