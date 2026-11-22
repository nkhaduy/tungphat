// Local-only HTTP transport for the real CMS handlers and isolated local D1.
// It is never imported by the Worker or included in a deployment artifact.
import { createServer } from 'node:http'
import { getPayload, type PayloadRequest } from 'payload'
import config from '../src/payload.config'
import { runtimeEndpoints } from '../src/endpoints/runtime'

if (process.env.CMS_ENVIRONMENT !== 'local' || process.env.NODE_ENV === 'production') {
  throw new Error('The browser API fixture requires an explicit local environment')
}
process.env.TURNSTILE_SECRET_KEY = 'local-e2e-provider-fixture'
process.env.IP_HASH_SALT = 'local-e2e-isolated-database-salt-1234567890'
const nativeFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
    const body = new URLSearchParams(String(init?.body))
    return Response.json({ success: body.get('response') === 'XXXX.DUMMY.TOKEN.XXXX', hostname: 'mdftungphat.com', action: 'tung-phat-lead' })
  }
  return nativeFetch(input, init)
}
const payload = await getPayload({ config: await config })
const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || '/', 'http://127.0.0.1:4190')
    if (url.pathname === '/health') { outgoing.end('local CMS API fixture'); return }
    const endpoint = runtimeEndpoints.find(e => `/api${e.path}` === url.pathname.replace(/\/$/, '') && e.method === incoming.method?.toLowerCase())
    if (!endpoint) { outgoing.writeHead(404); outgoing.end(); return }
    const chunks: Buffer[] = []
    for await (const chunk of incoming) chunks.push(Buffer.from(chunk))
    const headers = new Headers()
    for (const [name, value] of Object.entries(incoming.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
    const request = new Request(url, { method: incoming.method, headers, ...(!['GET', 'HEAD'].includes(incoming.method || '') ? { body: Buffer.concat(chunks) } : {}) })
    Object.defineProperty(request, 'payload', { value: payload })
    const response = await endpoint.handler(request as PayloadRequest)
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    outgoing.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    outgoing.writeHead(500, { 'Content-Type': 'application/json' })
    outgoing.end('{"code":"fixture_transport_error"}')
  }
})
server.listen(4190, '127.0.0.1')
