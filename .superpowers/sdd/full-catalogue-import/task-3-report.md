# Task 3 Report: Capacity-safe Supplier Media Provenance

## Outcome

`DONE_WITH_CONCERNS`

Task 3 implements deterministic, offline/import-only supplier media manifests and capacity gates without downloading the projected An Cường full-original payload. No production deploy or rights-status change occurred.

## TDD evidence

RED was captured before production implementation:

1. `tests/supplier-full-media.test.ts` initially failed because `lib/catalog/full-import/media.ts` did not exist.
2. HEAD-only inventory tests failed while `inventoryMediaOrigin` was absent.
3. Checkpoint/resume tests failed while `inventoryMediaOriginsWithCache` was absent.
4. The total-operation deadline test measured 262 ms against a 100 ms bound before the timeout was changed from per-attempt to whole-operation.
5. Crawl-safety tests failed because HTTP 429 trusted a payload length, normal resume retried cached 429, and requested concurrency reached five.
6. The explicit relationship test failed with 253 generated Ba Thành local refs versus 241 source-declared local refs, identifying URL-only grouping as the root cause.

Final focused result: 16/16 media tests pass.

## Shared provenance model

`lib/catalog/full-import/media.ts` defines:

- official HTTPS host allowlists by supplier;
- source origins with source/final URL, validated redirect chain, status, MIME, `Content-Length` or `unknown`, source checksum, rate-limit evidence, and error;
- product/media references preserving product ID, role, and source URL;
- `LOCAL_PREVIEW`, `ORIGINAL_PROVENANCE_ONLY`, `UNRESOLVED`, `DEFERRED`, and `INVALID` states;
- `exact-source-bytes` versus `legacy-transformed` local delivery metadata;
- local MIME/dimensions/bytes/SHA-256 validation;
- stable checksums independent of generation time/order;
- checksum deduplication that retains all source/product/role relationships;
- hotlink, invented-path, rights, state, metadata, and capacity validation.

All media rights remain `UNCONFIRMED`.

## Crawl and rate-limit safety

The first live attempt was stopped before media writes after discovering that concurrency was bounded per supplier (up to 18 requests), not globally. The implementation was changed to one global checkpointed pool.

The checkpointed pass then exposed supplier HTTP 429 responses. It was stopped rather than treating throttled metadata as complete. An intermediate safety snapshot contained 3,511 HTTP 200 and 689 HTTP 429 outcomes; the atomic cache advanced before termination to a final 3,671 HTTP 200 and 529 HTTP 429 outcomes. No broad live run occurred after the safety stop.

The final implementation:

- globally caps inventory concurrency at three;
- paces request starts per host;
- manually validates every redirect and host;
- uses one total deadline across all hops/retries;
- atomically checkpoints every 20 completed origins in ignored `.cache/supplier-media/`;
- records HTTP 429 as `rateLimited: true`, `contentLength: "unknown"`, optional `retryAfter`, and an explicit error;
- does not retry cached 429 or terminal errors during normal resume;
- requires explicit `--refresh-rate-limited` after a documented wait window;
- disables preview GETs by default and requires explicit `--download-previews --preview-limit=N`, hard-capped at 50;
- uses HEAD only for broad metadata and never GETs a large original because length is missing.

Offline completion filled the remaining 3,723 URLs as explicit offline-unknown inventory. The generated manifests therefore account for all 7,923 combined unique URLs without claiming all public metadata was successfully observed.

## Capacity decision

- Free disk during the task: approximately 25 GiB.
- An Cường normalized products: 2,682.
- An Cường archival-original references: 7,267 across 4,584 unique original/application URLs.
- Prior sampled full-image projection: approximately 29.1 GiB for primary originals alone.
- Result: full-original download remains forbidden/deferred.
- An Cường supplier-thumbnail references: 2,682.
- Result: no broad thumbnail GET was performed after rate limiting; all remain explicit `DEFERRED` preview inventory with no invented local path.
- Ba Thành/Thanh Thuỳ source-only originals remain deferred; existing transformed files are retained and honestly labeled delivery variants.

Cloudflare Pages limits used: 20,000 files and 25 MiB per asset from <https://developers.cloudflare.com/pages/platform/limits/> (updated/checked 2026-07-16).

## Exact generated counts

| Supplier | Total refs | Unique URLs | Local preview refs/files/bytes | Original-only refs | Unresolved/deferred refs | Invalid refs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| An Cường | 9,949 | 7,262 | 0 / 0 / 0 | 6,209 | 3,740 | 0 |
| Ba Thành | 352 | 316 | 241 / 239 / 44,162,928 | 0 | 111 | 0 |
| Thanh Thuỳ | 353 | 345 | 348 / 286 / 36,194,932 | 0 | 5 | 0 |
| Combined | 10,654 | 7,923 | 589 / 525 / 80,357,860 | 6,209 | 3,856 | 0 |

Public catalogue gate evidence:

- files: 1,330 / 20,000 (`PASS`);
- bytes: 107,453,754;
- maximum file: 469,014 / 26,214,400 bytes (`PASS`).

The difference between 1,330 public files and 525 manifest delivery files is expected: the manifest counts checksum-deduplicated delivery assets referenced by the full supplier records, while `public/catalog` also contains legacy thumbnails/variants and duplicate stable paths.

## Determinism and validation

The offline pipeline was run twice after generation. The second run reported:

- all three supplier manifests `changed: false`;
- capacity summary `summaryChanged: false`;
- stable checksums:
  - An Cường: `f71855e36f99be57fb0734a74c2aad03c3378985e36a5e2b0fea215f295f7013`;
  - Ba Thành: `7e48ef6ba83f1f047eff6241325d7343458f92c1b442979f70a0f61f02e99414`;
  - Thanh Thuỳ: `92035ceae4a4d59aa32fb6aa074a013bbca6672b19be29ba9788a3fbaf1069dc`;
  - capacity summary: `22448b5b96c28569c222f665b14d0bf20ebd8520fab398a9ae05e3138b589bd0`.

Final validation results before commit:

- focused media/import tests: 3 files, 22 tests passed;
- full supplier test selection: 37 files, 246 tests passed;
- `catalog:suppliers:media:validate`: all three manifest checksums and local delivery files passed;
- final `catalog:suppliers:media:offline`: all manifests `changed: false`, summary `summaryChanged: false`;
- full ESLint: passed with zero warnings;
- full TypeScript checks (application and Cloudflare config): passed;
- image validator: passed 1,387 images; existing non-blocking legacy/source warnings remain outside Task 3.

## Concerns

- 529 origins remain rate-limited and 3,723 remain offline-unknown; this is explicit inventory, not media completeness.
- An Cường has no new local preview files in this task because broad live retry/download would violate the safety convergence.
- Full supplier originals are not downloaded and must not be described as complete.
- Existing Ba Thành/Thanh Thuỳ local files are transformed legacy delivery variants, not source-original bytes.
- Usage rights remain unconfirmed for every supplier asset.
