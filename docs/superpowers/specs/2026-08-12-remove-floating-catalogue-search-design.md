# Remove Floating Catalogue Search Design

## Goal

Keep the catalogue search controls in their original document position and stop creating a fixed replacement when the user scrolls on desktop or mobile.

## Scope

- Remove the `IntersectionObserver`-driven floating state from `SupplierCatalogSearch`.
- Remove the duplicate fixed search and filter controls.
- Keep the original search field, material selectors, supplier filter, URL synchronization, exact-code navigation, and results unchanged.
- Remove CSS that exists only to position the floating controls.

## Behavior

The catalogue page renders one search interface. Scrolling never hides, disables, duplicates, or relocates it. Users can scroll back to the original controls and continue with the same query and filters.

## Verification

- A browser regression test scrolls past the search section and confirms there is still exactly one catalogue search box and the original control is not inert.
- Catalogue unit tests, lint, typecheck, and production build must pass.
- Production is checked at `https://mdftungphat.com/catalogue/` on desktop and mobile, including console and failed network requests.
