import { describe, expect, it } from "vitest";
import { collectPaginatedRecords } from "@/lib/catalog/full-import/pagination";

describe("full catalogue pagination", () => {
  it("continues after the first twenty records until the declared total is reached", async () => {
    const source = Array.from({ length: 45 }, (_, index) => ({ id: index + 1 }));
    const pages: number[] = [];

    const result = await collectPaginatedRecords(async ({ page, pageSize }) => {
      pages.push(page);
      const start = (page - 1) * pageSize;
      return { records: source.slice(start, start + pageSize), total: source.length };
    }, { pageSize: 20 });

    expect(pages).toEqual([1, 2, 3]);
    expect(result.records).toEqual(source);
    expect(result.pagesFetched).toBe(3);
  });

  it("fetches the next page after a full page and stops on the first empty page", async () => {
    const pages: number[] = [];
    const result = await collectPaginatedRecords(async ({ page }) => {
      pages.push(page);
      return { records: page <= 2 ? Array.from({ length: 20 }, (_, index) => `${page}:${index}`) : [] };
    }, { pageSize: 20 });

    expect(pages).toEqual([1, 2, 3]);
    expect(result.records).toHaveLength(40);
  });
});
