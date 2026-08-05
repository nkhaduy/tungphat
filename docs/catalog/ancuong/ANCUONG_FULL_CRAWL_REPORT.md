# An Cuong Full Detail Crawl Report

## Coverage

- Full discovery: 33 categories, 16 facets, 2,682 unique product URLs.
- Fetched: 2,682.
- Parsed: 2,682.
- Normalized: 2,682.
- Validated: 2,682.
- Missing, duplicate, source unavailable, failed retryable, failed final: 0.
- Terminal states: 2,682; remaining non-terminal: 0.
- Crawl duration: 2,466.91 seconds at concurrency 2 with the shared jitter/retry gate.

Every listing URL has exactly one raw detail record and one checkpoint entry. The final checkpoint contains 2,682 `parsed` states and no `queued`, `fetching`, `fetched`, or retryable state.

## Quality

- Missing product code: 0.
- Missing category: 0.
- Missing primary image URL: 0.
- Products with a technical dimension/thickness matrix: 2,258.
- Products with multiple gallery images: 1,903.
- Product codes containing `/`: 157.
- Validation errors: 0.
- Validation warnings: 178 source-declared same-colour targets outside the discovered catalogue.

One source page, `https://ancuong.com/laminate/303001889.html` (`LF 7928 UN`), contains identity and primary-image markup but an empty source `product-info` container. It is retained as a valid source-empty product rather than treated as parser failure.

## Safety

No CAPTCHA, challenge, 403 block, rotating proxy, browser automation, or production mutation was used. Raw details and checkpoint state remain in ignored runtime paths; normalized/export artifacts and audit reports are reviewable Git outputs.
