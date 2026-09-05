# Public SEO and UX Hierarchy Refinement Design

## Context

The public Tùng Phát site already has a healthy static SEO baseline: 2,652 sitemap URLs, 2,652 indexable sitemap pages, unique titles, self canonicals, valid structured data, and the exact catalogue-code landing architecture. The remaining issue is comprehension: the homepage repeats material, specification, gỗ ghép, catalogue, workshop, branch, and CTA intent across too many sections, while the global navigation treats core materials and supplier catalogue lookup as peers.

The Thanh Thùy benchmark shows useful information architecture patterns, but its commercial claims, wording, design, product properties, and schema cannot be transferred to Tùng Phát.

## Decisions

### Benchmark pattern matrix

| Pattern | Decision | Tùng Phát application |
| --- | --- | --- |
| Exact category name with a short H1 | Adopt | Keep material/surface H1s direct and specific. |
| SEO-rich title with a simple H1 | Adapt | Improve only homepage metadata where broad intent is supported; preserve healthy page-specific titles. |
| Code-first detail naming | Adopt | Preserve exact-code title/H1 and route behavior. |
| Query-shaped article title | Adopt | Preserve existing knowledge titles; no new articles in this change. |
| Dedicated catalogue/search hierarchy | Adopt | Make `/catalogue/` and supplier hubs prominent in navigation and homepage. |
| Separate core material and surface navigation | Adapt | Present MDF/MFC/Plywood/gỗ ghép as materials; present Melamine/Laminate/Acrylic/Veneer/PVC as catalogue surfaces. |
| Claim-led homepage proof blocks | Reject | Remove generic, evidence-free trust cards. |
| Large mega-menu | Reject | Use two small desktop menus and grouped mobile links. |
| Product/Offer/Rating schema without verified commercial data | Reject | Keep BreadcrumbList and existing non-product schema only. |

### Homepage structure

The homepage will use this order:

1. Hero with one clear entity H1 and verified business wording.
2. Core materials: MDF, MDF chống ẩm, MFC & Plywood, gỗ ghép.
3. Surface and code lookup: catalogue search plus supplier hubs.
4. Cutting and CNC: real capability descriptions, one workshop proof image, and one Zalo action.
5. Branches: verified NAP, phone, detail page, and Maps links.
6. Compact knowledge links.
7. One final Zalo CTA.

The generic proof-card block, duplicate specification cards, duplicate workshop gallery, and embedded Maps/Facebook footer widgets are removed or merged. Branches remain because they are verified local-entity information.

### Navigation

Desktop and mobile expose the same intent model:

- Vật liệu: MDF, MDF chống ẩm, MFC & Plywood, gỗ ghép, all materials.
- Mã màu / Catalogue: search, Thanh Thuỳ, Ba Thanh, An Cường.
- Cắt & CNC.
- Xưởng & chi nhánh.
- Kiến thức.
- Liên hệ.

Catalogue links keep prefetch disabled so the large catalogue payload is not loaded before user intent.

### Brand and catalogue contradiction

Brand presentation pages must derive catalogue availability from the verified supplier search index. They must not display an empty catalogue/product state for An Cường, Thanh Thuỳ, or Ba Thanh when catalogue records exist. This does not assert dealership, distribution, stock, price, or supplier relationship.

### SEO invariants

- Keep the 2,652 sitemap URL count unless data changes legitimately.
- Keep 2,601 Tier A indexable catalogue detail routes and existing noindex tiers.
- Keep exact-code canonical, robots, sitemap membership, and internal discovery.
- Keep `/catalogue/thanh-thuy/melamine/301/` indexable with a self canonical.
- Do not add Product, Offer, AggregateRating, Review, price, availability, or rating data that Tùng Phát cannot verify.
- Preserve URL paths; renaming the dynamic parameter files is URL-neutral.

### CTA vocabulary

Use action labels that match destinations: `Xem vật liệu`, `Mở catalogue`, `Gửi quy cách qua Zalo`, `Gọi Tùng Phát`, and `Mở Maps`.

## Verification

The implementation must pass unit tests, lint, typecheck, build, static SEO audit, production audit, media audit, legacy redirect validation, a full sitemap metadata matrix, browser QA at 1440/1280/430/390, representative raw Googlebot HTML checks, and production-flow checks for materials, catalogue code, CNC, branches, phone, and Zalo.
