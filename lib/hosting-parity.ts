export type PageSignals = {
  status: number;
  finalUrl: string;
  redirects: string[];
  title: string;
  canonical: string;
  description: string;
  robots: string;
  schemaCount: number;
};

const fields: Array<keyof Omit<PageSignals, "finalUrl" | "redirects">> = [
  "status",
  "title",
  "canonical",
  "description",
  "robots",
  "schemaCount",
];

function comparableUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}

export function comparePageSignals(current: PageSignals, candidate: PageSignals) {
  const mismatches: string[] = fields.filter((field) => current[field] !== candidate[field]);
  if (comparableUrl(current.finalUrl) !== comparableUrl(candidate.finalUrl)) mismatches.push("finalUrl");
  if (current.redirects.map(comparableUrl).join("|") !== candidate.redirects.map(comparableUrl).join("|")) mismatches.push("redirects");
  return { mismatches };
}
