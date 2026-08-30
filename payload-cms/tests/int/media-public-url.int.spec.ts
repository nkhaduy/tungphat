import { describe, expect, it } from 'vitest'
import { Media } from '@/collections/Media'

describe('Payload media public URL', () => {
  it('emits the canonical CDN URL for newly uploaded R2 objects', async () => {
    const hook = Media.hooks?.afterRead?.[0]
    expect(hook).toBeTypeOf('function')

    const previous = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://cdn.mdftungphat.com'
    try {
      const doc = await (hook as (args: { doc: Record<string, unknown> }) => Promise<Record<string, unknown>> | Record<string, unknown>)({
        doc: { r2Key: 'uploads/v%E1%BA%ADt-li%E1%BB%87u.webp' },
      })
      expect(doc.url).toBe('https://cdn.mdftungphat.com/uploads/v%E1%BA%ADt-li%E1%BB%87u.webp')
      expect(doc.thumbnailURL).toBe(doc.url)
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
      else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = previous
    }
  })
})
