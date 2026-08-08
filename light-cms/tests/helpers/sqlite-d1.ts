import fs from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

export function createSqliteD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(new URL("../../migrations/0001_light_cms.sql", import.meta.url), "utf8"));
  sqlite.exec(fs.readFileSync(new URL("../../migrations/0002_access_identity.sql", import.meta.url), "utf8"));
  const prepare = (sql: string) => {
    let values: SQLInputValue[] = [];
    const statement = {
      bind: (...next: unknown[]) => { values = next as SQLInputValue[]; return statement; },
      all: async <T>() => ({ results: sqlite.prepare(sql).all(...values) as T[] }),
      first: async <T>() => (sqlite.prepare(sql).get(...values) as T | undefined) ?? null,
      run: async () => { const result = sqlite.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
    };
    return statement;
  };
  const db = {
    prepare,
    batch: async (statements: Array<{ run: () => Promise<unknown> }>) => {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const output = [];
        for (const statement of statements) output.push(await statement.run());
        sqlite.exec("COMMIT");
        return output;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
  return { db, sqlite };
}
