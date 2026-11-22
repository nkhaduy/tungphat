import { describe, expect, it } from 'vitest'
import { mediaFileChecksum } from '@/security/mediaUpload'

describe('media upload duplicate fingerprint', () => {
  it('produces a stable SHA-256 digest from uploaded file bytes', async () => {
    const file = { data: new TextEncoder().encode('abc') }
    await expect(mediaFileChecksum(file)).resolves.toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
