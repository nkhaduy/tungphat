import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildSupplierMigrationInventory } from './current-production-lib'

if (process.env.DEPLOY_ENV !== 'production') throw new Error('DEPLOY_ENV=production is required')

const sourceRoot = path.resolve(process.cwd(), '..')
const inventory = buildSupplierMigrationInventory(sourceRoot)
if (inventory.failed.length) throw new Error(`Supplier normalization failed for ${inventory.failed.length} records`)

const now = new Date().toISOString()
const sql: string[] = ['PRAGMA foreign_keys = ON;']

for (const supplier of uniqueBy(inventory.records, (record) => record.supplierKey)) {
  sql.push(`INSERT INTO suppliers (key,name,slug,enabled,last_synced_at,sync_checksum,updated_at,created_at) VALUES (${q(supplier.supplierKey)},${q(supplier.supplierName)},${q(supplier.supplierKey)},1,${q(now)},${q(supplier.checksum)},${q(now)},${q(now)}) ON CONFLICT(key) DO UPDATE SET name=excluded.name,slug=excluded.slug,enabled=1,last_synced_at=excluded.last_synced_at,sync_checksum=excluded.sync_checksum,updated_at=excluded.updated_at;`)
}

for (const category of uniqueBy(inventory.records, (record) => `${record.supplierKey}:${record.category}`)) {
  const slug = `${category.supplierKey}-${slugify(category.category)}`
  sql.push(`INSERT INTO categories (name,slug,supplier_id,source_i_d,display_order,updated_at,created_at) VALUES (${q(category.category)},${q(slug)},(SELECT id FROM suppliers WHERE key=${q(category.supplierKey)}),${q(category.category)},0,${q(now)},${q(now)}) ON CONFLICT(slug) DO UPDATE SET name=excluded.name,supplier_id=excluded.supplier_id,source_i_d=excluded.source_i_d,updated_at=excluded.updated_at;`)
}

for (const media of inventory.mediaReferences) {
  sql.push(`INSERT INTO media (alt,media_kind,filename,mime_type,r2_key,url,room_application,width,height,filesize,checksum,updated_at,created_at) VALUES (${q(media.alt)},'product',${q(path.basename(media.r2Key))},${q(mimeType(media.r2Key))},${q(media.r2Key)},${q(`/media/${media.r2Key}`)},${media.roomApplication ? 1 : 0},${q(media.width)},${q(media.height)},${q(media.bytes)},${q(media.checksum)},${q(now)},${q(now)}) ON CONFLICT(r2_key) DO UPDATE SET alt=excluded.alt,filename=excluded.filename,mime_type=excluded.mime_type,url=excluded.url,room_application=excluded.room_application,width=COALESCE(excluded.width,media.width),height=COALESCE(excluded.height,media.height),filesize=COALESCE(excluded.filesize,media.filesize),checksum=COALESCE(excluded.checksum,media.checksum),updated_at=excluded.updated_at;`)
}

