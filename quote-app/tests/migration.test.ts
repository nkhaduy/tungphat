import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(new URL("../migrations/0006_quote_payment_status.sql", import.meta.url));

describe("quote payment migration", () => {
  it("is additive and never deletes or rebuilds real quote data", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).toMatch(/ALTER TABLE quotes ADD COLUMN payment_status/i);
    expect(sql).toMatch(/UPDATE quotes\s+SET payment_status/i);
    expect(sql).toMatch(/CREATE INDEX/i);
    expect(sql).not.toMatch(/\b(?:DELETE|DROP|TRUNCATE|REPLACE)\b/i);
  });
});
