import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { analyzeSource } from "../scripts/analyze-source";
import { buildMigrationSql } from "../scripts/build-migration-sql";

describe("Decap to Light CMS source analysis", () => {
  it("finds the verified content, settings and media baseline", () => {
    const analysis = analyzeSource();
    expect(analysis.issues).toEqual([]);
    expect(analysis.counts).toEqual({ products: 6, articles: 3, projects: 1, pages: 2 });
    expect(analysis.settings).toHaveLength(5);
    expect(analysis.media).toHaveLength(9);
    expect(new Set(analysis.records.map((record) => `${record.collection}:${record.slug}`)).size).toBe(12);
  });

  it("keeps the non-human migration actor disabled in identity mode", () => {
    const database = new DatabaseSync(":memory:");
    database.exec(fs.readFileSync(new URL("../migrations/0001_light_cms.sql", import.meta.url), "utf8"));
    database.exec(fs.readFileSync(new URL("../migrations/0002_access_identity.sql", import.meta.url), "utf8"));
    database.exec(fs.readFileSync(new URL("../migrations/0003_baogia_sso.sql", import.meta.url), "utf8"));
    database.exec(fs.readFileSync(new URL("../migrations/0004_remove_password_runtime.sql", import.meta.url), "utf8"));
    database.exec(buildMigrationSql(analyzeSource()));
    expect(database.prepare("SELECT active,status,access_subject FROM users WHERE id='light-cms-migration'").get()).toEqual({
      active: 0,
      status: "disabled",
      access_subject: null,
    });
    expect(database.prepare("PRAGMA table_info(users)").all().map((column) => String(column.name))).not.toContain("password_hash");
  });

  it("enforces unique Baogia subjects and one-time assertion identifiers", () => {
    const database = new DatabaseSync(":memory:");
    database.exec(fs.readFileSync(new URL("../migrations/0001_light_cms.sql", import.meta.url), "utf8"));
    database.exec(fs.readFileSync(new URL("../migrations/0002_access_identity.sql", import.meta.url), "utf8"));
    database.exec(fs.readFileSync(new URL("../migrations/0003_baogia_sso.sql", import.meta.url), "utf8"));
    database.exec(fs.readFileSync(new URL("../migrations/0004_remove_password_runtime.sql", import.meta.url), "utf8"));
    const insertUser = database.prepare(`INSERT INTO users(id,email,name,display_name,role,active,status,baogia_subject,created_at,updated_at)
      VALUES(?,?,?,?,?,1,'active',?,?,?)`);
    insertUser.run("user-1", "one@baogia.invalid", "One", "One", "super-admin", "subject-1", "2026-08-09", "2026-08-09");
    expect(() => insertUser.run("user-2", "two@baogia.invalid", "Two", "Two", "super-admin", "subject-1", "2026-08-09", "2026-08-09")).toThrow(/UNIQUE/u);

    const insertUse = database.prepare("INSERT INTO sso_assertion_uses(jti_hash,subject,expires_at,used_at) VALUES(?,?,?,?)");
    insertUse.run("jti-hash", "subject-1", 100, 90);
    expect(() => insertUse.run("jti-hash", "subject-1", 100, 91)).toThrow(/UNIQUE/u);
  });
});
