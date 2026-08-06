# An Cuong Full Validation Report

- Products: 2,682.
- Categories: 33 (22 with listings, 11 currently/listing empty).
- Facets: 16 with 222 distinct source values.
- Relations: 26,158.
- Media references: 7,267.
- Errors: 0.
- Warnings: 178.
- Result: passed.

All 178 warnings are source-declared same-colour targets outside the 2,682-product discovery. They are retained as factual unresolved relations. No duplicate product identity, duplicate relation, self-reference, invalid product URL, invalid media URL, HTML/script/form leakage, contact/footer leakage, secret-like field, or checksum-format error remains.

Product identity checks found 2,682 unique source IDs and canonical source URLs, zero URL-to-source-ID conflicts, and zero products without category. One source-level normalized product-code collision is retained and documented: `ACRYLIC PARC 100` is declared by source IDs `303004309` and `303004324`, both in Acrylic with distinct canonical URLs. The normalized taxonomy retains all 11 empty navigation categories and records unknown counts per facet without inventing values.

Binary media integrity checks cover the existing sample only. Full media is discovery-only, so absence of binary checksums is represented by `mediaComplete: false`, not reported as full media validation.
