export function mediaObjectKey(environment: string | undefined, mediaId: string, filename: string) {
  const prefix = environment === "production" ? "production" : "staging";
  const safeFilename = filename.replace(/[^A-Za-z0-9._-]/gu, "-");
  return `${prefix}/${mediaId}/${safeFilename}`;
}
