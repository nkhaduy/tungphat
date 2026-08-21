import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSupplierMigrationInventory } from '../../scripts/current-production-lib'

describe('current production supplier migration inventory', () => {
  const sourceRoot = path.resolve(process.cwd(), '..')

  it('normalizes every rendered supplier record with stable unique keys', () => {
    const inventory = buildSupplierMigrationInventory(sourceRoot)
    expect(inventory.oldRecords).toBe(3639)
    expect(inventory.records).toHaveLength(3639)
    expect(new Set(inventory.records.map((record) => record.stableKey)).size).toBe(3639)
    expect(new Set(inventory.records.map((record) => record.slug)).size).toBe(3639)
    expect(inventory.records.every((record) => record.supplierKey && record.code && record.slug && record.name)).toBe(true)
    expect(inventory.failed).toHaveLength(0)
  })

  it('keeps R2 catalogue references without creating binary uploads', () => {
    const inventory = buildSupplierMigrationInventory(sourceRoot)
    expect(inventory.mediaReferences.length).toBe(6773)
    expect(inventory.mediaReferences.every((reference) => /^(catalog|supplier)\//.test(reference.r2Key))).toBe(true)
    expect(new Set(inventory.mediaReferences.map((reference) => reference.r2Key)).size).toBe(inventory.mediaReferences.length)
  })
})
