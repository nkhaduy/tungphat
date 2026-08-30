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
  id?: string | number
  stableKey?: string | null
  branchKey?: string | null
  reviewerName?: string | null
  reviewerPhotoURL?: string | null
  rating?: number | null
  comment?: string | null
  ownerReply?: string | null
  reviewedAt?: string | null
  updatedAt?: string | null
  source?: string | null
  sourcePayload?: unknown
}

type GooglePlacesReview = {
  name?: string
  rating?: number
  publishTime?: string
  relativePublishTimeDescription?: string
  text?: { text?: string | null }
  originalText?: { text?: string | null }
  authorAttribution?: { displayName?: string; photoUri?: string; uri?: string }
}

type GooglePlacesPayload = {
  displayName?: { text?: string }
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: GooglePlacesReview[]
}

type GoogleReviewErrorCode = 'missing_configuration' | 'google_bad_request' | 'google_unauthorized' | 'google_forbidden' | 'google_rate_limited' | 'google_request_failed'

class GooglePlacesError extends Error {
  constructor(readonly code: GoogleReviewErrorCode) {
    super(code)
  }
}

const GOOGLE_REVIEW_CACHE_PROVIDER = 'google-places-api-v1'
const GOOGLE_PLACES_LOCATIONS = [
  { branchKey: 'tp1', location: 'Tùng Phát - Chi nhánh 1', placeId: 'ChIJ6dw2A6YndTERr5eaiym-l-M', mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ6dw2A6YndTERr5eaiym-l-M' },
  { branchKey: 'tp2', location: 'Tùng Phát - Chi nhánh 2', placeId: 'ChIJjWMBUikndTERNFK1M-j02ZY', mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJjWMBUikndTERNFK1M-j02ZY' },
] as const

export const runtimeEndpoints: Endpoint[] = [
  leadEndpoint('contact'),
  leadEndpoint('quote'),
  leadOptionsEndpoint('contact'),
  leadOptionsEndpoint('quote'),
  {
    path: '/gbp/reviews',
    method: 'get',
    handler: async (req) => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY
      const cached = await readGoogleReviewCache(req)
      const branches = await Promise.all(GOOGLE_PLACES_LOCATIONS.map(async (location) => {
        if (!apiKey) return cached.get(location.branchKey) ?? errorGoogleBranch(location, 'missing_configuration')
        try {
          const fresh = await fetchGooglePlace(location, apiKey)
          await writeGoogleReviewCache(req, fresh)
          return fresh
        } catch (error) {
          return cached.get(location.branchKey) ?? errorGoogleBranch(location, googleReviewErrorCode(error))
        }
      }))
      const payload = { provider: 'google-places-api', status: branches.some((branch) => branch.status === 'ready') ? 'ready' : 'empty', branches }
      return Response.json(payload, { headers: publicHeaders() })
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

async function fetchGooglePlace(location: typeof GOOGLE_PLACES_LOCATIONS[number], apiKey: string) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(location.placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews,googleMapsUri' },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new GooglePlacesError(googleReviewErrorCodeFromStatus(response.status))
  const place = await response.json() as GooglePlacesPayload
  const reviews = (place.reviews ?? []).flatMap((review) => {
    const rating = Number(review.rating)
    const name = review.name?.trim()
    const reviewer = review.authorAttribution?.displayName?.trim()
    if (!name || !reviewer || !Number.isInteger(rating) || rating < 1 || rating > 5) return []
    return [{
      review_id: name,
      reviewer_display_name: reviewer,
      reviewer_photo_url: review.authorAttribution?.photoUri ?? null,
      reviewer_uri: review.authorAttribution?.uri ?? null,
      rating,
      comment: review.originalText?.text?.trim() || review.text?.text?.trim() || null,
      create_time: review.publishTime ?? null,
      update_time: review.publishTime ?? null,
      owner_reply: null,
    }]
  })
  const syncedAt = Date.now()
  const count = Math.max(0, Number(place.userRatingCount) || 0)
  const averageRating = Math.min(5, Math.max(0, Number(place.rating) || 0))
  return { branchKey: location.branchKey, status: count > 0 ? 'ready' : 'empty', location: place.displayName?.text?.trim() || location.location, mapsUrl: safeGoogleMapsUrl(place.googleMapsUri) || location.mapsUrl, count, averageRating, lastSyncedAt: syncedAt, reviews, source: GOOGLE_REVIEW_CACHE_PROVIDER }
}

function emptyGoogleBranch(location: typeof GOOGLE_PLACES_LOCATIONS[number]) {
  return { branchKey: location.branchKey, status: 'empty' as const, location: location.location, mapsUrl: location.mapsUrl, count: 0, averageRating: 0, lastSyncedAt: null, reviews: [], source: 'google-places-api' }
}

function errorGoogleBranch(location: typeof GOOGLE_PLACES_LOCATIONS[number], errorCode: GoogleReviewErrorCode) {
  return { ...emptyGoogleBranch(location), status: 'error' as const, errorCode }
}

function googleReviewErrorCode(error: unknown): GoogleReviewErrorCode {
  return error instanceof GooglePlacesError ? error.code : 'google_request_failed'
}

function googleReviewErrorCodeFromStatus(status: number): GoogleReviewErrorCode {
  if (status === 400) return 'google_bad_request'
  if (status === 401) return 'google_unauthorized'
  if (status === 403) return 'google_forbidden'
  if (status === 429) return 'google_rate_limited'
  return 'google_request_failed'
}

function safeGoogleMapsUrl(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

async function readGoogleReviewCache(req: Parameters<typeof runtimeEndpoints[number]['handler']>[0]) {
  const result = await req.payload.find({ collection: 'reviews', limit: 200, depth: 0, overrideAccess: true, where: { and: [{ published: { equals: true } }, { source: { equals: 'google' } }] }, sort: '-updatedAt' })
  const docs = (result.docs as ReviewDoc[]).filter((doc) => {
    const payload = doc.sourcePayload && typeof doc.sourcePayload === 'object' ? doc.sourcePayload as Record<string, unknown> : null
    return payload?.provider === GOOGLE_REVIEW_CACHE_PROVIDER
  })
  const groups = new Map<string, ReviewDoc[]>()
  for (const doc of docs) {
    const key = doc.branchKey === 'tp2' ? 'tp2' : doc.branchKey === 'tp1' ? 'tp1' : null
    if (key) groups.set(key, [...(groups.get(key) ?? []), doc])
  }
  return new Map([...groups.entries()].map(([branchKey, branchDocs]) => {
    const location = GOOGLE_PLACES_LOCATIONS.find((item) => item.branchKey === branchKey)!
    const payloads = branchDocs.map((doc) => doc.sourcePayload && typeof doc.sourcePayload === 'object' ? doc.sourcePayload as Record<string, unknown> : {})
    const latestSyncedAt = Math.max(...payloads.map((payload) => Number(payload.lastSyncedAt) || 0))
    const latestDocs = branchDocs.filter((doc) => Number((doc.sourcePayload as Record<string, unknown> | undefined)?.lastSyncedAt) === latestSyncedAt)
    const firstPayload = latestDocs[0]?.sourcePayload && typeof latestDocs[0].sourcePayload === 'object' ? latestDocs[0].sourcePayload as Record<string, unknown> : {}
    const mapped = reviewPayloadFromDocs(latestDocs).branches[0]
    return [branchKey, { ...mapped, location: typeof firstPayload.location === 'string' ? firstPayload.location : location.location, mapsUrl: typeof firstPayload.mapsUrl === 'string' ? firstPayload.mapsUrl : location.mapsUrl, count: Number(firstPayload.userRatingCount) || mapped?.count || 0, averageRating: Number(firstPayload.aggregateRating) || mapped?.averageRating || 0, lastSyncedAt: Number(firstPayload.lastSyncedAt) || null, source: GOOGLE_REVIEW_CACHE_PROVIDER }] as const
  }))
}

async function writeGoogleReviewCache(req: Parameters<typeof runtimeEndpoints[number]['handler']>[0], branch: Awaited<ReturnType<typeof fetchGooglePlace>>) {
  const existingBranch = await req.payload.find({ collection: 'reviews', limit: 200, depth: 0, overrideAccess: true, where: { and: [{ source: { equals: 'google' } }, { branchKey: { equals: branch.branchKey } }] } })
  const reviewIds = new Set(branch.reviews.map((review) => review.review_id))
  for (const existing of existingBranch.docs as ReviewDoc[]) {
    const payload = existing.sourcePayload && typeof existing.sourcePayload === 'object' ? existing.sourcePayload as Record<string, unknown> : null
    if (payload?.provider === GOOGLE_REVIEW_CACHE_PROVIDER && existing.stableKey && !reviewIds.has(existing.stableKey)) {
      if (existing.id !== undefined) await req.payload.delete({ collection: 'reviews', id: existing.id, overrideAccess: true })
    }
  }
  for (const review of branch.reviews) {
    const existing = await req.payload.find({ collection: 'reviews', limit: 1, depth: 0, overrideAccess: true, where: { stableKey: { equals: review.review_id } } })
    const data = { stableKey: review.review_id, source: 'google' as const, branchKey: branch.branchKey, reviewerName: review.reviewer_display_name, reviewerPhotoURL: review.reviewer_photo_url, rating: review.rating, comment: review.comment, ownerReply: review.owner_reply, reviewedAt: review.create_time, published: true, displayOrder: 0, sourcePayload: { provider: GOOGLE_REVIEW_CACHE_PROVIDER, placeId: GOOGLE_PLACES_LOCATIONS.find((item) => item.branchKey === branch.branchKey)?.placeId, mapsUrl: branch.mapsUrl, reviewerUri: review.reviewer_uri, location: branch.location, userRatingCount: branch.count, aggregateRating: branch.averageRating, lastSyncedAt: branch.lastSyncedAt } }
    if (existing.docs[0]) await req.payload.update({ collection: 'reviews', id: existing.docs[0].id, data, overrideAccess: true })
    else await req.payload.create({ collection: 'reviews', data, overrideAccess: true })
  }
}

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
      reviewer_uri: review.sourcePayload && typeof review.sourcePayload === 'object' && typeof (review.sourcePayload as Record<string, unknown>).reviewerUri === 'string' ? (review.sourcePayload as Record<string, unknown>).reviewerUri : null,
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
  return { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400', 'Access-Control-Allow-Origin': 'https://mdftungphat.com', Vary: 'Origin', 'X-Robots-Tag': 'noindex, nofollow, noarchive' }
}

function noStoreHeaders() {
  return { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'https://mdftungphat.com', Vary: 'Origin', 'X-Robots-Tag': 'noindex, nofollow, noarchive' }
}
