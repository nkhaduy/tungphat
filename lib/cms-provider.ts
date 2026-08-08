import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { publicSnapshotSchema, type PublicSnapshot } from '@/light-cms/src/contracts/content'

export type CmsProvider = 'decap' | 'payload' | 'light'

export type PayloadSnapshotRecord = {
  collection: 'products' | 'articles' | 'projects' | 'pages'
  _status: 'draft' | 'published'
  data: Record<string, unknown>
}

export type LightSnapshotRecord = PublicSnapshot['records'][number]

export function activeCmsProvider(): CmsProvider {
  if (process.env.CMS_PROVIDER === 'payload') return 'payload'
  if (process.env.CMS_PROVIDER === 'light') return 'light'
  return 'decap'
}

function checksumSnapshot(snapshot: Omit<PublicSnapshot, 'checksum'>) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot))
  return createHash('sha256').update(bytes).digest('hex')
}

export function readLightSnapshot(): PublicSnapshot {
  const configured = process.env.LIGHT_CMS_SNAPSHOT
  const snapshotPath = path.resolve(process.cwd(), configured || 'light-cms/output/public-snapshot.json')
  if (!fs.existsSync(snapshotPath)) throw new Error(`Light CMS snapshot is missing: ${snapshotPath}`)
  let parsed: unknown
  try { parsed = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as unknown } catch { throw new Error('Light CMS snapshot is not valid JSON') }
  const snapshot = publicSnapshotSchema.parse(parsed)
  const unsigned = { schemaVersion: snapshot.schemaVersion, generatedAt: snapshot.generatedAt, records: snapshot.records, settings: snapshot.settings, media: snapshot.media }
  if (checksumSnapshot(unsigned) !== snapshot.checksum) throw new Error('Light CMS snapshot checksum mismatch')
  return snapshot
}

export function normalizeLightRecord(record: LightSnapshotRecord): Record<string, unknown> {
  return { ...record.data, slug: record.slug, draft: false, noindex: false }
}

export function readPayloadSnapshot(): PayloadSnapshotRecord[] | null {
  const configured = process.env.PAYLOAD_CMS_SNAPSHOT
  const snapshotPath = path.resolve(process.cwd(), configured || 'payload-cms/output/public-content-snapshot.json')
  if (!fs.existsSync(snapshotPath)) return null
  const parsed = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as { records?: PayloadSnapshotRecord[] }
  return Array.isArray(parsed.records) ? parsed.records : null
}

export function normalizePayloadRecord(record: PayloadSnapshotRecord): Record<string, unknown> {
  const source = record.data
  const seo = source.seo && typeof source.seo === 'object' ? source.seo as Record<string, unknown> : {}
  const mediaValue = (value: unknown) => {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
      const media = value as { url?: unknown; legacyPath?: unknown }
      if (typeof media.legacyPath === 'string' && media.legacyPath) return media.legacyPath
      if (typeof media.url === 'string' && media.url) return media.url
    }
    return ''
  }
  const listValue = (value: unknown) => Array.isArray(value) ? value.map((item) => typeof item === 'object' && item && 'value' in item ? String((item as { value: unknown }).value) : String(item)) : []
  const galleryValue = (value: unknown) => Array.isArray(value) ? value.map((item) => typeof item === 'object' && item && 'image' in item ? mediaValue((item as { image: unknown }).image) : mediaValue(item)).filter(Boolean) : []
  const dateValue = (value: unknown) => typeof value === 'string' && value ? value.slice(0, 10) : value
  const normalized: Record<string, unknown> = {
    ...source,
    featuredImage: mediaValue(source.featuredImage), gallery: galleryValue(source.gallery), video: mediaValue(source.video), catalogue: mediaValue(source.catalogue),
    ogImage: mediaValue(seo.ogImage), seoTitle: seo.title, seoDescription: seo.description, canonical: seo.canonical || '', noindex: seo.noindex === true,
    publishedAt: dateValue(source.publishedAt), updatedAt: dateValue(source.legacyUpdatedAt || source.updatedAt), completedAt: dateValue(source.completedAt), draft: record._status !== 'published', status: source.availability,
  }
  for (const field of ['tags','relatedProducts','relatedArticles','dimensions','thicknesses','surfaces','standards','applications','advantages','limitations','orderingSteps','workItems','process','materialTypes','fileGuidance']) if (field in source) normalized[field] = listValue(source[field])
  for (const field of ['beforeImages','afterImages']) if (field in source) normalized[field] = galleryValue(source[field])
  return normalized
}
