# An Cuong Validation Report

Latest representative sample:

- Products: 7.
- Relations: 65.
- Media records: 20.
- Errors: 0.
- Warnings: 0.
- Result: passed.

Validated controls include non-empty discovery/product data, material URL allowlist, numeric product identity, required names/categories, duplicate identities, HTML/script/form leakage, source contact leakage, secret-like fields, allowed content-usage statuses, relation types/targets/self-reference/duplicates, media MIME/dimensions/checksums/tracking pixels, stable UTF-8 JSON, and atomic writes.

Offline test coverage uses saved root/listing/detail and binary fixtures. The normal test command performs no live bulk crawl. Live access is isolated in `npm run catalog:ancuong:test:live` and the explicit crawler commands.

Full-discovery validation passed with 33 categories, 2,682 product URLs, 0 duplicate URLs, and 0 excluded out-of-scope URLs. Full 2,682-detail validation remains a resumable operational run, not a completed claim in this report.

