# An Cuong Data Dictionary

Schema version: `1.0.0`  
Parser version: `1.0.0`  
Machine schema: `schemas/ancuong-catalogue.schema.json`

## Identity

- `source`: fixed value `ancuong`.
- `brand` and `supplierSource`: factual source values `An Cường`; they do not assert dealership or authorization.
- `sourceUrl`: canonical numeric product URL.
- `sourceId`: numeric filename from the source URL when present.
- `productCode`: exact displayed code, including prefixes, spaces, dots, hyphens, and meaningful slashes.
- `normalizedProductCode`: NFKC, normalized dash characters, collapsed whitespace, and trim only.
- Deduplication priority: source ID, canonical URL, then normalized code plus category and source hash.

## Classification

- `category` and `categorySlug`: discovered source category name and stable URL slug.
- `productType`, `productLine`: source product type and first source product-line record when present.
- `sourceFacets`: original facet labels and values retained for audit and taxonomy separation.
- `materialPattern`, `woodPatternType`, `fabricPatternType`, `stonePatternType`, `otherPatternType`: mapped only from corresponding source facets.
- `colors`, `surfaces`, `surfaceEffects`, `specialFeatures`, `collections`, `solutions`, `edgeBandingTypes`, `profiles`: independent source facets; no semantic merging.
- `priceGroup`: exact source symbol such as `A`, `A1`, `H`, or `3D`; never interpreted as money or market tier.

## Dimensions

- `dimensions`: source-displayed dimensions.
- `thicknesses`: unique thickness values found in parsed product-line matrices.
- `dimensionThicknessMatrix`: meaningful dimension-to-thickness rows derived from source checkmarks; raw `o` markers and table HTML are not exported.
- `technicalWarnings`: source caveats such as dimensions varying by product code.

## Content Usage

- `sourceContent[].classification`: `FACTUAL_DATA`, `TECHNICAL_DATA`, or `SOURCE_MARKETING_COPY`.
- `sourceContent[].contentUsageStatus`: `technical-data`, `reference-only`, `requires-rewrite`, or `do-not-publish`.
- Source marketing prose remains reference material and is not copied into a public Tùng Phát description.
- The pipeline never generates dealership claims, prices, stock status, or public SEO copy.

## Media And Relations

- `primaryImage` and `gallery`: source URL plus optional local path, MIME, dimensions, byte count, SHA-256, filename, and alt source context.
- Relation types: `same-color`, `same-line`, `application`, `edge-band`, and `related`.
- Same-colour relations are emitted only from explicit source UI/metadata, never inferred from colour names.

## Change Control

- `sourceHash`: SHA-256 of the retrieved source response.
- `normalizedHash`: SHA-256 of normalized facts excluding volatile crawl timestamps and status.
- `discoveredAt`, `fetchedAt`, `sourceUpdatedAt`: source lifecycle timestamps.
- `status`: `active`, `changed`, `missing`, `invalid`, `duplicate`, or `source-unavailable`.
- `parserVersion`: parser contract version used to create the record.

