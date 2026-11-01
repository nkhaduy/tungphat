import crypto from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { derivePbkdf2WithWebCrypto } from '../../src/security/webCryptoPbkdf2'

describe('WebCrypto PBKDF2 compatibility', () => {
  it('matches Payload local-auth PBKDF2 output exactly', async () => {
    const password = 'production-compatibility-password!Aa9'
    const salt = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const expected = crypto.pbkdf2Sync(password, salt, 25_000, 512, 'sha256')
    const actual = await derivePbkdf2WithWebCrypto(password, salt, 25_000, 512, 'sha256')
    expect(actual.equals(expected)).toBe(true)
  })

  it('preserves Payload 3.92 hashes when Workers rejects native iterations above 100000', async () => {
    const expected = crypto.pbkdf2Sync('Mật-khẩu-compatibility!', 'salt-600k', 600_000, 32, 'sha256')
    const native = vi.spyOn(globalThis.crypto.subtle, 'deriveBits').mockRejectedValue(new Error('iteration counts above 100000 are not supported'))
    try {
      const actual = await derivePbkdf2WithWebCrypto('Mật-khẩu-compatibility!', 'salt-600k', 600_000, 32, 'sha256')
      expect(actual.equals(expected)).toBe(true)
      expect(native).not.toHaveBeenCalled()
    } finally { native.mockRestore() }
  })

  it('rejects a digest outside the Payload auth contract', async () => {
    await expect(derivePbkdf2WithWebCrypto('password', 'salt', 1, 32, 'sha512')).rejects.toThrow('Unsupported')
  })
})
