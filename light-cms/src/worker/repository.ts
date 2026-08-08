import type { CollectionName, ContentStatus } from "../contracts/content";
import type { ContentSummary } from "../contracts/api";

type D1Like = Pick<D1Database, "prepare" | "batch">;
type SummaryRow = { id: string; collection: CollectionName; slug: string; title: string; status: ContentStatus; version: number; updated_at: string };

export type ContentMutation = {
  id: string; collection: CollectionName; expectedVersion: number; actorId: string; requestId: string; now: string;
  slug: string; title: string; status: ContentStatus; excerpt: string; featuredImage: string; contentJson: string; publishedAt?: string | null;
};

function summary(row: SummaryRow): ContentSummary {
  return { id: row.id, collection: row.collection, slug: row.slug, title: row.title, status: row.status, version: row.version, updatedAt: row.updated_at };
}

function limitValue(value: number | undefined) {
  return Number.isInteger(value) ? Math.min(Math.max(value || 20, 1), 50) : 20;
}

export async function listContent(db: D1Like, collection: CollectionName, options: { limit?: number; cursor?: string } = {}) {
  const limit = limitValue(options.limit);
  const cursor = options.cursor ? JSON.parse(atob(options.cursor)) as { updatedAt: string; id: string } : null;
  const statement = cursor
    ? db.prepare(`SELECT id, collection, slug, title, status, version, updated_at FROM content_records
      WHERE collection=?1 AND deleted_at IS NULL AND (updated_at < ?2 OR (updated_at = ?2 AND id < ?3))
      ORDER BY updated_at DESC, id DESC LIMIT ?4`).bind(collection, cursor.updatedAt, cursor.id, limit + 1)
    : db.prepare(`SELECT id, collection, slug, title, status, version, updated_at FROM content_records
      WHERE collection=?1 AND deleted_at IS NULL ORDER BY updated_at DESC, id DESC LIMIT ?2`).bind(collection, limit + 1);
  const result = await statement.all<SummaryRow>();
  const rows = result.results as SummaryRow[];
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(summary);
  const last = items.at(-1);
  return { items, nextCursor: hasMore && last ? btoa(JSON.stringify({ updatedAt: last.updatedAt, id: last.id })) : null };
}

export async function getContent(db: D1Like, id: string) {
  return db.prepare(`SELECT id, collection, slug, title, status, excerpt, featured_image, content_json, version, created_by, updated_by, created_at, updated_at, published_at
    FROM content_records WHERE id=?1 AND deleted_at IS NULL LIMIT 1`).bind(id).first<Record<string, unknown>>();
}

function batchChanges(result: unknown) {
  const value = result as { meta?: { changes?: number } };
  return Number(value?.meta?.changes || 0);
}

