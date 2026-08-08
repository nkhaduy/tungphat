import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export function fixedLengthStream(expected: number) {
  const platformStream = (globalThis as typeof globalThis & {
    FixedLengthStream?: new (expectedLength: number) => TransformStream<Uint8Array, Uint8Array>;
  }).FixedLengthStream;
  if (platformStream) return new platformStream(expected);

  let received = 0;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      received += chunk.byteLength;
      if (received > expected) {
        controller.error(new Error("Upload exceeds declared size"));
        return;
      }
      controller.enqueue(chunk);
    },
    flush() {
      if (received !== expected) throw new Error("Upload is shorter than declared size");
    },
  });
  return transform;
}

export async function inspectAndHashStream(body: ReadableStream<Uint8Array>, maxBytes: number) {
  const reader = body.getReader();
  const first = await reader.read();
  if (first.done || first.value.byteLength === 0) throw new Error("Empty upload");
  const prefix = first.value.slice(0, 16);
  const hasher = sha256.create();
  let size = 0;
  let resolveDigest!: (value: { size: number; sha256: string }) => void;
  let rejectDigest!: (reason: unknown) => void;
  const digest = new Promise<{ size: number; sha256: string }>((resolve, reject) => { resolveDigest = resolve; rejectDigest = reject; });

  const push = (value: Uint8Array) => {
    size += value.byteLength;
    if (size > maxBytes) throw new Error("Upload exceeds size limit");
    hasher.update(value);
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      try { push(first.value); controller.enqueue(first.value); }
      catch (error) { rejectDigest(error); controller.error(error); }
    },
    async pull(controller) {
      try {
        const part = await reader.read();
        if (part.done) { resolveDigest({ size, sha256: bytesToHex(hasher.digest()) }); controller.close(); return; }
        push(part.value); controller.enqueue(part.value);
      } catch (error) { rejectDigest(error); controller.error(error); }
    },
    async cancel(reason) { rejectDigest(reason); await reader.cancel(reason); },
  });

  return { prefix, stream, digest };
}
