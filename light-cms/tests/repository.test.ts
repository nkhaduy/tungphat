import fs from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { listContent, updateContent } from "../src/worker/repository";

function migratedDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec(fs.readFileSync(new URL("../migrations/0001_light_cms.sql", import.meta.url), "utf8"));
  db.exec(`INSERT INTO users(id,email,name,role,password_hash,created_at,updated_at)
    VALUES('user-1','admin@example.com','Admin','super-admin','hash','2026-08-04T00:00:00Z','2026-08-04T00:00:00Z')`);
  return db;
}

function asD1(db: DatabaseSync) {
  const prepare = (sql: string) => {
    let values: SQLInputValue[] = [];
    const statement = {
      bind: (...next: unknown[]) => { values = next as SQLInputValue[]; return statement; },
      all: async () => ({ results: db.prepare(sql).all(...values) }),
      first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
      run: async () => { const result = db.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
    };
    return statement;
  };
  return {
    prepare,
    batch: async (statements: Array<{ run: () => Promise<unknown> }>) => {
      db.exec("BEGIN IMMEDIATE");
      try { const results = []; for (const statement of statements) results.push(await statement.run()); db.exec("COMMIT"); return results; }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1Database;
}

describe("content repository", () => {
  it("lists summary columns without returning content JSON", async () => {
    const db = migratedDatabase();
    db.prepare(`INSERT INTO content_records(id,collection,slug,title,status,content_json,created_by,updated_by,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`).run("record-1", "products", "van-mdf", "Ván MDF", "draft", '{"body":"secret"}', "user-1", "user-1", "2026-08-04T00:00:00Z", "2026-08-04T00:00:00Z");
    const result = await listContent(asD1(db), "products", { limit: 20 });
    expect(result.items).toEqual([{ id: "record-1", collection: "products", slug: "van-mdf", title: "Ván MDF", status: "draft", version: 1, updatedAt: "2026-08-04T00:00:00Z" }]);
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("does not create a version or audit row when optimistic version is stale", async () => {
    const db = migratedDatabase();
    db.prepare(`INSERT INTO content_records(id,collection,slug,title,status,content_json,created_by,updated_by,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`).run("record-1", "products", "van-mdf", "Ván MDF", "draft", '{}', "user-1", "user-1", "2026-08-04T00:00:00Z", "2026-08-04T00:00:00Z");
    const result = await updateContent(asD1(db), {
      id: "record-1", collection: "products", expectedVersion: 9, actorId: "user-1", requestId: "request-1", now: "2026-08-04T01:00:00Z",
      slug: "van-mdf", title: "Ván MDF mới", status: "draft", excerpt: "", featuredImage: "", contentJson: "{}",
    });
    expect(result).toEqual({ conflict: true });
    expect(db.prepare("SELECT COUNT(*) AS count FROM versions").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM audit_logs").get()).toEqual({ count: 0 });
  });

  it("does not update a record through a different collection route", async () => {
    const db = migratedDatabase();
    db.prepare(`INSERT INTO content_records(id,collection,slug,title,status,content_json,created_by,updated_by,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`).run("record-1", "articles", "huong-dan", "Hướng dẫn", "draft", '{"title":"Hướng dẫn"}', "user-1", "user-1", "2026-08-04T00:00:00Z", "2026-08-04T00:00:00Z");
    const result = await updateContent(asD1(db), {
      id: "record-1", collection: "products", expectedVersion: 1, actorId: "user-1", requestId: "request-1", now: "2026-08-04T01:00:00Z",
      slug: "van-mdf", title: "Ván MDF", status: "draft", excerpt: "", featuredImage: "", contentJson: '{"title":"Ván MDF"}',
    });
    expect(result).toEqual({ conflict: true });
    expect(db.prepare("SELECT collection,title,version FROM content_records WHERE id='record-1'").get()).toEqual({ collection: "articles", title: "Hướng dẫn", version: 1 });
  });

});
