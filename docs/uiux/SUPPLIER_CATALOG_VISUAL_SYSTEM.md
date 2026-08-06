# Supplier Catalogue Visual System

The catalogue extends the existing Tùng Phát interface instead of imitating a supplier site. The system stays bright, practical, corporate, and conversion-focused.

## Typography

- Use the existing display face for page and section headings; keep body and control typography aligned with the site-wide tokens.
- Product and color codes use strong weight and, where the existing component supports it, monospace treatment for quick comparison.
- Supplier, data type, and category metadata are secondary to the code/name but remain visible text; color alone never communicates supplier identity.
- Keep mobile headings compact enough that search or the main action remains visible early in the journey.

## Spacing and layout

- Continue using `container-shell` and the existing responsive spacing scale.
- Use 12-24 px internal spacing for search panels, cards, and identity blocks; reserve wider section spacing for page-level separation.
- Desktop result grids may expand to three or four columns. Mobile code grids use two columns only when the code and image remain legible without horizontal scrolling.
- Preserve image aspect ratios and reserved dimensions to prevent layout shift.

## Cards

- A result card shows supplier, data type, code, name, useful category/series context, and an obvious linked area.
- Supplier cards explain what data is available and give a task-oriented action such as “Xem bảng mã” or “Xem dữ liệu mẫu”.
- Missing approved media uses a text-first presentation, not a repeated broken-image placeholder.
- Hover elevation is supplementary; touch and keyboard users receive the same link target and a visible focus ring.

## Button hierarchy

- Primary: quote or stock-check actions, using the existing dark green treatment.
- Secondary: Zalo inquiry, copy code, supplier/category navigation, or service discovery.
- Tertiary: text links for breadcrumbs, related groups, and supporting routes.
- All interactive targets should be at least 44 px high where the layout permits, with visible hover, focus, active, and disabled states.

## Supplier labels

- Always write `Thanh Thuỳ`, `Ba Thanh`, or `An Cường` near codes and supplier-specific actions.
- Small logo or accent use is optional and secondary. Do not recolor the entire page per supplier.
- Use `Nhà cung cấp` in customer-facing catalogue metadata when the distinction from Tùng Phát matters; retain `Thương hiệu` only where it matches established site navigation.

## Search

- Default placeholder: `Tìm theo mã, tên sản phẩm hoặc thương hiệu`.
- Put search before supplier browsing on the central mobile hub.
- Exact normalized code queries may navigate on Enter only when one unambiguous result exists.
- Exact normalized supplier names show one supplier-hub result instead of a wall of records.
- Search and filters persist in the URL so back, forward, reload, and sharing retain context.
- Empty state suggests removing spaces or hyphens and offers a contact path without exposing implementation terminology.

## Filters

- Use human labels such as `Vân gỗ` and `Đơn sắc`; never expose raw slugs as visible copy.
- Supplier and category filters retain explicit labels for assistive technology.
- A fixed category remains visible but disabled, so the customer understands the active scope.
- Result counts use a polite live region and do not interrupt typing.

## Detail hierarchy

1. Supplier and data type.
2. Code/name.
3. Primary image or text-first sample identity.
4. Category and known specification.
5. Copy and contextual Zalo actions.
6. Material/color disclaimer and stock confirmation.
7. Quote, service, and related-record paths.

## Mobile rules

- Use one catalogue navigation group and lock document scrolling while the drawer is open.
- Escape closes the drawer and returns focus to its trigger.
- Avoid sticky actions that cover content or consume a large share of 360-390 px screens.
- Inputs and filters must not create horizontal scrolling after long or special-character queries.
- Preserve utility under reduced motion, rotation, and 200% zoom.

## CTA and disclaimer copy

- Code-specific Zalo: `Tôi cần kiểm tra mã [MÃ] của [NHÀ CUNG CẤP] tại Tùng Phát. Vui lòng tư vấn loại ván, quy cách, tình trạng hàng và dịch vụ gia công phù hợp.`
- Supplier-level Zalo: `Tôi cần tư vấn catalogue [NHÀ CUNG CẤP] tại Tùng Phát.`
- General catalogue Zalo: `Tôi cần tư vấn catalogue Thanh Thuỳ, Ba Thanh hoặc An Cường tại Tùng Phát.`
- State that screen colors are references and inventory/specification must be confirmed. Do not imply guaranteed stock, fixed pricing, reviews, or official distributor status.
