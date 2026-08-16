function addAlias(target: string[], seen: Set<string>, value: string) {
  const alias = value.trim().replace(/\s+/g, " ");
  if (!alias || seen.has(alias)) return;
  seen.add(alias);
  target.push(alias);
}

export function normalizeColorCode(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

export function buildColorCodeAliases(codeRaw: string): string[] {
  const raw = codeRaw.trim().replace(/\s+/g, " ");
  if (!raw) return [];

  const aliases: string[] = [];
  const seen = new Set<string>();
  addAlias(aliases, seen, raw);
  addAlias(aliases, seen, normalizeColorCode(raw));

  const withoutBoardPrefix = raw.replace(/^(?:MFC|MDF|HDF)\s*-\s*/i, "");
  if (withoutBoardPrefix !== raw) {
    addAlias(aliases, seen, withoutBoardPrefix);
    addAlias(aliases, seen, normalizeColorCode(withoutBoardPrefix));
    const numericTail = withoutBoardPrefix.match(/^[A-Z]+\s+(.+)$/i)?.[1];
    if (numericTail) {
      addAlias(aliases, seen, numericTail);
      addAlias(aliases, seen, normalizeColorCode(numericTail));
    }
  }

  if (/^[A-Z]{2,}\d/i.test(raw)) {
    const compact = normalizeColorCode(raw);
    const spaced = compact.replace(/^([A-Z]{2,})(\d)/, "$1 $2");
    addAlias(aliases, seen, spaced);
  }

  return aliases;
}
