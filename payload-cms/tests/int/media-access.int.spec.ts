import { describe, expect, it } from 'vitest'
import { canAccessStagingMedia } from '@/security/mediaAccess'

describe('staging media access', () => {
  it('allows only an authenticated CMS user or the private preview Worker secret', () => {
    const secret = 'M'.repeat(64)
    expect(canAccessStagingMedia({ secret, authorization: undefined, authenticated: false })).toBe(false)
    expect(canAccessStagingMedia({ secret, authorization: `Bearer ${secret}`, authenticated: false })).toBe(true)
    expect(canAccessStagingMedia({ secret, authorization: `Bearer ${'N'.repeat(64)}`, authenticated: false })).toBe(false)
    expect(canAccessStagingMedia({ secret, authorization: undefined, authenticated: true })).toBe(true)
    expect(canAccessStagingMedia({ secret: undefined, authorization: undefined, authenticated: false })).toBe(false)
  })
})