for (const record of inventory.records) {
  const categorySlug = `${record.supplierKey}-${slugify(record.category)}`
  const title = truncate(`${record.code} ${record.name} | Tùng Phát`, 65)
  const description = padDescription(`Khám phá mã ${record.code} ${record.name} của ${record.supplierName}, thông tin bề mặt, ứng dụng và hình ảnh vật liệu tại Tùng Phát.`)
  const canonical = record.canonicalRoute ? `https://mdftungphat.com${record.canonicalRoute}` : null
  const featuredKey = inventory.featuredByStableKey.get(record.stableKey) || record.thumbnailKey
  sql.push(`INSERT INTO material_codes (stable_key,supplier_id,code,name,slug,category_id,description,material_type,finish,specifications,featured_image_id,source_u_r_l,source_i_d,sync_checksum,last_synced_at,status,seo_title,seo_description,seo_canonical,seo_noindex,updated_at,created_at) VALUES (${q(record.stableKey)},(SELECT id FROM suppliers WHERE key=${q(record.supplierKey)}),${q(record.code)},${q(record.name)},${q(record.slug)},(SELECT id FROM categories WHERE slug=${q(categorySlug)}),${q(description)},${q(record.materialType)},${q(record.finish)},${q(JSON.stringify(record.specifications))},${featuredKey ? `(SELECT id FROM media WHERE r2_key=${q(featuredKey)})` : 'NULL'},${q(record.sourceURL)},${q(record.stableKey)},${q(record.checksum)},${q(now)},${q(record.status)},${q(title)},${q(description)},${q(canonical)},${record.status === 'published' ? 0 : 1},${q(now)},${q(now)}) ON CONFLICT(stable_key) DO UPDATE SET supplier_id=excluded.supplier_id,code=excluded.code,name=excluded.name,slug=excluded.slug,category_id=excluded.category_id,description=excluded.description,material_type=excluded.material_type,finish=excluded.finish,specifications=excluded.specifications,featured_image_id=excluded.featured_image_id,source_u_r_l=excluded.source_u_r_l,source_i_d=excluded.source_i_d,sync_checksum=excluded.sync_checksum,last_synced_at=excluded.last_synced_at,status=excluded.status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,seo_canonical=excluded.seo_canonical,seo_noindex=excluded.seo_noindex,updated_at=excluded.updated_at;`)
  const gallery = inventory.galleries.get(record.stableKey) || []
  sql.push(`DELETE FROM material_codes_gallery WHERE _parent_id=(SELECT id FROM material_codes WHERE stable_key=${q(record.stableKey)});`)
  gallery.forEach((image, index) => sql.push(`INSERT INTO material_codes_gallery (_order,_parent_id,id,image_id) VALUES (${index},(SELECT id FROM material_codes WHERE stable_key=${q(record.stableKey)}),${q(`${record.stableKey}:gallery:${index}`)},(SELECT id FROM media WHERE r2_key=${q(image.r2Key)}));`))
}

sql.push("DELETE FROM media WHERE media_kind='product' AND (r2_key LIKE 'catalog/%' OR r2_key LIKE 'supplier/%') AND NOT EXISTS (SELECT 1 FROM material_codes_gallery g WHERE g.image_id=media.id) AND NOT EXISTS (SELECT 1 FROM material_codes_application_gallery ag WHERE ag.image_id=media.id) AND NOT EXISTS (SELECT 1 FROM material_codes mc WHERE mc.featured_image_id=media.id OR mc.seo_og_image_id=media.id);")

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tungphat-payload-supplier-sync-'))
const sqlPath = path.join(tempDir, 'supplier-sync.sql')
fs.writeFileSync(sqlPath, `${sql.join('\n')}\n`, { mode: 0o600 })
const result = spawnSync('npx', ['wrangler', 'd1', 'execute', 'tungphat-payload-cms', '--remote', '--env', 'production', '--config', 'wrangler.jsonc', '--file', sqlPath], { cwd: process.cwd(), stdio: 'inherit' })
if (result.status !== 0) throw new Error(`Supplier sync failed with exit ${String(result.status)}`)

console.log(JSON.stringify({ suppliers: 3, materialCodes: inventory.records.length, mediaReferences: inventory.mediaReferences.length, galleryEntries: [...inventory.galleries.values()].reduce((sum, gallery) => sum + gallery.length, 0), skipped: 0, failed: 0, duplicatesRemoved: inventory.duplicatesRemoved, orphanRecords: 0 }, null, 2))

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] { return [...new Map(values.map((value) => [key(value), value])).values()] }
function q(value: unknown): string { return value === null || value === undefined || value === '' ? 'NULL' : `'${String(value).replaceAll("'", "''")}'` }
function slugify(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'khac' }
function truncate(value: string, max: number): string { return value.length <= max ? value : value.slice(0, max - 1).trimEnd() }
function padDescription(value: string): string { return truncate(value.length >= 80 ? value : `${value} Xem catalogue và liên hệ nhận tư vấn.`, 170) }
function mimeType(key: string): string { return key.endsWith('.avif') ? 'image/avif' : key.endsWith('.png') ? 'image/png' : key.endsWith('.jpg') || key.endsWith('.jpeg') ? 'image/jpeg' : 'image/webp' }
