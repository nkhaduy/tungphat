import { describe, expect, it } from 'vitest'
import { safeMediaKey } from '@/lib/media-key'

describe('R2 media route', () => {
  it('allows existing production media prefixes', () => {
    expect(safeMediaKey(['catalog', 'thanh-thuy', 'sample.webp'])).toBe('catalog/thanh-thuy/sample.webp')
    expect(safeMediaKey(['supplier', 'an-cuong', 'room.webp'])).toBe('supplier/an-cuong/room.webp')
  })

  it('rejects traversal and unrelated bucket keys', () => {
    expect(safeMediaKey(['..', 'secret'])).toBeNull()
    expect(safeMediaKey(['private', 'secret'])).toBeNull()
  })
})
