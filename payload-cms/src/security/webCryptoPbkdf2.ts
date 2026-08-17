import nodeCrypto from 'node:crypto'

const installMarker = Symbol.for('tungphat.payload.webcrypto-pbkdf2')
const originalPbkdf2 = nodeCrypto.pbkdf2.bind(nodeCrypto)

type MarkedCrypto = typeof nodeCrypto & { [installMarker]?: true }

export async function derivePbkdf2WithWebCrypto(password: nodeCrypto.BinaryLike, salt: nodeCrypto.BinaryLike, iterations: number, keyLength: number, digest: string) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('WebCrypto subtle API is unavailable')
  const hash = digest.toLowerCase().replaceAll('-', '')
  if (hash !== 'sha256') throw new Error(`Unsupported PBKDF2 digest: ${digest}`)
  const passwordBytes = binaryBytes(password)
  const saltBytes = binaryBytes(salt)
  const key = await subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, keyLength * 8)
  return Buffer.from(bits)
}

export function installWebCryptoPbkdf2() {
  const crypto = nodeCrypto as MarkedCrypto
  if (crypto[installMarker] || !globalThis.crypto?.subtle) return
  Object.defineProperty(crypto, 'pbkdf2', {
    configurable: true,
    writable: true,
    value(password: nodeCrypto.BinaryLike, salt: nodeCrypto.BinaryLike, iterations: number, keyLength: number, digest: string, callback: (error: Error | null, derivedKey: Buffer) => void) {
      if (digest.toLowerCase().replaceAll('-', '') !== 'sha256') {
        originalPbkdf2(password, salt, iterations, keyLength, digest, callback)
        return
      }
      void derivePbkdf2WithWebCrypto(password, salt, iterations, keyLength, digest).then(
        (derivedKey) => callback(null, derivedKey),
        (error: unknown) => callback(error instanceof Error ? error : new Error('PBKDF2 failed'), Buffer.alloc(0)),
      )
    },
  })
  Object.defineProperty(crypto, installMarker, { value: true })
}

function binaryBytes(value: nodeCrypto.BinaryLike) {
  if (typeof value === 'string') return new TextEncoder().encode(value)
  if (ArrayBuffer.isView(value)) return Uint8Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
  return Uint8Array.from(new Uint8Array(value))
}
