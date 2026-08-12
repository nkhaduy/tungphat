# Material Catalogue Redesign Design

## Goal

Redesign `/catalogue/` as a premium interior-material library that makes real
color-code lookup the dominant task while preserving the existing catalogue
data, ranking, filter behavior, URLs, indexing foundation, and static fallback.

## Visual Direction

Use the existing Tùng Phát palette and Montserrat typography. The page should
feel editorial and material-led: deep forest green, restrained burnt-orange
accents, warm off-white surfaces, fine borders, subtle elevation, 8–12 px
radii, and generous but efficient whitespace. Avoid glass effects, heavy
gradients, decorative motion, new font downloads, and generic dashboard UI.

The global 1240 px container already matches the requested desktop target and
will be retained. The catalogue hero may use a quiet CSS-only panel motif to
suggest stacked material sheets without adding an LCP asset.

## Information Architecture

Keep the page order as breadcrumb, compact hero introduction, primary search,
material filters, supplier select and helper note, results summary, material
grid, progressive load-more, then the existing supplier/education/contact SEO
content. Search belongs visually to the hero while results continue directly
below without a marketing interruption.

## Search And Filters

Preserve the current `useDeferredValue` search, exact-code Enter navigation,
Escape clearing, URL state, ranking, supplier directory mode, and robots rules.
Change the accessible label and placeholder to “Nhập mã màu, tên màu hoặc
thương hiệu...”. Give the search control a persistent visible label, search
icon, 60–64 px height, strong focus ring, and warm surface.

Render taxonomy choices as rounded chips with a forest selected state. Split
the item count into secondary text so it does not compete with the category
name. Keep the native supplier select, add a visible label and chevron styling,
and place the ranking explanation in a subdued info note.

## Results And Cards

When the full list or a filtered list is shown, use the eyebrow “Kết quả phù
hợp” and a locale-formatted dynamic count followed by “mã màu”. Retain the
featured fallback wording only for the existing non-result state.

Cards retain their canonical links, data formatting, missing-image state,
copy action, and detail navigation. Increase the visual prominence of swatches
with a taller near-square/4:3 image area, use four columns on desktop, two on
tablet and compact mobile, and one column on narrow mobile. Card content uses
supplier, title, taxonomy, then a fixed action row. “Sao chép mã” remains
secondary and “Chi tiết” remains primary. Hover only lifts by a few pixels on
fine pointers; focus and reduced-motion states remain explicit.

Copy feedback must announce success and failure through a polite live region.
Success uses a check icon; failure uses a clear text recovery message. The
toast reserves no page space and must not shift the grid.

## Performance And SEO

Keep server-rendered page copy, supplier links, metadata, canonical, static
routes, breadcrumbs, and the no-JavaScript supplier directory. Keep 48 results
per batch and `IntersectionObserver` progressive loading; do not render all
2,829 cards. Continue using `next/image`, declared aspect ratios, responsive
`sizes`, lazy loading below the fold, and the existing deferred query.

Use CSS-only visual decoration and existing dependencies. Apply
`content-visibility: auto` with intrinsic size to below-fold cards only if it
does not affect tests or accessibility.

## Responsive And Accessibility

Validate 1440×900, 1280×800, 768×1024, and 390×844 in a real browser. All
controls must be semantic, keyboard operable, at least 44 px tall, and expose
visible focus. Chips wrap without horizontal scrolling. Mobile uses one column
at the narrowest widths and two columns only when card image/text/actions stay
legible. Long titles wrap or clamp without overflowing.

## Test Strategy

Extend the existing supplier catalogue E2E tests first to assert the new
search accessible name, result heading semantics, chip count hierarchy, copy
feedback, empty state, filtering, and mobile overflow. Run the full lint,
typecheck, Vitest, build, link validation, and Playwright gates. After deploy,
hard-refresh production and repeat search, category filter, supplier filter,
copy, detail navigation, responsive screenshots, console inspection, and
failed-network inspection.
