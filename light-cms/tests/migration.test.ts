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
    database.exec(buildMigrationSql(analyzeSource()));
    expect(database.prepare("SELECT active,status,access_subject,password_hash FROM users WHERE id='light-cms-migration'").get()).toEqual({
      active: 0,
      status: "disabled",
      access_subject: null,
      password_hash: "!access-only!",
    });
  });
});
