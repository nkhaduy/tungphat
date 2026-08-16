# Supplier Media Sync Design

## Goal

Synchronize every product-associated image for An Cuong, Thanh Thuy, and Ba Thanh from official supplier sources to `tung-phat-media`, retain full-size originals, publish a debuggable manifest, and expose the complete gallery on `mdftungphat.com` without supplier hotlinks.

## Architecture

The existing supplier importers remain responsible for code discovery and product identity. A shared media layer resolves product-associated candidates from HTML, WordPress REST payloads, embedded JSON, JSON-LD, lightbox links, lazy-load attributes, and `srcset`; supplier adapters provide page discovery and association evidence. The shared layer classifies media, rejects covers/placeholders, selects the largest original candidate, hashes decoded downloads, deduplicates identical content, chooses a deterministic primary image, and records every decision in a machine-readable audit manifest.

Ba Thanh discovery gains a candidate URL resolver. Normalized codes produce standard and discovered WAY-family slugs, candidates are fetched, and a page is accepted only when canonical/body evidence matches the expected code. This recovers valid derived URLs even when index pages omit them.

Retained originals are uploaded under deterministic `supplier/<supplier>/<normalized-code>/<media-type>/<sha256>.<ext>` R2 keys. The CMS media route allows this prefix in addition to the existing video prefix, serves stored MIME and immutable caching, and never proxies supplier URLs. Existing R2 objects are reused by key/hash; changed low-resolution mappings are replaced in catalogue references without deleting old objects. Orphans are reported as cleanup candidates.

## Data Model

Each product audit record contains supplier, raw and normalized code, source page, page-found state, supplier media counts, reject counts and reasons, and final catalogue references. Each media record contains type (`texture`, `swatch`, `detail`, `board`, `edge`, `room`, `application`, or `other`), association evidence, source and selected original URLs, source/download dimensions and bytes, MIME, crop suspicion, checksum, R2 key/URL, upload state, and primary state.

The public catalogue record keeps lightweight card fields while retaining gallery items with `src` for the R2 original and an optional optimized `thumbnailSrc`. Primary ordering is texture/swatch, board/detail, then room/application. Content checksum, not URL alone, controls deduplication.

## Extraction And Rejection

Full-size selection priority is explicit gallery/lightbox href, CMS/API original fields, embedded gallery JSON, `data-full`/`data-large`/`data-original`/zoom attributes, largest valid `srcset`, lazy source, then `img.src`. WordPress generated-size and resize/crop URL patterns are marked suspect and replaced by an original when an accessible larger candidate exists.

An image is retained only when source structure or API relation associates it with the current product. Product galleries and application/inspiration sections attached to the product are valid even when filenames lack the code. Logos, banners, catalogue/collection covers, placeholders, decorative backgrounds, and unassociated marketing images are rejected with an explicit reason. Repeated content is a warning signal, not an automatic rejection when source association is explicit.

## UI

Cards load only the selected thumbnail/primary rendition. Activating the product image opens a client-side accessible lightbox that loads the current R2 original, preserves aspect ratio with `object-fit: contain`, provides previous/next controls, counter, Escape, arrow keys, close button, backdrop close, and touch-friendly controls. Adjacent originals are lazy-prefetched only after the lightbox opens.

## Validation And Delivery

Unit tests cover slug candidates and validation, all full-size resolution paths, room association, rejection, hash dedupe, ordering, R2 mapping, and hotlink prevention. Live migration validates HTTP status, MIME, decode, dimensions, bytes, checksum, and R2 HEAD/GET parity. The final gate is lint, typecheck, unit/crawler validation, build, E2E, commit/push, CMS deployment when the media route changes, Vercel production readiness, and direct desktop/mobile/network verification on `https://mdftungphat.com`.

