# Catalogue Infinite Loading and Wrapped Filters

## Goal

Make supplier colour-code lists load the next local page automatically as the user approaches the end, with a visible loading transition, while ensuring filter controls wrap instead of scrolling horizontally.

## Scope

- `SupplierColorCodeSearch` and the legacy `ColorCodeSearch` list views.
- Supplier hub search/filter controls.
- Existing catalogue data, ordering, search ranking, and media remain unchanged.

## Behaviour

1. Render the first page using the existing page sizes.
2. Place a sentinel after the visible cards. When it is within roughly 700px of the viewport, load one page if more results remain.
3. Guard concurrent observer events and reset pagination when the query or material filter changes.
4. Show a compact three-card skeleton row while the local page is revealed. Keep the transition long enough to be perceivable, but do not add network work.
5. Expose an `aria-live="polite"` loading status and retain a manual "Tải thêm" fallback for keyboard users and browsers without `IntersectionObserver`.
6. Honour `prefers-reduced-motion` in the skeleton animation.
7. Replace horizontal filter overflow/snap styling with wrapping buttons. The filter group must not create horizontal page overflow on mobile.

## Non-goals

- No changes to catalogue records, supplier priority, image selection, media rights, or SEO index policy.
- No global scroll listener and no server-side pagination.

## Acceptance criteria

- Near-bottom scrolling automatically increases the visible card count by one page.
- Loading state is visible and accessible during each automatic load.
- No catalogue filter/search control requires horizontal scrolling at 390px viewport width.
- Existing exact-code search, supplier ordering, and route tests remain passing.
