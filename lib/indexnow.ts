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
