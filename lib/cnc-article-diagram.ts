/** Keep all text and the illustration if an editorial anchor changes. */
export function splitEditorialImage(body: string, marker: string): [string, string] {
  const index = body.indexOf(marker);
  if (index < 0 || body.indexOf(marker, index + marker.length) !== -1) {
    console.warn(`Editorial image anchor missing or ambiguous: ${marker}; placing illustration after the body.`);
    return [body, ""];
  }
  return [body.slice(0, index), body.slice(index)];
}

export function splitCncArticle(slug: string, body: string): [string, string] | null {
  return slug === "chuan-bi-file-cnc" ? splitEditorialImage(body, "## Ba chỗ hay nhầm trong file") : null;
}
