import { getCloudflareContext } from '@opennextjs/cloudflare'
import { safeMediaKey } from '@/lib/media-key'

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(_request: Request, context: RouteContext) {
  return mediaResponse(context, false)
}

export async function HEAD(_request: Request, context: RouteContext) {
  return mediaResponse(context, true)
}

async function mediaResponse(context: RouteContext, head: boolean) {
  const key = safeMediaKey((await context.params).path)
  if (!key) return new Response('Not found', { status: 404 })
  const cloudflare = await getCloudflareContext({ async: true })
  const object = await cloudflare.env.R2.get(key)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers({
    'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=31536000, immutable',
    ETag: object.httpEtag,
    'X-Content-Type-Options': 'nosniff',
  })
  object.writeHttpMetadata(headers)
  return new Response(head ? null : object.body, { headers })
}
