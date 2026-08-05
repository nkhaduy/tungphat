# An Cuong Crawler Final Report

## Completed scope

- Full discovery: 33 categories, 16 facets, 2,682 unique product URLs.
- Full detail crawl: 2,682 fetched/parsed/normalized/validated; zero missing or failed.
- Taxonomy: 33 categories, 11 currently/listing empty, 222 facet values, zero slug collisions.
- Factual relationship graph: 26,158 edges; 178 unresolved source targets retained as warnings.
- Full media discovery: 7,267 references and 4,584 unique URLs.
- Full binary media download: not performed because the storage reserve failed.
- Second cache-only run: 2,682 unchanged, all change/error classes zero, canonical checksum diff none.

## Export contract

`export-manifest.json` records schema/parser versions, source root, discovery/product/category/relation/media counts, validation status, dataset/file checksums, `fullCrawl: true`, `mediaComplete: false`, and known limitations. Dataset checksum: `9c2268e805d3655f2804dc2278c372abdb676223915d717ae01988a7a43c0203`.

## Safety and limitations

The run used HTTP-first SSR access, concurrency 2, jitter, bounded retries, atomic checkpoints, and no CAPTCHA/rate-limit bypass. No production data was mutated, no deployment or merge was performed, and large raw/runtime/media binary paths remain ignored.

The only integration limitation is full binary media availability. The complete URL manifest and checksum-deduplication strategy allow a later consumer to fetch selected media on demand while accurately retaining `mediaComplete: false`.
