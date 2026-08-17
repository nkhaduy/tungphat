import crypto from 'node:crypto'

export function createPreviewToken(collection: string, slug: string, secret = process.env.PREVIEW_SECRET ?? ''): string {
  if (!secret) return ''
  return crypto.createHmac('sha256', secret).update(`${collection}:${slug}`).digest('base64url')
}

export function validPreviewToken(collection: string, slug: string, token: string, secret = process.env.PREVIEW_SECRET ?? ''): boolean {
  if (!secret || !token) return false
  const expected = createPreviewToken(collection, slug, secret)
  const actualBytes = Buffer.from(token)
  const expectedBytes = Buffer.from(expected)
  return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes)
}
