export type PaginatedPage<T> = {
  records: T[];
  total?: number;
};

export async function collectPaginatedRecords<T>(
  fetchPage: (input: { page: number; pageSize: number }) => Promise<PaginatedPage<T>>,
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<{ records: T[]; pagesFetched: number }> {
  const pageSize = options.pageSize ?? 20;
  const maxPages = options.maxPages ?? 10_000;
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error("pageSize must be a positive integer");
  if (!Number.isInteger(maxPages) || maxPages < 1) throw new Error("maxPages must be a positive integer");

  const records: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchPage({ page, pageSize });
    records.push(...result.records);
    if (typeof result.total === "number" && records.length >= result.total) {
      return { records: records.slice(0, result.total), pagesFetched: page };
    }
    if (result.records.length === 0 || result.records.length < pageSize) {
      return { records, pagesFetched: page };
    }
  }
  throw new Error(`Pagination exceeded safety limit of ${maxPages} pages`);
}
