# Asset cleanup — 2026-10-31

No catalogue record, supplier relationship, wood code, article or remote media object was deleted. Full per-file classification and SHA-256 evidence are in [cloudflare-asset-classification.json](evidence/cloudflare-asset-classification.json).

## Inventory and decisions

The original public directory contained **107 files / 44,301,122 bytes**. Every source asset is classified: 65 KEEP, 23 OPTIMIZE, 5 DELETE, 16 REVIEW (109 entries including two added responsive variants and five deleted entries). Dynamic JSON references, filename-based references, supplier manifests, source media paths and export artifacts were inspected. Lack of a React import was never used as deletion evidence.

KEEP covers catalogue search indexes, icons/fonts, business images, metadata/OG assets and referenced media. OPTIMIZE retains source images with modern siblings; existing export cleanup omits an original only when generated HTML/JS/CSS/JSON no longer references it. REVIEW assets remain in Git: historical hero variants/public consumers cannot be disproved safely.

## Executed cleanup

Five avatar binaries were byte-identical and were removed. The review snapshot now references the retained copy; its refresh script preserves cached local avatar URLs. Permanent Pages redirects preserve the five old public URLs.

| Deleted avatar | Retained avatar | Bytes removed |
| --- | --- | ---: |
| 264028631.png | 264028607.png | 14,880 |
| 264028632.png | 264028608.png | 27,438 |
| 264028636.png | 264028613.png | 33,633 |
| 264028637.png | 264028614.png | 23,516 |
| 264028639.png | 264028612.png | 7,430 |

Total duplicate binary savings: **106,897 bytes**. Git tag `migration/pre-cloudflare-exit-20261031` recovers every removed source file.

The mobile hero previously requested a **1,385,310-byte PNG**. Same composition/resolution now has a **195,980-byte WebP** and a **768px / 86,294-byte** variant. The original PNG remains in Git; its old URL permanently redirects to the full WebP. The PNG is omitted from the deploy artifact after references are updated. The mobile browser regression verifies selected format, natural width and a <200k byte payload.

At 768px the image payload drops **1,299,016 bytes (93.8%)**. At full size it drops **1,189,330 bytes (85.9%)**. This is an exact resource-byte comparison, not a claim about field LCP. Full-resolution decoded 8-bit channel mean absolute error is 0.885/255; RMSE 1.410/255; mean channel shifts are -0.003, +0.064, -0.057. No catalogue swatch was recompressed.

After adding the two variants and removing duplicates, source public assets are **104 files / 44,476,921 bytes**: source storage grows **175,799 bytes**, because original design sources are intentionally preserved. The deploy artifact is the relevant delivery saving; complete before/after artifact measurements are recorded in the migration report. JS/CSS changes from patching Next must be reported separately rather than credited to image cleanup.

## Remote media and broken-reference repair

Read-only R2 inventory found **11,223 objects / 10,374,930,514 bytes**. The largest original is **30,337,989 bytes**. Many supplier originals are referenced by provenance records, even when optimized derivatives serve the page. They are KEEP/REVIEW, not deletion candidates. At this storage level R2 is above its 10 GB included allowance; no paid service was enabled and no remote object was deleted.

The full baseline crawl found one missing optimized Ba Thanh image at `/catalog/ba-thanh/laminate/p-2052-g-swatch.webp`. The versioned catalogue manifest proves SHA-256 `9b4c4a34211a9cde65d9c89cfba770872612fc209b6e7abee9b79a17513b148e`, 7,894 bytes, is identical to the existing `f-0022-x-swatch.webp` object. That object was downloaded, hash-verified and restored at the missing key. Live CDN GET now verifies the expected hash. No substitute colour or newly inferred supplier association was introduced.

A full R2 download backup verified all 11,223 inventory objects against size and ETag, with zero failures; the restored swatch was added separately, making 11,224 backup files. Backup results and locations are recorded in the migration report; raw backup data remains ignored by Git. No deletion or mass synchronization command was used as a test.
