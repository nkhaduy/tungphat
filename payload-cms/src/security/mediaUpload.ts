export const MAX_MEDIA_BYTES = 15 * 1024 * 1024

// Multipart metadata is bounded separately so oversized bodies are rejected
// before Payload spends Worker CPU parsing them.
export const MAX_MEDIA_REQUEST_BYTES = MAX_MEDIA_BYTES + 64 * 1024

export function oversizedMediaRequest(contentLength: string | null): boolean {
  if (!contentLength) return false
  const bytes = Number(contentLength)
  return Number.isFinite(bytes) && bytes > MAX_MEDIA_REQUEST_BYTES
}

export async function mediaFileChecksum(file: { data: Uint8Array }): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', file.data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
