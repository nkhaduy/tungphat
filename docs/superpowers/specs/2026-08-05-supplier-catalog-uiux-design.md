# Supplier Catalogue UI/UX Design

## Outcome

Make the three-supplier catalogue understandable and usable within seconds for a homeowner, carpenter, interior designer, code-aware customer, An Cuong visitor, and mobile user. The experience must help them identify a supplier and code, understand the difference between surface decor and board core, then contact Tùng Phát with enough context for stock, specification, and fabrication guidance.

## Experience model

The catalogue uses a task-first hierarchy:

1. Search a known code or supplier.
2. Choose a supplier and understand its available data.
3. Scan category/card results with supplier and code always visible as text.
4. Inspect a detail page with code-copy and inquiry actions near the identity block.
5. Continue to material, fabrication, contact, and location information.

“Products” remains the route for material types such as MDF and moisture-resistant MDF. “Catalogue nha cung cap” becomes the clear route for supplier codes and sample data. URLs and SEO ownership remain unchanged.

## Catalogue hub

The hero is shortened, especially on mobile. It describes the customer task, not internal data architecture. Immediately after the hero, three supplier cards state:

- Thanh Thuy: product/series catalogue with 348 records.
- Ba Thanh: Melamine color codes with 233 records.
- An Cuong: seven exported reference samples; broader catalogue advice is available by inquiry.

Search remains server-fed but client-filtered because 588 lightweight entries are already performant. The initial result wall is removed. Results appear only after query/filter intent, are capped for scanability, and expose supplier, type, code, name, category, and a clear link target.

## Search behavior

Search normalization continues to ignore case, accents, spaces, and hyphens. URL parameters `q`, `supplier`, and `category` are the source of restorable state. Exact-code matching remains highest priority.

- Enter opens the first result only when the query is a normalized exact code match.
- Escape clears query and result intent without trapping focus.
- Back/forward restores query and filters through URL state.
- Empty state suggests removing spaces or choosing another material group.
- Category labels are humanized for display while raw values remain stable for filtering.

## Supplier pages and cards

All supplier cards contain a textual supplier label. White or visually sparse swatches receive metadata framing so they do not resemble missing media. Hover treatment is supplementary; focus and tap states carry the same information.

Thanh Thuy moves code search ahead of category browsing and reinforces that the selected decor code is separate from the board core. Ba Thanh places code identity, copy, Zalo, and stock-check language near the top. Noindex detail pages retain the same customer experience as indexable pages.

An Cuong is a dedicated text-first catalogue sample page using exactly the seven exported records. It explicitly says the on-site data is a limited reference set and offers a supplier-level inquiry. It does not expose the internal legal/media blocker or publish blocked source images.

## Conversion and trust

One inquiry builder creates short, URL-encoded Zalo text:

- With code: `Tôi cần kiểm tra mã [MÃ] của [THƯƠNG HIỆU] tại Tùng Phát. Vui lòng tư vấn loại ván, quy cách, tình trạng hàng và dịch vụ gia công phù hợp.`
- Without code: `Tôi cần tư vấn catalogue [THƯƠNG HIỆU] tại Tùng Phát.`

CTA hierarchy is: contextual stock/code inquiry, Zalo quote, phone, then location/services. Every availability statement asks customers to confirm current stock. No price, review, exclusive-dealer, or guaranteed-stock claim is introduced.

## Accessibility and responsive rules

- Touch targets are at least 44 by 44 CSS pixels.
- Search/filter controls retain visible labels or accessible names.
- Copy feedback uses a polite live region and includes the code.
- Focus rings remain visible; menu state uses `aria-expanded` and `aria-controls`.
- Opening the mobile menu prevents background scrolling and closing restores it.
- Layout supports 200% zoom, reduced motion, rotation, and the requested viewport matrix without horizontal overflow.
- Mobile pages prioritize identity, search, and primary actions before long explanations.

## Visual system

Keep the established light corporate system: forest green for identity, warm orange for the primary conversion accent, white/warm neutral surfaces, Montserrat-based typography, restrained borders, and square-to-small-radius controls already used in the site. Supplier differentiation uses names, small logos, and metadata rather than full-page color themes.

The external design-system reference recommended a corporate gateway pattern, high-contrast light surfaces, and orange conversion accents. Oversized editorial typography is intentionally rejected because it would worsen mobile catalogue discovery and conflict with the existing Tùng Phát system.

## Performance and data boundaries

No new UI dependency is added. Search uses deferred input and memoized local ranking over the existing compact index. Initial cards are reduced rather than virtualized because the visible result cap is small. Existing responsive images, lazy loading, SEO metadata, sitemap, JSON-LD, import pipeline, and supplier adapters remain intact.

## Test strategy

Unit tests cover route mapping, search normalization/exact matching, humanized labels, message encoding, and An Cuong sample use. Playwright covers homepage discovery, exact-code keyboard search, state restoration, supplier distinction, filter, copy feedback, Zalo URL, mobile menu, breadcrumbs, noindex usability, An Cuong usability, keyboard navigation, zoom, reduced motion, no-JavaScript fallback, and representative error routes.
