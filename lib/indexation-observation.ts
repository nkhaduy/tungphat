export type PublicObservationState = "OBSERVED" | "NOT_OBSERVED" | "UNKNOWN";

export type PublicIndexationObservation = {
  engine: "GOOGLE" | "BING";
  url: string;
  state: PublicObservationState;
  confirmedIndexed: null;
  method: string;
  checkedAt: string;
  confidence: "none" | "low" | "medium";
  caveat: string;
};

function canonicalComparable(value: string) {
  const url = new URL(value);
  const pathname = url.pathname === "/" ? "/" : `${url.pathname.replace(/\/+$/u, "")}/`;
  return `${url.hostname.replace(/^www\./u, "")}${pathname}`;
}

export function classifyPublicObservation({
  engine,
  targetUrl,
  responseStatus,
  resultUrls,
  checkedAt,
  caveat,
}: {
  engine: PublicIndexationObservation["engine"];
  targetUrl: string;
  responseStatus: number;
  resultUrls: string[] | null;
  checkedAt: string;
  caveat?: string;
}): PublicIndexationObservation {
  const method = engine === "GOOGLE" ? "Google public site/URL search" : "Bing public RSS site/URL search";
  if (responseStatus !== 200 || resultUrls === null) {
    return {
      engine,
      url: targetUrl,
      state: "UNKNOWN",
      confirmedIndexed: null,
      method,
      checkedAt,
      confidence: "none",
      caveat: caveat ?? "Public search response was unavailable or could not be interpreted; authenticated index status is unknown.",
    };
  }

  const target = canonicalComparable(targetUrl);
  const observed = resultUrls.some((url) => {
    try { return canonicalComparable(url) === target; } catch { return false; }
  });
  return {
    engine,
    url: targetUrl,
    state: observed ? "OBSERVED" : "NOT_OBSERVED",
    confirmedIndexed: null,
    method,
    checkedAt,
    confidence: observed ? "medium" : "low",
    caveat: observed
      ? "The exact canonical URL appeared in a public result, but only authenticated search-engine inspection can confirm index status."
      : "The canonical URL was not present in this limited public result sample; NOT_OBSERVED does not mean NOT_INDEXED.",
  };
}