export async function updateContent(db: D1Like, input: ContentMutation): Promise<{ conflict: true } | { conflict: false; version: number }> {
  const nextVersion = input.expectedVersion + 1;
  const statements = [
    db.prepare(`UPDATE content_records SET slug=?1,title=?2,status=?3,excerpt=?4,featured_image=?5,content_json=?6,
      version=version+1,updated_by=?7,updated_at=?8,published_at=?9
      WHERE id=?10 AND version=?11 AND collection=?12 AND deleted_at IS NULL`)
      .bind(input.slug, input.title, input.status, input.excerpt, input.featuredImage, input.contentJson, input.actorId, input.now, input.publishedAt || null, input.id, input.expectedVersion, input.collection),
    db.prepare(`INSERT INTO versions(id,scope,collection_key,record_id,version,snapshot_json,actor_id,created_at)
      SELECT lower(hex(randomblob(16))),'content',collection, id, version, content_json, ?1, ?2 FROM content_records
      WHERE id=?3 AND version=?4 AND collection=?5 AND deleted_at IS NULL`).bind(input.actorId, input.now, input.id, nextVersion, input.collection),
    db.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
      SELECT lower(hex(randomblob(16))),?1,'content.update',collection,id,?2,?3,?4 FROM content_records
      WHERE id=?5 AND version=?6 AND collection=?7 AND deleted_at IS NULL`).bind(input.actorId, input.requestId, JSON.stringify({ version: nextVersion, status: input.status }), input.now, input.id, nextVersion, input.collection),
  ];
  const result = await db.batch(statements);
  if (batchChanges(result[0]) !== 1) return { conflict: true };
  return { conflict: false, version: nextVersion };
}

export async function createContent(db: D1Like, input: Omit<ContentMutation, "expectedVersion"> & { id: string }) {
  const statements = [
    db.prepare(`INSERT INTO content_records(id,collection,slug,title,status,excerpt,featured_image,content_json,version,created_by,updated_by,created_at,updated_at,published_at)
      VALUES(?1,?2,?3,?4,?5,?6,?7,?8,1,?9,?9,?10,?10,?11)`)
      .bind(input.id, input.collection, input.slug, input.title, input.status, input.excerpt, input.featuredImage, input.contentJson, input.actorId, input.now, input.publishedAt || null),
    db.prepare(`INSERT INTO versions(id,scope,collection_key,record_id,version,snapshot_json,actor_id,created_at)
      SELECT lower(hex(randomblob(16))),'content',collection,id,version,content_json,?1,?2 FROM content_records WHERE id=?3 AND version=1`).bind(input.actorId, input.now, input.id),
    db.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
      SELECT lower(hex(randomblob(16))),?1,'content.create',collection,id,?2,?3,?4 FROM content_records WHERE id=?5`).bind(input.actorId, input.requestId, JSON.stringify({ version: 1, status: input.status }), input.now, input.id),
  ];
  await db.batch(statements);
  return { id: input.id, version: 1 };
}

export async function softDeleteContent(db: D1Like, id: string, collection: CollectionName, expectedVersion: number, actorId: string, requestId: string, now: string) {
  const result = await db.batch([
    db.prepare(`UPDATE content_records SET deleted_at=?1,version=version+1,updated_by=?2,updated_at=?1 WHERE id=?3 AND collection=?4 AND version=?5 AND deleted_at IS NULL`).bind(now, actorId, id, collection, expectedVersion),
    db.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
      SELECT lower(hex(randomblob(16))),?1,'content.delete',collection,id,?2,'{}',?3 FROM content_records WHERE id=?4 AND collection=?5 AND version=?6 AND deleted_at=?3`).bind(actorId, requestId, now, id, collection, expectedVersion + 1),
  ]);
  return { conflict: batchChanges(result[0]) !== 1 };
}

export async function listVersions(db: D1Like, recordId: string, limit = 30) {
  return db.prepare(`SELECT id,scope,collection_key,record_id,version,actor_id,created_at FROM versions WHERE record_id=?1 ORDER BY version DESC LIMIT ?2`).bind(recordId, Math.min(Math.max(limit, 1), 30)).all();
}

export async function restoreVersion(db: D1Like, recordId: string, version: number, expectedVersion: number, actorId: string, requestId: string, now: string) {
  const source = await db.prepare(`SELECT snapshot_json FROM versions WHERE record_id=?1 AND version=?2 LIMIT 1`).bind(recordId, version).first<{ snapshot_json: string }>();
  if (!source) return { notFound: true as const };
  const result = await db.batch([
    db.prepare(`UPDATE content_records SET content_json=?1,version=version+1,updated_by=?2,updated_at=?3 WHERE id=?4 AND version=?5 AND deleted_at IS NULL`).bind(source.snapshot_json, actorId, now, recordId, expectedVersion),
    db.prepare(`INSERT INTO versions(id,scope,collection_key,record_id,version,snapshot_json,actor_id,created_at)
      SELECT lower(hex(randomblob(16))),'content',collection,id,version,content_json,?1,?2 FROM content_records WHERE id=?3 AND version=?4`).bind(actorId, now, recordId, expectedVersion + 1),
    db.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
      SELECT lower(hex(randomblob(16))),?1,'content.restore',collection,id,?2,?3,?4 FROM content_records WHERE id=?5 AND version=?6`).bind(actorId, requestId, JSON.stringify({ restoredVersion: version }), now, recordId, expectedVersion + 1),
  ]);
  return batchChanges(result[0]) === 1 ? { notFound: false as const, conflict: false as const, version: expectedVersion + 1 } : { notFound: false as const, conflict: true as const };
}
