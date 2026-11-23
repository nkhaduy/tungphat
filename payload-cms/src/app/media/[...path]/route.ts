import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { safeMediaKey } from '@/lib/media-key'
import { canAccessStagingMedia } from '@/security/mediaAccess'

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: Request, context: RouteContext) {
  return mediaResponse(request, context, false)
}

export async function HEAD(request: Request, context: RouteContext) {
  return mediaResponse(request, context, true)
}

async function mediaResponse(request: Request, context: RouteContext, head: boolean) {
  const key = safeMediaKey((await context.params).path)
  if (!key) return new Response('Not found', { status: 404 })
  if (process.env.CMS_ENVIRONMENT === 'staging' && !await stagingMediaAccess(request)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  const cloudflare = await getCloudflareContext({ async: true })
  const object = await cloudflare.env.R2.get(key)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers({
    'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=31536000, immutable',
    ETag: object.httpEtag,
    'X-Content-Type-Options': 'nosniff',
  })
  const metadata = object.httpMetadata
  if (metadata?.contentDisposition) headers.set('Content-Disposition', metadata.contentDisposition)
  if (metadata?.contentEncoding) headers.set('Content-Encoding', metadata.contentEncoding)
  if (metadata?.contentLanguage) headers.set('Content-Language', metadata.contentLanguage)
  if (metadata?.contentType) headers.set('Content-Type', metadata.contentType)
  return new Response(head ? null : object.body, { headers })
}

async function stagingMediaAccess(request: Request) {
  const authorization = request.headers.get('authorization') || undefined
  const secret = process.env.SITE_PREVIEW_MEDIA_SECRET
  if (canAccessStagingMedia({ secret, authorization, authenticated: false })) return true
  try {
    const payload = await getPayload({ config })
    const result = await payload.auth({ headers: request.headers })
    return canAccessStagingMedia({ secret, authorization, authenticated: Boolean(result.user) })
  } catch {
    return false
  }
}
