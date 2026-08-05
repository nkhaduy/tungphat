# An Cuong Full-Crawl Storage Estimate

Measured on 2026-08-05 before the full detail crawl. This is a planning gate, not a guarantee of final media size.

## Current filesystem

- Filesystem size: 239,362,496 KiB (228.27 GiB)
- Currently available: 19,714,896 KiB (18.80 GiB)
- Current filesystem availability: about 8.2%
- Required 20% free reserve: 45.65 GiB
- Required absolute reserve: 10 GiB
- Effective reserve: 45.65 GiB (the larger threshold)
- Existing An Cuong import directory: 28 MiB
- Existing An Cuong media directory: 25 MiB

The filesystem is already below the required 20% free-space threshold before any full media download. At least 26.85 GiB of additional free capacity is needed merely to restore the reserve with no further media downloaded.

## Sample evidence

- Products: 7
- Media references: 20
- Manifest statuses: 10 downloaded and 10 duplicate
- Downloaded-owner bytes reported by the sample manifest: 41,928,893 bytes (39.99 MiB)
- Mean reported bytes per downloaded owner: 4,192,889 bytes (4.00 MiB)
- Mean reported bytes per sampled product: 5,989,842 bytes (5.71 MiB)
- Checksum duplicate rate by manifest status: 50%
- Unique source URLs observed: 13
- Unique SHA-256 values/files currently present: 13

The difference between 10 `downloaded` statuses and 13 physical checksum files comes from resumable sample history: some records currently marked `duplicate` point to checksum owners already present from an earlier manifest state. Full discovery must therefore recompute owner/reference accounting instead of assuming either number is final.

## Full-catalogue estimates

For 2,682 products:

| Scenario | Basis | Estimated additional binary storage |
| --- | --- | ---: |
| Low | Extrapolate the current 13-file physical sample footprint | 10.19 GB (9.49 GiB) |
| Middle | Extrapolate the manifest's 41,928,893 downloaded-owner bytes per seven products | 16.06 GB (14.96 GiB) |
| Conservative | Assume all 20 sample references require a unique file at the sample owner mean | 32.13 GB (29.92 GiB) |

These estimates are uncertain because media count, image resolution, category mix, shared assets, and source compression vary across the catalogue. They must be replaced by URL-level estimates after full media discovery.

## Safety decision

**Full binary media download: NOT PERMITTED on the current filesystem state.**

The crawler may complete full metadata/detail crawling and media URL discovery/manifest generation. It must not start the full binary download while current capacity remains below the effective reserve.

Additional free capacity required before download, including the 20% post-download reserve:

- Low scenario: 36.34 GiB
- Middle scenario: 41.81 GiB
- Conservative scenario: 56.77 GiB

The existing sample files may remain in the ignored media directory. No personal files or repository data will be deleted to create space. Final reports must state `mediaComplete: false` unless a later storage measurement passes this gate and all discovered media reach a terminal status.

## Post-discovery revision

Full detail parsing discovered 7,267 product media references and 4,584 unique URLs. Applying the sample size evidence to the URL-level inventory gives:

- Low: 9.38 GB (8.73 GiB).
- Middle: 19.22 GB (17.90 GiB).
- Conservative: 30.47 GB (28.38 GiB).

The post-discovery filesystem measurement reported 20.61 GiB available, still below the 45.65 GiB 20% reserve before downloading anything. Approximate additional free capacity required while retaining the reserve is 33.77 GiB (low), 42.94 GiB (middle), or 53.42 GiB (conservative). The no-download decision remains unchanged.
