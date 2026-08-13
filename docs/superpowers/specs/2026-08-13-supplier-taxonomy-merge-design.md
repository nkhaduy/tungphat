# Supplier Taxonomy Merge Design

## Goal

Make the shared Tùng Phát catalogue expose every imported supplier item,
including Thanh Thuỳ products without color codes such as the five plastic edge
bands, and provide a consistent hierarchy for comparable surface groups across
Thanh Thuỳ, Ba Thanh, and An Cường.

## Current Evidence

- Thanh Thuỳ source API and sitemap both contain 348 products.
- The local Thanh Thuỳ catalogue contains five `Chỉ nẹp nhựa` records: black,
  white, and woodgrain 1-3. They are valid family records without SKU codes.
- The public shared search index is built from color-code records only, so those
  five records are absent from production search results.
- Existing supplier data already expresses equivalent groups with different
  labels (`Vân Gỗ`, `van-go`, `Woodgrain`, etc.).

## Design

### Canonical taxonomy

The shared taxonomy keeps material as the first level:

- Melamine
- Laminate
- Acrylic
- Veneer
- PVC / PPET
- Mặt Top (Compact)
- Mã cạnh
- Panel
- Khác

Pattern groups are normalized independently and are only shown when a supplier
record has evidence for them:

- `woodgrain` -> Vân gỗ
- `solid` -> Đơn sắc
- `stone-material` -> Vân đá / vật liệu
- `textile-leather-rattan` -> Vân vải / da / mây
- `effect` -> Hiệu ứng khác
- `collection` -> supplier collection/series (Oak, Walnut, LP, LE, etc.)

Source labels remain available as `sourceGroup`/`series`; canonical groups are
used for filtering and display. No record is merged or deduplicated across
suppliers by name; only labels are mapped to the same canonical filter.

### Record coverage

The shared index accepts both color-code records and catalogue product/family
records. A family without a code remains searchable by name and category, is
shown in the relevant material filter, and links to its supplier category route
when it has no detail code route. It is not promoted as an indexable color-code
detail page.

### Hierarchical UI

The shared catalogue keeps the existing material buttons. Selecting a material
reveals a second row containing only canonical groups with records in the
current supplier scope. Selecting a group filters the result set. Supplier
collections remain visible in card taxonomy and are not invented as global
groups unless the canonical group mapping has evidence.

The URL state remains query-based (`group` plus optional `supplier`) so existing
links continue to work. Invalid or stale groups are ignored by the parser.

### Routing and metadata

Family records use the existing supplier/category route, while color-code
records keep their canonical code route. Category routes remain useful for
non-code products and are not made indexable solely because a family record is
present.

## Error handling and safety

- Unknown source labels fall back to `other-decorative` and remain visible.
- A missing code must never prevent a record from entering the shared search
  index.
- Existing source URLs, image rights status, and supplier identity are kept
  unchanged.
- The build must fail on duplicate record IDs or invalid taxonomy values.

## Verification

- Unit tests cover label normalization, family-record indexing, and group
  filtering.
- Existing supplier validation and catalogue tests continue to pass.
- Production browser verification confirms `Mã cạnh` includes Thanh Thuỳ
  family cards and `Melamine` exposes the second-level group row.
- Build, lint, typecheck, Vitest, E2E, and production console/network checks
  are run before declaring completion.
