import type { MigrateDownArgs } from '@payloadcms/db-d1-sqlite'
import { describe, expect, it, vi } from 'vitest'
import { down } from '../../src/migrations/20261122_181241_article_legacy_body_preservation'

function migrationDb(articleRows: unknown[], versionRows: unknown[]) {
  return {
    all: vi.fn().mockResolvedValueOnce(articleRows).mockResolvedValueOnce(versionRows),
    run: vi.fn().mockResolvedValue(undefined),
  }
}

describe('legacy body visibility rollback guard', () => {
  it('blocks rollback when an article uses block-only content', async () => {
    const db = migrationDb([{ id: 1 }], [])

    await expect(down({ db } as unknown as MigrateDownArgs)).rejects.toThrow(/Rollback blocked/i)
    expect(db.run).not.toHaveBeenCalled()
  })

  it('blocks rollback when a version records block-only content', async () => {
    const db = migrationDb([], [{ id: 2 }])

    await expect(down({ db } as unknown as MigrateDownArgs)).rejects.toThrow(/Rollback blocked/i)
    expect(db.run).not.toHaveBeenCalled()
  })

  it('drops the additive columns when no article or version depends on them', async () => {
    const db = migrationDb([], [])

    await down({ db } as unknown as MigrateDownArgs)

    expect(db.run).toHaveBeenCalledTimes(2)
  })
})
