import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

type SourceRecord = Record<string, unknown>

export type SupplierMigrationRecord = {
  stableKey: string
  supplierKey: string
  supplierName: string
  code: string
  name: string
  slug: string
  category: string
  materialType?: string
  finish?: string
  sourceURL?: string
  canonicalRoute?: string
  thumbnailKey?: string
  status: 'published' | 'draft'
  specifications: SourceRecord
  checksum: string
}

export type SupplierMediaReference = {
  r2Key: string
  alt: string
  sourceRecord: string
  roomApplication: boolean
}

export function buildSupplierMigrationInventory(sourceRoot: string) {
  const file = path.join(sourceRoot, 'data/catalogs/supplier-search-index.json')
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as { records?: SourceRecord[] }
  const sourceRecords = Array.isArray(parsed.records) ? parsed.records : []
  const records: SupplierMigrationRecord[] = []
  const failed: Array<{ record: string; reason: string }> = []
  const media = new Map<string, SupplierMediaReference>()
  const stableKeys = new Set<string>()
  const baseSlugs = sourceRecords.map((source) => routeSlug(stringValue(source.canonicalRoute)) || slugify(`${stringValue(source.supplierId)}-${stringValue(source.code) || stringValue(source.id)}`))
  const slugCounts = new Map<string, number>()
  baseSlugs.forEach((slug) => slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1))

  for (const [index, source] of sourceRecords.entries()) {
    const stableKey = stringValue(source.id)
    const supplierKey = stringValue(source.supplierId)
    const supplierName = stringValue(source.supplierName) || supplierKey
    const canonicalRoute = stringValue(source.canonicalRoute)
    const baseSlug = baseSlugs[index]
    const slug = (slugCounts.get(baseSlug) ?? 0) === 1 ? baseSlug : `${baseSlug}-${slugify(stableKey)}`
    const name = stringValue(source.name) || stringValue(source.title) || stableKey
    const code = stringValue(source.code) || stringValue(source.normalizedCode) || stableKey
    if (!stableKey || !supplierKey || !slug || !name || !code) {
      failed.push({ record: stableKey || JSON.stringify(source).slice(0, 120), reason: 'missing stable key, supplier, code, name, or slug' })
      continue
    }
    if (stableKeys.has(stableKey)) {
      failed.push({ record: stableKey, reason: 'duplicate stable key' })
      continue
    }
    stableKeys.add(stableKey)
    const thumbnail = stringValue(source.thumbnail).replace(/^\//, '')
    if (thumbnail.startsWith('catalog/')) {
      media.set(thumbnail, { r2Key: thumbnail, alt: name, sourceRecord: stableKey, roomApplication: false })
    }
    records.push({
      stableKey,
      supplierKey,
      supplierName,
      code,
      name,
      slug,
      category: stringValue(source.category) || stringValue(source.kind) || 'Vật liệu',
      materialType: stringValue(source.material) || undefined,
      finish: stringValue(source.finish) || stringValue(source.surface) || undefined,
      sourceURL: stringValue(source.sourceURL) || undefined,
      canonicalRoute: canonicalRoute || undefined,
      thumbnailKey: thumbnail || undefined,
      status: source.indexable === false ? 'draft' : 'published',
      specifications: source,
      checksum: sha256(source),
    })
  }

  return {
    oldRecords: sourceRecords.length,
    records,
    failed,
    duplicatesRemoved: sourceRecords.length - records.length - failed.length,
    mediaReferences: [...media.values()].sort((a, b) => a.r2Key.localeCompare(b.r2Key)),
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function routeSlug(route: string): string {
  return route.split('/').filter(Boolean).at(-1) ?? ''
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function sha256(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value, Object.keys(value as SourceRecord).sort())).digest('hex')
}
