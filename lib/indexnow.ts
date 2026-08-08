export function extractSitemapUrls(xml: string, expectedOrigin = "https://mdftungphat.com") {
  const origin = new URL(expectedOrigin).origin;
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu)].map((match) => match[1].trim());
  const validated = urls.map((value) => {
    const url = new URL(value);
    if (url.origin !== origin || url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      throw new Error(`IndexNow sitemap URL is not a canonical ${origin} page: ${value}`);
    }
    if (url.pathname !== "/" && !url.pathname.endsWith("/")) {
      throw new Error(`IndexNow sitemap URL must use the canonical trailing slash: ${value}`);
    }
    return url.toString();
  });
  const unique = [...new Set(validated)];
  if (unique.length > 10_000) throw new Error(`IndexNow supports at most 10,000 URLs per submission; received ${unique.length}.`);
  return unique;
}

export function shouldNotifyIndexNow(previousHash: string | undefined, currentHash: string, force = false) {
  return force || !previousHash || previousHash !== currentHash;
}

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export async function submitIndexNow({
  endpoint,
  payload,
  fetcher = fetch,
  sleep = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  maxAttempts = 3,
  baseDelayMs = 1000,
}: {
  endpoint: string;
  payload: IndexNowPayload;
  fetcher?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  baseDelayMs?: number;
}) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts += 1;
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (response.ok) return { attempts, status: response.status };
    const body = await response.text();
    const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
    if (!retryable || attempts >= maxAttempts) throw new Error(`IndexNow returned ${response.status}: ${body}`);
    await sleep(baseDelayMs * attempts);
  }
  throw new Error("IndexNow submission did not complete.");
}
