export type DeleteExpectation = { key: string; etag: string; size: number };

export function validateDeletionBatch(expected: DeleteExpectation[], actual: DeleteExpectation[]): void {
  const actualByKey = new Map(actual.map((object) => [object.key, object]));
  for (const object of expected) {
    const current = actualByKey.get(object.key);
    if (!current) throw new Error(`Missing R2 object before delete: ${object.key}`);
    if (current.etag.replaceAll('"', "") !== object.etag.replaceAll('"', "")) {
      throw new Error(`Stale ETag for ${object.key}`);
    }
    if (current.size !== object.size) throw new Error(`Size drift for ${object.key}`);
  }
}
