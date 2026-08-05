# An Cuong Relationship Audit

Scope: 7-product representative live sample against the complete 2,682-ID listing discovery.

## Results

- Same-colour relations: 7.
- Same-line relations: 52.
- Application relations: 6.
- Total relation records: 65.
- Unresolved product targets against discovery: 0.
- Duplicate relation records after normalization: 0.
- Same-colour edges with a reverse edge in the sample: 2.
- Same-colour one-way edges in the sample: 5. One-way does not imply an error because the target detail may not be part of the sample.
- Self-relations: 0.

## Evidence Rules

- `same-color` is parsed only from the detail page `product-map` section.
- `same-line` is parsed from source product-line cards and retains the target material-line URL.
- `application` is parsed from the source application album link.
- Product target resolution uses the full listing discovery, not only the current detail sample.
- Album IDs are application resources and are not incorrectly validated as product IDs.

Full bidirectional and cycle statistics require the resumable full detail crawl. The runbook command is `npm run catalog:ancuong:crawl:details -- --resume --concurrency=3` followed by relation, validation, and report commands.

