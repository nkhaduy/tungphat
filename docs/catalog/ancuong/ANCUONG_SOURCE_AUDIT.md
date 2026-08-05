# An Cuong Source Audit

Audit started: 2026-08-04 16:38:46 +07:00  
Source root: <https://ancuong.com/online-catalogue/catalogue-vat-lieu.html>

## Findings

- The catalogue root, category pages, and numeric product detail pages are server-rendered HTML. Product cards, filter values, lazy image URLs, product facts, product lines, dimension tables, and relationship tabs are present in the response body.
- No public product JSON API or product XHR/fetch feed was found in the audited `app.js` and `common.js` bundles. The observed XHR handlers are for forms such as login, contact, and subscription and are outside scope.
- Category listing pages use a single SSR response rather than client pagination or infinite scroll. The current 33 discovered category URLs yield 2,682 unique numeric product URLs.
- Product detail URLs follow `https://ancuong.com/<category-slug>/<numeric-id>.html`. Category URLs follow `https://ancuong.com/<category-slug>.html`. The numeric filename is the stable source ID.
- Product images are exposed through `products/products-full/...` and lazy-loaded application images under `https://acshopping.ancuong.com/Upload/MaterialApp/...`.
- Explicit same-colour data appears in the `product-map` tab. Product-line relations appear in the `product-line` tab. Application examples use `/album-product/<id>`. The crawler does not infer same-colour links from names.
- Browser automation is not required for the material dataset. It remains a discovery-only fallback if the SSR contract changes.

## Public Endpoints

| Purpose | Pattern or endpoint | Audit result |
| --- | --- | --- |
| Catalogue root | `/online-catalogue/catalogue-vat-lieu.html` | SSR category tree and Publitas links |
| Category listing | `/<category-slug>.html` | SSR cards and filter facets |
| Product detail | `/<category-slug>/<numeric-id>.html` | SSR facts, media, lines, relations |
| Product image | `/products/products-full/<filename>` | Direct image response |
| Application image | `https://acshopping.ancuong.com/Upload/MaterialApp/<filename>` | Direct image response |
| Robots | `/robots.txt` | Only `/webadmin/` disallowed during audit |
| Category sitemap | `/sitemap-category-product.xml` | 94 URLs |
| Product sitemap | `/sitemap-product.xml` | 5,864 Vietnamese and English URLs |
| Product-line sitemap | `/sitemap-product-line.xml` | 272 URLs |
| General category sitemap | `/sitemap-category.xml` | 100 URLs |
| Publitas pages | `https://catalogue.ancuong.com/<publication>/spreads.json` | Supporting visual catalogue evidence |
| Publitas hotspots | `https://catalogue.ancuong.com/<publication>/hotspots_data.json` | Present but not a complete product feed |

The audited Melamine Publitas publication contained 35 spreads and 69 page records. Publitas is not the primary feed because the An Cuong SSR pages expose stable product IDs and structured catalogue relationships.

## Retrieval Decision

1. Primary: conservative HTTP GET of SSR root, category, and detail HTML.
2. Supporting discovery: public XML sitemaps and Publitas JSON.
3. Fallback: parse embedded script data if the SSR markup stops carrying a required field.
4. Last resort: browser automation only for discovery, with analytics and unrelated resources blocked.

The client identifies itself as `TungPhat-AnCuong-Catalogue-Crawler/1.0 (+https://mdftungphat.com)`, uses a 25-second timeout, at most three retries, conditional-request headers, request pacing, and stops on 403/429 challenges.

## Scope And Restrictions

- Allowed: material root, discovered material categories, numeric product pages, explicit material relations, product media, public sitemaps, and supporting Publitas catalogue data.
- Excluded: news, knowledge, projects, recruitment, contact, showroom, policy, search, analytics, user content, and application catalogues not linked to material records.
- No CAPTCHA bypass, rotating proxy, device impersonation, cookie persistence, login, or browser-profile storage is implemented.
- Canonical tags are present in SSR pages and URL fragments/query strings are removed before identity comparison.

## Live Evidence

- Discovery: 33 categories, 2,682 product URLs, 0 duplicate URLs, 0 excluded URLs.
- Largest listing groups: Laminate 1,120; Melamine 367; Chỉ PVC 341; Sàn Gỗ 110; Acrylic 109; Veneer 108.
- Representative live product IDs: `303000054` Melamine, `303000332` Laminate, `303000667` Acrylic, `303001219` Chỉ ABS, `303016500` 3D Embossed.
- Sample detail crawl: 7 fetched and parsed products, 65 explicit relations, 20 media records.

## Limits And Risks

- A full 2,682-detail and all-media run was not executed in this review session; doing so is intentionally rate-limited and resumable.
- Empty discovered categories remain in the category export with `productCount: 0`; they are not silently removed.
- Product-line dimension tables can describe a line rather than every code. The parser keeps source warnings and does not promote those notes into guaranteed per-code facts.
- Source markup and catalogue counts can change without notice. Parser versioning, fixtures, hashes, validation, and live smoke tests are the change controls.

