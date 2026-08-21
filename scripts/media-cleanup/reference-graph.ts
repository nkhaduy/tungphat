const mediaPrefixes = ["catalog/", "supplier/", "uploads/"];

export function normalizeR2Key(value: string): string | undefined {
  let pathname: string;
  try {
    pathname = new URL(value, "https://mdftungphat.com").pathname;
  } catch {
    return undefined;
  }
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  const normalized = pathname.replace(/^\/+/, "").replace(/^media\/+/, "");
  return mediaPrefixes.some((prefix) => normalized.startsWith(prefix)) ? normalized : undefined;
}

export function collectMediaKeys(value: unknown, output = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    const key = normalizeR2Key(value);
    if (key) output.add(key);
    return output;
  }
  if (Array.isArray(value)) {
    for (const child of value) collectMediaKeys(child, output);
    return output;
  }
  if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) collectMediaKeys(child, output);
  }
  return output;
}
