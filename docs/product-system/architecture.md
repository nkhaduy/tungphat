# Material catalogue architecture and evidence

## Audit on 2026-11-03

Next.js 15 App Router, React 19, static export, Tailwind, existing Payload CMS build-time collections. No new dependencies. Existing six CMS products: van-mdf, mdf-chong-am, go-ghep-cao-su, go-ghep-tram, go-ghep (guide), van-go-cong-nghiep (guide). Homepage originally had 12 cards: MDF/HDF and Okal/MFC combined; plywood/mfc linked to broad guide; three image-less cards linked to Ba Thanh brand; surface cards linked straight to catalogue. The core registry also contained a general go-ghep guide (overlapping the specific rubberwood family), while tràm was only a child link and PVC Film/PET absent on homepage.

The reviewed registry contains 16 specific groups: 10 core/material groups, 5 surface groups and 1 accessory group. The two original broad guides remain reachable at their established URLs. No old URL is renamed and no redirect is needed.

## Ownership and synchronization

`lib/product-taxonomy.ts` is the small shared public catalogue registry. It drives homepage, product navigation, the existing material finder and material-related cards. `lib/product-editorial.ts` owns reviewed educational material copy. It enriches CMS products in `getProducts()` by slug and appends the twelve code-owned material-family guides. There is exactly one returned public entry per slug.

CMS remains authoritative for draft, noindex, discontinued/guide status, publication date and existing canonical. The four existing CMS-owned material slugs are explicit in lib/product-ownership.ts. If one disappears from the anonymous published collection, no local fallback is created. The build synchronization also writes content/categories/product-publication.json to hide absent CMS-owned and noindex materials throughout the shared discovery registry. A CMS draft or noindex record is not bypassed by publishing a second local entry. New twelve guides are code-owned until an explicit migration; a published CMS noindex/draft field still takes precedence when a record is present. Existing records outside these 16 material families are returned untouched. No CMS record or production media has been written or migrated. The previous CMS copy is still in Payload; the frontend intentionally uses the versioned reviewed catalogue text for these families. Editors must change that reviewed text here until the fields are explicitly migrated into Payload. This precedence is intentional, not an undocumented parallel catalogue.

The catalogue does not model stock or an individual SKU. All pages use CollectionPage + BreadcrumbList, following the repository's existing material-family schema policy. No Offer, price, rating or inventory assertion is generated. General material explanations do not establish a Tùng Phát-specific certification, origin, dimension or performance guarantee.

`app/[slug]/page.tsx`, `createContentMetadata`, `app/sitemap.ts` remain the route/metadata/sitemap entrypoints. ProductLanding dispatches the reviewed families to a reusable MaterialLanding; original broad guides and future unrelated CMS products retain their incumbent template.

## Media acceptance

The user explicitly authorized reuse of both sanpham-media originals and confirmed commercial rights for existing public/wood and supplier catalogue assets in this chat on 2026-11-03. This is recorded as user permission, not an independent CC license. Original MDF files are preserved. Render-like images, wrong materials, chemical samples, unrelated interiors and watermarked photographs are excluded even if technically reusable. Separate manifests record all source URLs, attribution and limitations.

Missing or insufficient material photography remains a release blocker, never a reason to substitute an unrelated board. A passing build only proves engineering checks; it does not prove image completeness.

## Review corrections

Verified code review findings fixed: anonymous CMS omission no longer republishes an existing material; catalogue actions use the parser-supported group parameter; knowledge.json reuses the same material-family classification as page schema. Original direct-answer SEO coverage is retained on the introduction, without duplicating explanatory text.

## Latest image-source constraint

User restricted all sourced material imagery to gothanhthuy.com and bathanhtaybac.com, preserving the two original user-supplied MDF references. `tests/product-media-policy.test.ts` and `scripts/product-media/check-readiness.mjs` enforce that constraint for main and supplementary images. Other domains remain permissible technical-reference sources because this restriction concerns images. The existing supplier colour-code catalogue remains unchanged. One missing source (tràm) means this task is not fully complete; a business-logo social preview is used on its existing content route instead of inventing a product photo.
