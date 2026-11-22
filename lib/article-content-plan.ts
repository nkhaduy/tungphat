export function articleContentPlan(hasLexicalContent: boolean, legacyBodyHidden: boolean) {
  return {
    legacy: !hasLexicalContent || !legacyBodyHidden,
    lexical: hasLexicalContent,
  };
}
