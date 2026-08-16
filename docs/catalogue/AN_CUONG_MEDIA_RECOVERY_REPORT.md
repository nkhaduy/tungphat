# An Cường Media Recovery Report

Audit date: 2026-08-07
Media rights: `UNCONFIRMED`.

## Root Cause

The previous public gap came from treating 7,266 provenance assets as source-only/deferred without rebuilding color-code media from the product-detail lazy image and fullsheet endpoints. Official pages expose thumbnails under `products-thumb`, fullsheets under `products-full`, plus application galleries and same-color relations.

The revised discovery pipeline accounts for lazy media, fullsheet URLs, explicit same-color provenance, local checksum reuse, MIME/dimension validation, and semantic filenames.

| Metric | Count |
| --- | ---: |
| Verified color codes in approved public scope | 2,195 |
| Source exposes usable media | 2,195 |
| Local previews | 2,195 |
| Unique local WebP files after checksum accounting | 5,251 |
| Swatches | 2,195 |
| Fullsheets | 2,195 |
| Application image assets | 1,432 across 1,431 codes |
| Source truly missing media | 0 |
| Parser-missed matching-code media recovered | 63 |
| Lazy/source media accounted | 2,195 |
| Download failures | 0 |
| Validation issues | 0 |
| Media recovery rate | 100% |
| Broken public images | 0 in media validator |

Files are content-addressed/checksummed, downloaded only from allowlisted supplier media domains, validated as actual images, and stored without AI generation, inferred color, color adjustment, cropping, or upscaling.

Public derivatives occupy 1,431,342,170 bytes. Fullsheet derivatives preserve aspect ratio and ICC metadata, use a maximum 1,600-pixel bounding box without cropping or upscaling, and retain the full-resolution supplier URL in provenance.
