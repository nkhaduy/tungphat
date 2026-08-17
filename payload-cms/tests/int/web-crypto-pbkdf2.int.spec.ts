import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { derivePbkdf2WithWebCrypto } from '../../src/security/webCryptoPbkdf2'

describe('WebCrypto PBKDF2 compatibility', () => {
  it('matches Payload local-auth PBKDF2 output exactly', async () => {
    const password = 'production-compatibility-password!Aa9'
    const salt = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const expected = crypto.pbkdf2Sync(password, salt, 25_000, 512, 'sha256')
    const actual = await derivePbkdf2WithWebCrypto(password, salt, 25_000, 512, 'sha256')
    expect(actual.equals(expected)).toBe(true)
  })

  it('rejects a digest outside the Payload auth contract', async () => {
    await expect(derivePbkdf2WithWebCrypto('password', 'salt', 1, 32, 'sha512')).rejects.toThrow('Unsupported')
  })
})
