# An Cuong Full Relationship Audit

## Factual graph

- Total source-declared edges: 26,158.
- Same-colour: 5,631.
- Same-line: 18,624.
- Application: 1,903.
- Edge-band: 0.
- Related: 0.
- Duplicate edges after normalization: 0.
- Self-references: 0.
- Target product-code collisions: 0.

Among product-ID edges resolvable inside the 2,682-product discovery, 5,326 edges have a matching reverse declaration and 127 are one-way. The factual dataset preserves direction exactly as declared; it does not synthesize reverse edges.

## Unresolved source targets

- Unresolved source-declared edges: 178.
- Unique unresolved target IDs: 63.
- Relation type: same-colour only.

These links point to valid-looking An Cuong detail URLs outside the discovered listing set, including the `eco-veneer` path. They remain in the factual graph as source-declared unresolved references and produce validation warnings rather than destructive removal or invented target products.

No `derived-reverse` or `inferred` edge is included in the public export.
