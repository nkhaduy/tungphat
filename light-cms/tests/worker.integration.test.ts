import fs from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { describe, expect, it } from "vitest";
import worker from "../src/worker/index";

function env() {
  const db = new DatabaseSync(":memory:");
  db.exec(fs.readFileSync(new URL("../migrations/0001_light_cms.sql", import.meta.url), "utf8"));
  const valuesFor = (sql: string, values: SQLInputValue[]) => db.prepare(sql).all(...values);
  const prepare = (sql: string) => {
    let values: SQLInputValue[] = [];
    const statement = {
      bind: (...next: unknown[]) => { values = next as SQLInputValue[]; return statement; },
      all: async <T>() => ({ results: valuesFor(sql, values) as T[] }),
      first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
      run: async () => { const result = db.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
    };
    return statement;
  };
  return {
    DB: { prepare, batch: async (statements: Array<{ run: () => Promise<unknown> }>) => { db.exec("BEGIN IMMEDIATE"); try { const out=[]; for(const s of statements) out.push(await s.run()); db.exec("COMMIT"); return out; } catch(error) { db.exec("ROLLBACK"); throw error; } } } as unknown as D1Database,
    MEDIA: { head: async () => null, get: async () => null, put: async () => ({ httpEtag: "etag" }) } as unknown as R2Bucket,
    ENVIRONMENT: "test",
    APP_SECRET: "a".repeat(32),
    ACCESS_ISSUER: "https://test.cloudflareaccess.com",
    ACCESS_AUD: "light-cms-test",
    ALLOWED_ORIGINS: "https://staging.example",
  };
}

describe("Worker API", () => {
  it("returns a health response without exposing bindings", async () => {
    const response = await worker.fetch(new Request("https://staging.example/health"), env());
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual(expect.objectContaining({ ok: true, service: "tungphat-light-cms-api-staging" }));
    expect(body).not.toContain("APP_SECRET");
  });

  it("rejects unauthenticated admin access and malformed routes without a 5xx", async () => {
    const response = await worker.fetch(new Request("https://staging.example/api/products"), env());
    expect(response.status).toBe(401);
    const malformed = await worker.fetch(new Request("https://staging.example/api/content/%2e%2e%2fusers"), env());
    expect(malformed.status).toBeLessThan(500);
    expect(malformed.headers.get("X-Request-ID")).toBeTruthy();
  });
});
