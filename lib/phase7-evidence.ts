export type ConfirmedIndexationState =
  | "CONFIRMED_INDEXED"
  | "CONFIRMED_NOT_INDEXED"
  | "AUTH_BLOCKED"
  | "UNKNOWN";

export type PublicFallbackState = "OBSERVED" | "NOT_OBSERVED" | "UNKNOWN";

type AuthUrlEvidence = {
  indexed: boolean | null;
  lastCrawl: string | null;
};

type AuthEngineSnapshot = {
  status: "AVAILABLE" | "AUTH_BLOCKED" | "UNKNOWN";
  urls: Record<string, AuthUrlEvidence>;
};

export type Phase7AuthSnapshot = {
  google: AuthEngineSnapshot;
  bing: AuthEngineSnapshot;
};

export function parseGoogleResultUrls(html: string) {
  if (/enable javascript|retry|unusual traffic|consent\.google/iu.test(html)) return null;
  const urls = [...html.matchAll(/href="(?:\/url\?q=)?(https?:\/\/[^"&]+)[^"\s]*"/giu)]
    .map((match) => decodeURIComponent(match[1]));
  return [...new Set(urls)];
}

export function findFirstPartyPosition(urls: string[], domain: string) {
  const normalizedDomain = domain.replace(/^www\./u, "");
  const index = urls.findIndex((url) => {
    try {
      return new URL(url).hostname.replace(/^www\./u, "") === normalizedDomain;
    } catch {
      return false;
    }
  });
  return index >= 0 ? index + 1 : null;
}

type PublicObservation = {
  engine: "GOOGLE" | "BING";
  url: string;
  state: PublicFallbackState;
  checkedAt: string;
};

export function resolveConfirmedIndexation(
  authStatus: AuthEngineSnapshot["status"],
  indexed: boolean | null,
): ConfirmedIndexationState {
  if (authStatus === "AUTH_BLOCKED") return "AUTH_BLOCKED";
  if (authStatus !== "AVAILABLE" || indexed === null) return "UNKNOWN";
  return indexed ? "CONFIRMED_INDEXED" : "CONFIRMED_NOT_INDEXED";
}

export function buildIndexationStatusMatrix({
  urls,
  auth,
  observations,
  sitemapUrl,
}: {
  urls: string[];
  auth: Phase7AuthSnapshot;
  observations: PublicObservation[];
  sitemapUrl: string;
}) {
  const observationByEngineUrl = new Map(
    observations.map((observation) => [`${observation.engine}:${observation.url}`, observation]),
  );

  return urls.map((canonical) => {
    const googleAuth = auth.google.urls[canonical] ?? { indexed: null, lastCrawl: null };
    const bingAuth = auth.bing.urls[canonical] ?? { indexed: null, lastCrawl: null };
    const googleConfirmedIndexation = resolveConfirmedIndexation(auth.google.status, googleAuth.indexed);
    const bingConfirmedIndexation = resolveConfirmedIndexation(auth.bing.status, bingAuth.indexed);
    const googleObservedFallback = observationByEngineUrl.get(`GOOGLE:${canonical}`)?.state ?? "UNKNOWN";
    const bingObservedFallback = observationByEngineUrl.get(`BING:${canonical}`)?.state ?? "UNKNOWN";
    const authenticatedEvidence = [googleConfirmedIndexation, bingConfirmedIndexation].some((state) =>
      state.startsWith("CONFIRMED_"),
    );
    const publicObservation = [googleObservedFallback, bingObservedFallback].includes("OBSERVED");

    return {
      canonical,
      googleConfirmedIndexation,
      bingConfirmedIndexation,
      googleObservedFallback,
      bingObservedFallback,
      lastCrawl: { google: googleAuth.lastCrawl, bing: bingAuth.lastCrawl },
      sitemap: sitemapUrl,
      indexationIssue: authenticatedEvidence
        ? null
        : "Authenticated indexation confirmation unavailable; public absence is not proof of non-indexation.",
      confidence: authenticatedEvidence ? "high" : publicObservation ? "medium" : "low",
    } as const;
  });
}
