# An Cuong Crawler Architecture

## Boundaries

This branch contains only the An Cuong crawler and import data contract. It does not add routes, components, SEO pages, CMS writes, production mutations, deployments, or Thanh Thuy pipeline coupling.

## Pipeline

`discover -> crawl-listings -> crawl-details -> crawl-relations -> download-media -> normalize -> validate -> diff -> export -> report`

- `discover.ts`: fetches the material root and writes the category discovery manifest.
- `crawl-listings.ts`: fetches every discovered category, parses cards/facets, deduplicates canonical URLs, and checkpoints category progress.
- `crawl-details.ts`: fetches numeric product pages, parses source facts, product lines, warnings, images, and explicit relations, then checkpoints each URL.
- `crawl-relations.ts`: flattens explicit source relationships into a stable graph contract.
- `download-media.ts`: downloads binary images, checks true MIME/dimensions, hashes bytes, deduplicates files, and writes a manifest.
- `normalize.ts`: preserves source codes, creates stable normalized codes/hashes, separates source facets, builds taxonomy and categories, and removes duplicates.
- `validate.ts`: checks scope, identities, markup/contact/secret leakage, relations, media, and dataset invariants.
- `diff.ts`: classifies new, updated, unchanged, missing, invalid, duplicate, relation, and media changes without deleting missing records.
- `export.ts`: emits six stable, checksummed integration artifacts.
- `report.ts`: emits machine-readable and Markdown run summaries.

## Reliability

- One shared HTTP client per runner provides pacing, retry, timeout, Retry-After handling, transparent User-Agent, and anti-bot stop behavior.
- Checkpoints use explicit URL states. JSON and binary files are written to a temporary sibling and atomically renamed.
- `--resume` reuses parsed checkpoints and existing media. `--force` deliberately refetches selected scope.
- Canonical normalized records preserve previous timestamps when the normalized facts have not changed.
- Stable JSON sorts object keys and contract records but does not reorder source-significant arrays.
- Media cache identity includes URL, product, code, and role so primary/gallery records cannot overwrite each other.

## Runtime Data

- Raw: `data/imports/ancuong/raw/`
- State: `data/imports/ancuong/state/`
- Media files: `data/imports/ancuong/media/`
- Normalized review data: `data/imports/ancuong/normalized/`
- Reports: `data/imports/ancuong/reports/`
- Integration contract: `data/imports/ancuong/export/`

Large raw/state/media/cache/log paths are ignored by Git. Reviewable fixtures, manifests, reports, schemas, and sample exports are retained.
