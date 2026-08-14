import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(new URL("../migrations/0006_quote_payment_status.sql", import.meta.url));
const vatMigrationPath = fileURLToPath(new URL("../migrations/0007_quote_vat_rate.sql", import.meta.url));
const oldDebtMigrationPath = fileURLToPath(new URL("../migrations/0008_quote_old_debt.sql", import.meta.url));

describe("quote payment migration", () => {
  it("is additive and never deletes or rebuilds real quote data", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).toMatch(/ALTER TABLE quotes ADD COLUMN payment_status/i);
    expect(sql).toMatch(/UPDATE quotes\s+SET payment_status/i);
    expect(sql).toMatch(/CREATE INDEX/i);
    expect(sql).not.toMatch(/\b(?:DELETE|DROP|TRUNCATE|REPLACE)\b/i);
  });
});

describe("quote VAT rate migration", () => {
  it("adds only a nullable 0/8/10 rate column without touching quote rows", async () => {
    const sql = await readFile(vatMigrationPath, "utf8");
    expect(sql).toMatch(/ALTER TABLE quotes ADD COLUMN vat_rate/i);
    expect(sql).toMatch(/CHECK\s*\(\s*vat_rate\s+IS NULL\s+OR\s+vat_rate\s+IN\s*\(\s*0\s*,\s*8\s*,\s*10\s*\)\s*\)/i);
    expect(sql).not.toMatch(/\b(?:UPDATE|DELETE|DROP|TRUNCATE|REPLACE)\b/i);
  });
});

describe("quote old debt migration", () => {
  it("adds a zero-default money column without rewriting quote rows", async () => {
    const sql = await readFile(oldDebtMigrationPath, "utf8");
    expect(sql).toMatch(/ALTER TABLE quotes ADD COLUMN old_debt_amount/i);
    expect(sql).toMatch(/DEFAULT 0/i);
    expect(sql).not.toMatch(/\b(?:UPDATE|DELETE|DROP|TRUNCATE|REPLACE)\b/i);
  });
});
