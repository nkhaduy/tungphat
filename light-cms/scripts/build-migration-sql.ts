import path from "node:path";
import type { SourceAnalysis } from "./analyze-source";

const quote = (value: unknown) => `'${String(value ?? "").replaceAll("'", "''")}'`;

function sourceTimestamp(analysis: SourceAnalysis) {
  const values = [
    ...analysis.records.flatMap((record) => [record.data.updatedAt, record.data.publishedAt, record.data.completedAt]),
    ...analysis.settings.map((setting) => setting.data.updatedAt),
  ];
  const timestamps = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);
  return new Date(Math.max(0, ...timestamps)).toISOString();
}

export function buildMigrationSql(analysis: SourceAnalysis) {
  const actor = "light-cms-migration";
  const now = sourceTimestamp(analysis);
  const sql: string[] = [
    "PRAGMA foreign_keys=ON;",
    `INSERT INTO users(id,email,name,display_name,role,active,status,access_subject,created_at,updated_at)
VALUES(${quote(actor)},'migration@staging.invalid','Light CMS Migration','Light CMS Migration','super-admin',0,'disabled',NULL,${quote(now)},${quote(now)})
ON CONFLICT(id) DO UPDATE SET name=excluded.name,display_name=excluded.display_name,active=0,status='disabled',access_subject=NULL,updated_at=excluded.updated_at;`,
  ];
  for (const record of analysis.records) {
    const id = `${record.collection}-${record.slug}`;
    const excerpt = String(record.data.excerpt || "");
    const image = String(record.data.featuredImage || "");
    sql.push(`INSERT INTO content_records(id,collection,slug,title,status,excerpt,featured_image,content_json,version,created_by,updated_by,created_at,updated_at,published_at,deleted_at) VALUES(${quote(id)},${quote(record.collection)},${quote(record.slug)},${quote(record.data.title)},${quote(record.status)},${quote(excerpt)},${quote(image)},${quote(JSON.stringify(record.data))},1,${quote(actor)},${quote(actor)},${quote(now)},${quote(now)},${record.status === "published" ? quote(now) : "NULL"},NULL) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,status=excluded.status,excerpt=excluded.excerpt,featured_image=excluded.featured_image,content_json=excluded.content_json,updated_at=excluded.updated_at,published_at=excluded.published_at,deleted_at=NULL;`);
    sql.push(`INSERT OR IGNORE INTO versions(id,scope,collection_key,record_id,version,snapshot_json,actor_id,created_at) VALUES(${quote(`version-${id}-1`)},'content',${quote(record.collection)},${quote(id)},1,${quote(JSON.stringify(record.data))},${quote(actor)},${quote(now)});`);
  }
  for (const setting of analysis.settings) {
    sql.push(`INSERT INTO settings_records(key,content_json,version,updated_by,updated_at) VALUES(${quote(setting.key)},${quote(JSON.stringify(setting.data))},1,${quote(actor)},${quote(now)}) ON CONFLICT(key) DO UPDATE SET content_json=excluded.content_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at;`);
  }
  for (const media of analysis.media) {
    const hex = media.checksum.padEnd(32, "0");
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    sql.push(`INSERT INTO media(id,state,filename,object_key,mime_type,declared_size,actual_size,sha256,alt,uploaded_by,created_at,ready_at) VALUES(${quote(id)},'ready',${quote(path.basename(media.publicPath))},${quote(`migrated${media.publicPath}`)},${quote(media.mimeType)},${media.size},${media.size},${quote(media.checksum)},${quote(media.alt)},${quote(actor)},${quote(now)},${quote(now)}) ON CONFLICT(id) DO UPDATE SET state='ready',filename=excluded.filename,object_key=excluded.object_key,mime_type=excluded.mime_type,declared_size=excluded.declared_size,actual_size=excluded.actual_size,sha256=excluded.sha256,alt=excluded.alt,ready_at=excluded.ready_at,deleted_at=NULL;`);
  }
  return `${sql.join("\n")}\n`;
}
