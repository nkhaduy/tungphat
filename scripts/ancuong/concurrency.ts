export async function mapConcurrent<T, R>(items: readonly T[], requestedConcurrency: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]!, index);
    }
  };
  const concurrency = Math.max(1, Math.min(requestedConcurrency, items.length || 1));
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}
