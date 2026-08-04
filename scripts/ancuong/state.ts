import type { CheckpointStatus } from "./types";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";

interface CheckpointRecord {
  status: CheckpointStatus;
  updatedAt: string;
  attempts: number;
  error?: string;
}

type CheckpointData = Record<string, CheckpointRecord>;

export async function createCheckpointStore(path: string) {
  let data = (await readJsonIfExists<CheckpointData>(path)) ?? {};

  async function persist() {
    await atomicWriteJson(path, data);
  }

  return {
    async get(url: string): Promise<CheckpointStatus | undefined> {
      return data[url]?.status;
    },
    async set(url: string, status: CheckpointStatus, error?: string): Promise<void> {
      const previous = data[url];
      data = {
        ...data,
        [url]: {
          status,
          updatedAt: new Date().toISOString(),
          attempts: status === "fetching" ? (previous?.attempts ?? 0) + 1 : (previous?.attempts ?? 0),
          ...(error ? { error } : {})
        }
      };
      await persist();
    },
    async pending(): Promise<string[]> {
      return Object.entries(data)
        .filter(([, record]) => ["queued", "fetching", "failed-retryable"].includes(record.status))
        .map(([url]) => url)
        .sort();
    },
    async entries(): Promise<CheckpointData> {
      return structuredClone(data);
    }
  };
}
