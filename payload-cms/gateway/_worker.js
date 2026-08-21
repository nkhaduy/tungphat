const PAYLOAD_UPSTREAM = 'https://tungphat-payload-cms.nkhaduy.workers.dev'

const gateway = {
  async fetch(request) {
    const incoming = new URL(request.url)
    const upstream = new URL(`${incoming.pathname}${incoming.search}`, PAYLOAD_UPSTREAM)
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
