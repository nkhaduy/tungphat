# Catalogue Card Copy Normalization

## Goal

Make public colour-code cards more compact and consistent without changing raw supplier records, search aliases, copy-code values, routes, or provenance.

## Display rules

1. The card eyebrow shows only the supplier name: `Thanh Thuỳ`, `Ba Thanh`, or `An Cường`. Remove the adjacent `Mã màu` label.
2. Render one primary title only. Do not render a separate code-only row above it.
3. When the supplier name already contains the code, preserve that concise combined name, for example `301 Artistic Stripe`.
4. For Ba Thanh, remove public title prefixes such as `MELAMINE BA THANH –` or `LAMINATE BA THANH –`, leaving the actual code/name such as `BT 111` or `SC 016M`.
5. Prefix taxonomy metadata with `Danh mục:` and capitalize the first label, for example `Danh mục: Melamine · Vân Gỗ`.
6. Deduplicate category, series, and group labels after normalization, so `Melamine · Vân Gỗ · Vân Gỗ` becomes `Melamine · Vân Gỗ`.

## Architecture

Add pure display helpers in `lib/catalog/ui.ts` for the card title and taxonomy line. Both the shared catalogue hub cards and supplier catalogue cards consume the helpers. The helpers are presentation-only and never mutate `CatalogSearchEntry`.

## Scope

- Shared `/catalogue/` result cards.
- Supplier `/catalogue/<supplier>/` and material result cards.
- Legacy Ba Thanh card title where the same prefix can appear.

## Non-goals

- No changes to raw source JSON, `code`, `normalizedCode`, search ranking, copy-code behavior, canonical URLs, detail-page H1, media, or supplier ordering.

## Acceptance criteria

- `301 Artistic Stripe` appears once on its card and the standalone `301` line is absent.
- The eyebrow reads `Thanh Thuỳ`, not `Thanh Thuỳ · Mã màu`.
- The taxonomy line reads `Danh mục: Melamine · Vân Gỗ` with no repeated `Vân Gỗ`.
- Ba Thanh cards do not display `MELAMINE BA THANH –` or `LAMINATE BA THANH –`.
- Copy buttons still copy the exact underlying code.
