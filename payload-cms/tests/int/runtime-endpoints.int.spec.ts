import { describe, expect, it } from 'vitest'
import { reviewPayloadFromDocs, analyticsDataFromLegacyBody, leadDataFromLegacyBody } from '@/endpoints/runtime'

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
})
