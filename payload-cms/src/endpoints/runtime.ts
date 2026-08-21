import type { Endpoint } from 'payload'
import { z } from 'zod'

type LeadType = 'contact' | 'quote'

const cleanText = (max: number, required = false) => {
  const schema = z.string().transform((value) => value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()).pipe(z.string().max(max))
  return required ? schema.pipe(z.string().min(2)) : schema.default('')
}

const leadSchema = z.object({
  submission_id: z.string().uuid(),
  full_name: cleanText(100, true),
  phone: cleanText(30, true).transform(normalizePhone).pipe(z.string().regex(/^0\d{8,10}$/)),
  email: z.union([z.literal(''), z.string().trim().email().max(160)]).default(''),
  company: cleanText(160), city: cleanText(100), product: cleanText(160), material: cleanText(120),
  thickness: cleanText(80), dimensions: cleanText(160), quantity: cleanText(100),
  cnc_requirement: cleanText(800), message: cleanText(2000),
  source_url: z.string().max(500).default(''), referrer: z.string().max(500).default(''),
  utm_source: cleanText(100), utm_medium: cleanText(100), utm_campaign: cleanText(120),
  consent: z.literal(true), website: z.string().max(200).default(''), turnstile_token: z.string().min(1).max(2048),
})

type ReviewDoc = {
  stableKey?: string | null
  branchKey?: string | null
  reviewerName?: string | null
  reviewerPhotoURL?: string | null
  rating?: number | null
  comment?: string | null
  ownerReply?: string | null
  reviewedAt?: string | null
  updatedAt?: string | null
}

export const runtimeEndpoints: Endpoint[] = [
  leadEndpoint('contact'),
  leadEndpoint('quote'),
  leadOptionsEndpoint('contact'),
  leadOptionsEndpoint('quote'),
  {
    path: '/gbp/reviews',
    method: 'get',
    handler: async (req) => {
      const result = await req.payload.find({ collection: 'reviews', limit: 100, depth: 0, overrideAccess: true, where: { published: { equals: true } }, sort: 'displayOrder' })
      return Response.json(reviewPayloadFromDocs(result.docs as ReviewDoc[]), { headers: publicHeaders() })
    },
  },
  {
    path: '/analytics/track',
    method: 'post',
    handler: async (req) => {
      const body = await (req as Request).json().catch(() => null)
      const data = analyticsDataFromLegacyBody(body)
      if (!data) return Response.json({ ok: false, code: 'invalid_event' }, { status: 400, headers: noStoreHeaders() })
      await req.payload.create({ collection: 'analytics-events', data, overrideAccess: true })
      return Response.json({ ok: true }, { status: 201, headers: noStoreHeaders() })
    },
  },
]

function leadEndpoint(type: LeadType): Endpoint {
  return {
    path: `/${type}`,
    method: 'post',
    handler: async (req) => {
      const request = req as unknown as Request
      const origin = allowedPublicOrigin(request.headers.get('Origin'))
      if (!origin) return leadResponse({ ok: false, code: 'origin_rejected' }, 403)
      const body = await request.json().catch(() => null)
      const data = leadDataFromLegacyBody(body, type)
      if (!data) return leadResponse({ ok: false, code: 'validation_failed' }, 400, origin)
      if (data.honeypot) return leadResponse({ ok: true, id: data.submissionKey }, 202, origin)

      const duplicate = await req.payload.find({ collection: 'leads', limit: 1, depth: 0, overrideAccess: true, where: { submissionKey: { equals: data.submissionKey } } })
      if (duplicate.docs[0]) return leadResponse({ ok: true, id: duplicate.docs[0].id, duplicate: true }, 200, origin)

      const secret = process.env.TURNSTILE_SECRET_KEY
      const salt = process.env.IP_HASH_SALT
      if (!secret || !salt || salt.length < 32) return leadResponse({ ok: false, code: 'service_unavailable' }, 503, origin)
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
      const ipHash = await privacyHash(ip, salt)
      const recent = await req.payload.count({
        collection: 'leads', overrideAccess: true,
        where: { and: [{ ipHash: { equals: ipHash } }, { type: { equals: type } }, { createdAt: { greater_than: new Date(Date.now() - 600_000).toISOString() } }] },
      })
      if (recent.totalDocs >= 5) return leadResponse({ ok: false, code: 'rate_limited' }, 429, origin, { 'Retry-After': '600' })
      if (!await verifyTurnstile(data.turnstileToken, secret, ip, new URL(origin).hostname)) {
        return leadResponse({ ok: false, code: 'verification_failed' }, 400, origin)
      }

      const created = await req.payload.create({
        collection: 'leads', overrideAccess: true,
        data: {
          submissionKey: data.submissionKey, type, fullName: data.fullName, phone: data.phone,
          email: data.email || undefined, company: data.company || undefined, city: data.city || undefined,
          product: data.product || undefined, material: data.material || undefined, thickness: data.thickness || undefined,
          dimensions: data.dimensions || undefined, quantity: data.quantity || undefined,
          cncRequirement: data.cncRequirement || undefined, message: data.message || undefined,
          sourceURL: data.sourceURL || undefined, attribution: data.attribution, ipHash,
          userAgent: (request.headers.get('User-Agent') || '').slice(0, 500) || undefined,
          status: 'new', consentAt: new Date().toISOString(),
        },
      })
      return leadResponse({ ok: true, id: created.id }, 201, origin)
    },
  }
}

function leadOptionsEndpoint(type: LeadType): Endpoint {
  return { path: `/${type}`, method: 'options', handler: async (req) => {
    const origin = allowedPublicOrigin((req as unknown as Request).headers.get('Origin'))
    return leadResponse(null, origin ? 204 : 403, origin)
  } }
}

