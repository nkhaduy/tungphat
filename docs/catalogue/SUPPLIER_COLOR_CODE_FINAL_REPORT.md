# Supplier Color Code Final Report

Audit date: 2026-08-08
Media rights: `UNCONFIRMED`.

## Public Model

| Metric | Count |
| --- | ---: |
| Previous searchable records | 3,558 |
| Verified color codes | 2,829 |
| Removed from public color index | 729 |
| Verified An Cường codes excluded by requested product scope | 549 |
| Product families removed | 153 |
| Documents removed | 26 |
| Duplicate source alias merged | 1 |
| Empty-code public records | 0 |

Supplier counts are 342 Thanh Thuỳ, 292 Ba Thanh, and 2,195 An Cường. Mixed public lists are grouped in that order; exact code matches still outrank partial matches. An Cường's public scope is Melamine, Laminate, Acrylic, Veneer, PPET/PVC, Mặt Top (Compact), Lõi Ván where a verified code exists, and Chỉ Dán Cạnh; Panel and Flooring remain raw-only. The public label is `Mã màu`; the hub H1 is `Mã màu vật liệu`; the search placeholder is `Tìm mã màu, tên màu hoặc thương hiệu`.

## Media Completeness

| Supplier | Verified codes | Source usable media | Local previews | Truly unavailable/invalid source media | Recovery rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| An Cường | 2,195 | 2,195 | 2,195 | 0 | 100% |
| Thanh Thuỳ | 342 | 342 | 342 | 0 | 100% |
| Ba Thanh | 292 | 269 | 269 | 23 | 100% of usable source media |

The 23 Ba Thanh exceptions have explicit audited reason codes and no image element. All other public cards use local media; no hotlink, AI image, inferred color, or source color adjustment is used.

## Search and Routes

Exact code forms verified include `MS465SC04`, `MS 465 SC04`, `MFC MS 465 SC04`, `BT99`, `BT 99`, `SC016M`, and `SC 016M`. Generated detail routes come only from canonical verified color-code records. Sitemap detail inclusion is limited to `READY_TO_INDEX`; `NOINDEX_USEFUL` and `NEEDS_ENRICHMENT` pages remain public but noindex.

## Validation Snapshot

- Lint: pass.
- Typecheck: pass.
- Vitest: 465 tests pass across 73 files.
- An Cường media validator: 0 issues.
- Ba Thanh media validator: 0 issues.
- Production compile/export: 3,503 static pages; 13,696 files; 2,017,559,887 bytes; largest file 16,435,124 bytes; Cloudflare file-count and max-file gates pass.
- Playwright: 52/52 pass on an isolated preview server with migrated D1 state.
- Internal links: 3,492 HTML files, 92,865 links, 0 redirects, 0 HTTP errors, 0 missing trailing slash.
- Sitemap: 43 valid URLs; metadata: 12 canonical/og/robots/sitemap routes pass.
- JSON-LD: 3,490 routes, 6,985 blocks, 48,980 schema nodes, 0 parse errors, 0 canonical mismatches, 0 URL errors.
- Lighthouse desktop `/catalogue/`: Accessibility 100, Best Practices 100, SEO 100. One non-scoring advisory remains for missing first-party source maps.
- Media rights remain `UNCONFIRMED`; no production deploy or main merge was performed.
