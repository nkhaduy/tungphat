# Supplier Color Code Media Audit Design

## Objective

Replace the mixed supplier catalogue browsing model with a public "Mã màu" model for An Cường, Thanh Thuỳ, and Ba Thanh. Public search, grids, counts, routes, sitemap entries, and customer-facing copy must contain only verified decorative color or surface codes. Raw imports, source manifests, family records, technical records, documents, and provenance remain available for audit but are not part of the public color-code index.

## Source And Evidence Model

The existing supplier import artifacts remain immutable source evidence. A derived color-code classifier consumes those artifacts and emits a new canonical public artifact. Each emitted record has `recordType: "color-code"`, a non-empty exact `codeRaw`, normalized search aliases, a supported decorative material type, official source URLs, verified evidence, images, SEO status, and media accounting.

Records qualify only through one of three evidence paths:

1. `official-color-map`: directly present in an official supplier color map or matching-color collection.
2. `decorative-product-detail`: stable code plus decorative material/surface plus visual, color, pattern, or surface metadata on a product detail.
3. `matching-color`: an edge/PVC/matching-material code explicitly represented by the supplier as a valid matching color or surface.

Families, categories, documents, generic boards, technical-only rows, and code-less records receive a retained audit purpose but never enter the public artifact.

## Data Boundaries

- `data/imports/**` remains the raw and normalized evidence layer.
- `data/catalogs/supplier-color-codes.json` becomes the canonical public color-code index.
- `data/catalogs/supplier-search-index.json` may remain as a legacy audit artifact, but public UI and public routing must not consume mixed records from it.
- Supplier audit reports reconcile every previous searchable record to `color-code`, `product-family`, `technical`, `document`, or `other`.
- Duplicate locale/source aliases point to one canonical color code while retaining every source URL.

## Media Architecture

Media discovery is separate from classification. Supplier-specific discovery gathers HTML attributes, `picture` sources, lazy-loading attributes, CSS backgrounds, OpenGraph, JSON-LD, zoom/fullsheet actions, hydration data, and public XHR responses. The downloader is resumable, allowlisted, checksum-addressed, MIME/dimension validated, retryable, cached, and deduplicated. It never hotlinks, recolors, crops texture, upscales, or creates AI media.

Every verified color code receives a media reason code. If the source exposes usable media, at least one validated local preview is mandatory. If the source truly exposes no usable media, the UI renders the explicit text `Nguồn chưa cung cấp ảnh màu` without an empty image element. Unknown media states are invalid.

Card priority is swatch, fullsheet, actual material photo, supplier product image, then application image. Detail galleries retain all verified roles. Media rights remain `UNCONFIRMED`.

## Public Experience

The `/catalogue/` browsing experience is relabeled `Mã màu`; the H1 is `Mã màu vật liệu`, navigation uses `Mã màu`, and search placeholder is `Tìm mã màu, tên màu hoặc thương hiệu`. Supplier counts are generated from verified color codes only.

The public filters are generated from non-empty verified categories: Tất cả, Melamine, Laminate, Acrylic, Veneer, PVC / PPET, Mã cạnh, Panel, and Khác. Search ranks exact normalized code, exact raw code, exact display name, code prefix, material, supplier, pattern, then partial matches. Default ordering preserves merchandising demand while favoring Melamine and complete swatch/fullsheet evidence; code order is only a tie-break.

Existing technical or family pages keep their own intent and terminology. Legacy supplier URLs may remain as redirects or alternate entry points, but they must consume the same verified color-code artifact and must not reintroduce mixed records.

## SEO And Routes

Only verified color records may produce public color detail routes. `READY_TO_INDEX`, `NOINDEX_USEFUL`, and `NEEDS_ENRICHMENT` remain explicit. Sitemap output contains only indexable routes. Generic crawler artifacts are removed from color browsing and route generation; useful family pages can remain outside the color-code experience.

## Validation

Unit and integration tests fail when a public color record lacks a code, lacks verified evidence, includes a family/document/technical purpose, loses exact An Cường or Ba Thanh codes, or lacks a local preview while source media exists. Browser tests cover exact search, non-empty card media states, 404-free images, route/copy boundaries, desktop/mobile layout, and accessibility.

Generated reports provide supplier classification counts, canonical/alias counts, media roles, recovery reasons, recovery rate, and the final public totals. Completion requires zero broken public images, zero empty image sources, zero source-media/local-preview gaps, and no customer-facing mixed-catalogue wording in the color browsing experience.

## Deployment Boundary

The branch is pushed and deployed only to a Cloudflare preview. No main merge, production deploy, DNS change, paid service, rights-status change, or force push is permitted.
