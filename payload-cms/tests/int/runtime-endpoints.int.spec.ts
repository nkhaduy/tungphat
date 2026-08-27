import { describe, expect, it } from 'vitest'
import { runtimeEndpoints, reviewPayloadFromDocs, analyticsDataFromLegacyBody, leadDataFromLegacyBody } from '@/endpoints/runtime'

describe('Payload runtime compatibility endpoints', () => {
  it('maps Payload reviews to the existing public review widget contract', () => {
    const payload = reviewPayloadFromDocs([
      { stableKey: 'r1', branchKey: 'tp1', reviewerName: 'Khách hàng', reviewerPhotoURL: null, rating: 5, comment: 'Rất tốt', reviewedAt: '2026-01-01', updatedAt: '2026-01-02' },
    ])
    expect(payload.status).toBe('ready')
    expect(payload.branches[0]).toMatchObject({ branchKey: 'tp1', count: 1, averageRating: 5 })
    expect(payload.branches[0].reviews[0]).toMatchObject({ review_id: 'r1', reviewer_display_name: 'Khách hàng', rating: 5 })
  })

  it('maps the existing analytics request into the Payload collection shape', () => {
    expect(analyticsDataFromLegacyBody({ event_id: 'e1', session_id: 's1', visitor_id: 'v1', event_name: 'page_view', occurred_at: 1_786_950_000, path: '/', page_title: 'Trang chủ', attribution: { source: 'direct' } })).toMatchObject({
      eventID: 'e1', sessionID: 's1', visitorID: 'v1', eventName: 'page_view', path: '/', pageTitle: 'Trang chủ', metadata: { attribution: { source: 'direct' } },
    })
  })

  it('validates and maps the existing contact form contract', () => {
    const result = leadDataFromLegacyBody({
      submission_id: '1c8ed22e-e682-4c27-9ef4-a2d9575e3fe4',
      full_name: ' Nguyễn\u0000 Văn A ',
      phone: '+84 912 345 678',
      email: 'khach@example.com',
      message: 'Tư vấn giúp tôi',
      source_url: 'https://mdftungphat.com/lien-he?utm_source=google',
      referrer: 'https://google.com/search?q=mdf',
      utm_source: 'google',
      consent: true,
      website: '',
      turnstile_token: 'token',
    }, 'contact')

    expect(result).toMatchObject({
      submissionKey: '1c8ed22e-e682-4c27-9ef4-a2d9575e3fe4',
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
      message: 'Tư vấn giúp tôi',
      sourceURL: '/lien-he?utm_source=google',
      attribution: { referrer: 'google.com', utmSource: 'google' },
    })
  })

  it('rejects malformed, honeypot, and type-incomplete lead submissions', () => {
    const base = {
      submission_id: '1c8ed22e-e682-4c27-9ef4-a2d9575e3fe4',
      full_name: 'Nguyễn Văn A',
      phone: '0912345678',
      consent: true,
      website: '',
      turnstile_token: 'token',
    }
    expect(leadDataFromLegacyBody({ ...base, message: '' }, 'contact')).toBeNull()
    expect(leadDataFromLegacyBody({ ...base, material: '' }, 'quote')).toBeNull()
    expect(leadDataFromLegacyBody({ ...base, message: 'Xin chào', website: 'spam' }, 'contact')).toMatchObject({ honeypot: true })
  })

  it('queries both verified Places IDs and isolates a failed branch', async () => {
    const previousKey = process.env.GOOGLE_PLACES_API_KEY
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const requests: string[] = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input) => {
      const url = String(input)
      requests.push(url)
      if (url.includes('ChIJjWMBUikndTERNFK1M-j02ZY')) throw new Error('branch 2 unavailable')
      return new Response(JSON.stringify({ displayName: { text: 'Branch 1' }, rating: 4.8, userRatingCount: 11, googleMapsUri: 'https://www.google.com/maps/place/one', reviews: [{ name: 'places/one/reviews/r1', rating: 5, publishTime: '2026-08-01T00:00:00Z', text: { text: 'Google review' }, authorAttribution: { displayName: 'Google User' } }] }), { status: 200 })
    }) as typeof fetch
    const writes: unknown[] = []
    const payload = { find: async () => ({ docs: [] }), create: async (value: unknown) => { writes.push(value); return {} }, update: async () => ({}) }
    try {
      const endpoint = runtimeEndpoints.find((item) => item.path === '/gbp/reviews' && item.method === 'get')!
      const response = await endpoint.handler({ payload } as never)
      const result = await response.json() as { branches: Array<{ branchKey: string; status: string; reviews: Array<{ comment: string | null }> }> }
      expect(requests).toHaveLength(2)
      expect(result.branches).toEqual(expect.arrayContaining([
        expect.objectContaining({ branchKey: 'tp1', status: 'ready', reviews: [expect.objectContaining({ comment: 'Google review' })] }),
        expect.objectContaining({ branchKey: 'tp2', status: 'error' }),
      ]))
      expect(writes.length).toBe(1)
    } finally {
      globalThis.fetch = originalFetch
      if (previousKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
      else process.env.GOOGLE_PLACES_API_KEY = previousKey
    }
  })

  it('never exposes pre-existing CMS reviews as Google reviews or cache data', async () => {
    const previousKey = process.env.GOOGLE_PLACES_API_KEY
    delete process.env.GOOGLE_PLACES_API_KEY
    const payload = { find: async () => ({ docs: [{ stableKey: 'manual', source: 'google', branchKey: 'tp1', reviewerName: 'CMS editor', rating: 5, comment: 'Manual text', sourcePayload: { provider: 'legacy-import' } }] }) }
    try {
      const endpoint = runtimeEndpoints.find((item) => item.path === '/gbp/reviews' && item.method === 'get')!
      const response = await endpoint.handler({ payload } as never)
      const result = await response.json() as { branches: Array<{ status: string; reviews: unknown[] }> }
      expect(result.branches.every((branch) => branch.reviews.length === 0)).toBe(true)
    } finally {
      if (previousKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
      else process.env.GOOGLE_PLACES_API_KEY = previousKey
    }
  })

  it('uses only the last successful Google cache when the API is unavailable', async () => {
    const previousKey = process.env.GOOGLE_PLACES_API_KEY
    process.env.GOOGLE_PLACES_API_KEY = 'test-key'
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => { throw new Error('temporarily unavailable') }) as typeof fetch
    const payload = { find: async () => ({ docs: [{ stableKey: 'cached', source: 'google', branchKey: 'tp1', reviewerName: 'Google User', rating: 5, comment: 'Cached Google review', reviewedAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z', sourcePayload: { provider: 'google-places-api-v1', location: 'Branch 1', mapsUrl: 'https://www.google.com/maps/place/one', userRatingCount: 7, aggregateRating: 5, lastSyncedAt: 1 } }] }) }
    try {
      const endpoint = runtimeEndpoints.find((item) => item.path === '/gbp/reviews' && item.method === 'get')!
      const response = await endpoint.handler({ payload } as never)
      const result = await response.json() as { branches: Array<{ branchKey: string; status: string; reviews: Array<{ comment: string | null }> }> }
      expect(result.branches).toEqual(expect.arrayContaining([
        expect.objectContaining({ branchKey: 'tp1', status: 'ready', reviews: [expect.objectContaining({ comment: 'Cached Google review' })] }),
        expect.objectContaining({ branchKey: 'tp2', status: 'error', reviews: [] }),
      ]))
    } finally {
      globalThis.fetch = originalFetch
      if (previousKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
      else process.env.GOOGLE_PLACES_API_KEY = previousKey
    }
  })
})