export function leadDataFromLegacyBody(value: unknown, type: LeadType) {
  const parsed = leadSchema.safeParse(value)
  if (!parsed.success) return null
  const data = parsed.data
  if (data.website) return { submissionKey: data.submission_id, honeypot: true as const }
  if ((type === 'contact' && !data.message) || (type === 'quote' && !data.material)) return null
  return {
    submissionKey: data.submission_id, honeypot: false as const, fullName: data.full_name, phone: data.phone,
    email: data.email, company: data.company, city: data.city, product: data.product, material: data.material,
    thickness: data.thickness, dimensions: data.dimensions, quantity: data.quantity,
    cncRequirement: data.cnc_requirement, message: data.message,
    sourceURL: safeSourceURL(data.source_url), turnstileToken: data.turnstile_token,
    attribution: { referrer: safeHostname(data.referrer), utmSource: data.utm_source, utmMedium: data.utm_medium, utmCampaign: data.utm_campaign },
  }
}

export function reviewPayloadFromDocs(docs: ReviewDoc[]) {
  const groups = new Map<string, ReviewDoc[]>()
  for (const doc of docs) {
    const rawKey = (doc.branchKey || 'tp1').toLowerCase()
    const key = rawKey === 'tp2' || rawKey === 'tp15' ? 'tp2' : 'tp1'
    groups.set(key, [...(groups.get(key) ?? []), doc])
  }
  const branches = [...groups.entries()].map(([branchKey, reviews]) => ({
    branchKey,
    status: reviews.length ? 'ready' : 'empty',
    location: branchKey === 'tp2' ? 'Tùng Phát - Chi nhánh 2' : 'Tùng Phát',
    mapsUrl: null,
    count: reviews.length,
    averageRating: reviews.length ? Math.round((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length) * 10) / 10 : 0,
    lastSyncedAt: reviews.reduce<number | null>((latest, review) => {
      const value = review.updatedAt ? Date.parse(review.updatedAt) : 0
      return value > (latest ?? 0) ? value : latest
    }, null),
    reviews: reviews.map((review) => ({
      review_id: review.stableKey || '',
      reviewer_display_name: review.reviewerName || 'Khách hàng Tùng Phát',
      reviewer_photo_url: review.reviewerPhotoURL || null,
      rating: Number(review.rating || 0),
      comment: review.comment || null,
      create_time: review.reviewedAt || null,
      update_time: review.updatedAt || null,
      owner_reply: review.ownerReply || null,
    })),
  }))
  return { status: branches.some((branch) => branch.status === 'ready') ? 'ready' : 'empty', branches }
}

export function analyticsDataFromLegacyBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  const eventID = text(body.event_id)
  const sessionID = text(body.session_id)
  const visitorID = text(body.visitor_id)
  const eventName = text(body.event_name)
  const path = text(body.path)
  if (!eventID || !sessionID || !visitorID || !eventName || !path) return null
  const occurred = Number(body.occurred_at)
  return {
    eventID,
    sessionID,
    visitorID,
    eventName,
    occurredAt: new Date(occurred > 10_000_000_000 ? occurred : occurred * 1000).toISOString(),
    path,
    pageTitle: text(body.page_title) || undefined,
    contentType: text(body.content_type) || undefined,
    contentID: text(body.content_id) || undefined,
    metadata: {
      contentTitle: body.content_title,
      contentCategory: body.content_category,
      ctaLocation: body.cta_location,
      targetType: body.target_type,
      scrollPercent: body.scroll_percent,
      engagementSeconds: body.engagement_seconds,
      attribution: body.attribution,
    },
    isTest: false,
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePhone(value: string) {
  const compact = value.replace(/[^\d+]/g, '')
  if (compact.startsWith('+84')) return `0${compact.slice(3)}`
  if (compact.startsWith('84') && compact.length >= 10) return `0${compact.slice(2)}`
  return compact
}

function safeSourceURL(value: string) {
  if (!value) return ''
  try {
    const url = new URL(value)
    return ['https://mdftungphat.com', 'https://www.mdftungphat.com'].includes(url.origin) ? `${url.pathname}${url.search}`.slice(0, 500) : ''
  } catch { return '' }
}

function safeHostname(value: string) {
  if (!value) return ''
  try { return new URL(value).hostname.slice(0, 255) } catch { return '' }
}

function allowedPublicOrigin(value: string | null) {
  return value === 'https://mdftungphat.com' || value === 'https://www.mdftungphat.com' ? value : null
}

async function privacyHash(value: string, salt: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${value}`))
  return Array.from(new Uint8Array(digest)).slice(0, 16).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyTurnstile(token: string, secret: string, remoteip: string, hostname: string) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null)
  if (!response?.ok) return false
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string }
  return result.success === true && result.hostname === hostname && (!result.action || result.action === 'tung-phat-lead')
}

function leadResponse(body: unknown, status: number, origin?: string | null, extra?: Record<string, string>) {
  const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive', ...extra })
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')
    headers.set('Vary', 'Origin')
  }
  return body === null ? new Response(null, { status, headers }) : Response.json(body, { status, headers })
}

function publicHeaders() {
  return { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400', 'Access-Control-Allow-Origin': 'https://mdftungphat.com', Vary: 'Origin', 'X-Robots-Tag': 'noindex, nofollow, noarchive' }
}

function noStoreHeaders() {
  return { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'https://mdftungphat.com', Vary: 'Origin', 'X-Robots-Tag': 'noindex, nofollow, noarchive' }
}
