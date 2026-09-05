import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const TRUSTINDEX_URL = "https://public.trustindex.io/reviews/mdftungphat.com/lang/vi";
const OUTPUT_PATH = new URL("../data/trustindex-reviews.json", import.meta.url);

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, entity) => String.fromCodePoint(entity.startsWith("x") ? Number.parseInt(entity.slice(1), 16) : Number(entity)))
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function matchText(html, expression) {
  const match = html.match(expression);
  return match ? decodeHtml(match[1]) : "";
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(decodeHtml(value));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function parseTrustindexHtml(html) {
  const rating = Number(matchText(html, /class="wp-block-heading ti-score">\s*([\d.]+)\s*</i));
  const reviewCount = Number(matchText(html, /class="ti-count">\s*(\d+)\s*</i));
  const googleLinks = [...html.matchAll(/href="([^"]*google\.com\/maps\/search\/\?[^\"]+)"/gi)]
    .map((match) => safeHttpsUrl(match[1]))
    .filter((link, index, links) => Boolean(link) && links.indexOf(link) === index);
  const reviews = [...html.matchAll(/<article class="review\b[\s\S]*?data-id="([^"]+)"[\s\S]*?<\/article>/gi)]
    .map((match) => {
      const article = match[0];
      if (!/\bsource-Google\b/i.test(article)) return null;
      const reviewerName = matchText(article, /<span class="name">([\s\S]*?)<\/span>/i);
      const date = matchText(article, /<div class="author-text">[\s\S]*?<span class="name">[\s\S]*?<\/span>\s*<span>([\s\S]*?)<\/span>/i);
      const text = matchText(article, /<span class="ti-review-content">([\s\S]*?)<\/span>/i);
      const avatarMatch = article.match(/data-src="([^"]+)"/i) || article.match(/<img[^>]+src="([^"]+)"/i);
      const avatarUrl = avatarMatch ? safeHttpsUrl(avatarMatch[1]) : null;
      const stars = (article.match(/class="ti-star f"/g) || []).length;
      return reviewerName && stars >= 1 && stars <= 5
        ? { id: decodeHtml(match[1]), reviewerName, avatarUrl, rating: stars, text, date }
        : null;
    })
    .filter(Boolean)
    .filter((review, index, all) => all.findIndex((candidate) => candidate.id === review.id) === index);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(reviewCount) || reviewCount < 1 || !googleLinks.length || !reviews.length) {
    throw new Error(`Trustindex profile structure or review data is unavailable (rating=${rating}, count=${reviewCount}, Google links=${googleLinks.length}, reviews=${reviews.length})`);
  }

  return {
    sourceUrl: TRUSTINDEX_URL,
    source: "Google",
    rating,
    reviewCount,
    verified: /Công ty xác thực|Hồ sơ đã được xác nhận|Đã xác minh/i.test(html),
    googleLinks,
    refreshedAt: new Date().toISOString(),
    reviews,
  };
}

export function mergeCachedAvatarUrls(reviews, previousReviews) {
  const previousById = new Map((previousReviews ?? []).map((review) => [review.id, review]));
  return reviews.map((review) => {
    const cached = previousById.get(review.id)?.avatarUrl;
    return typeof cached === "string" && cached.startsWith("/")
      ? { ...review, avatarUrl: cached }
      : review;
  });
}

export async function syncTrustindexReviews({ fetchImpl = fetch } = {}) {
  const response = await fetchImpl(TRUSTINDEX_URL, {
    headers: { Accept: "text/html", "User-Agent": "TungPhat review source refresh" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Trustindex returned ${response.status}`);
  const data = parseTrustindexHtml(await response.text());
  const current = await readFile(OUTPUT_PATH, "utf8").catch(() => "");
  const previous = current ? JSON.parse(current) : null;
  if (previous) data.reviews = mergeCachedAvatarUrls(data.reviews, previous.reviews);
  if (previous && JSON.stringify({ ...previous, refreshedAt: undefined }) === JSON.stringify({ ...data, refreshedAt: undefined })) {
    data.refreshedAt = previous.refreshedAt;
  }
  const next = `${JSON.stringify(data, null, 2)}\n`;
  if (current !== next) await writeFile(OUTPUT_PATH, next);
  return data;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const data = await syncTrustindexReviews();
    console.log(`Synced ${data.reviewCount} Google reviews from Trustindex (${data.rating.toFixed(1)}/5).`);
  } catch (error) {
    // Keep the last verified snapshot so a temporary source outage cannot block a deployment.
    await readFile(OUTPUT_PATH, "utf8");
    console.warn(`Trustindex refresh skipped: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
