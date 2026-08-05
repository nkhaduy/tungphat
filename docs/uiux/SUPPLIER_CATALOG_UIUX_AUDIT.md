# Supplier Catalogue UI/UX Audit

Date: 2026-08-05  
Branch: `codex/catalog-suppliers-uiux-review`  
Base commit: `ca939b0dcfe5abb7e3361c6370b64531e66f8e9a`

## Scope and method

The audit follows six customer personas through the homepage, catalogue hub, supplier hubs, category pages, detail pages, search, filters, contact paths, mobile navigation, and related service pages. The local production export was operated through the Codex in-app browser at 1440x900, 1280x800, 768x1024, 390x844, 375x667, and 360x800.

Evidence is retained in `docs/uiux/catalogue/before/` and `docs/uiux/catalogue/after/`. Screenshots show representative states only; route behavior and keyboard interactions are verified separately in browser and automated tests.

## Findings

### CAT-UX-01 - Homepage supplier links lead to placeholder catalogue routes

- Severity: P1
- Route: `/`
- Device: Desktop and mobile
- Persona: A, D, E
- Observed problem: Thanh Thuy and Ba Thanh partner cards link to generic `/catalogue/<supplier>` placeholder pages instead of their live supplier catalogue routes.
- User impact: A customer can reasonably conclude that the catalogue is incomplete, then miss hundreds of available records.
- Evidence: `catalogue-hub-desktop.png` plus browser navigation from the homepage supplier cards.
- Fix: Map each supplier card to the canonical customer-facing catalogue route and include a visible supplier name/action label.
- Verification: Browser navigation and automated route assertions.

### CAT-UX-02 - Catalogue hub starts with an undifferentiated 48-card result wall

- Severity: P1
- Route: `/catalogue/`
- Device: All
- Persona: A, C, E
- Observed problem: The page immediately renders the first 48 of 588 entries without explaining which supplier offers which data or where a new customer should begin. Hero copy mentions internal concepts such as schema and URL separation.
- User impact: New customers must understand the data model before they can find a material or supplier.
- Evidence: `catalogue-hub-desktop.png`, `catalogue-hub-mobile.png`.
- Fix: Add three supplier entry cards, plain-language material guidance, and contact actions; keep results hidden until a query or filter is active.
- Verification: Desktop/mobile browser pass and catalogue journey tests.

### CAT-UX-03 - Search does not complete the expected keyboard journey

- Severity: P1
- Route: `/catalogue/`
- Device: Desktop and mobile keyboard
- Persona: B, C, F
- Observed problem: Exact-code ranking is correct, but Enter does not open the exact match, Escape does not clear search, and query/filter state is lost after returning from a detail page.
- User impact: A tradesperson who already knows `BT 111` must leave the keyboard and repeat work after inspecting a result.
- Evidence: `ba-thanh-search-result.png`, `mobile-search-filter.png` and browser interaction logs.
- Fix: Synchronize query and filters to the URL, implement Enter for a single exact match, implement Escape clear, and restore state through browser history.
- Verification: Playwright keyboard/back-forward tests at desktop and mobile viewports.

### CAT-UX-04 - Catalogue search is below too much mobile hero content

- Severity: P1
- Route: `/catalogue/`
- Device: 390x844, 375x667, 360x800
- Persona: B, F
- Observed problem: The hero consumes most of the first mobile viewport, placing the primary search near or below the fold and increasing keyboard overlap risk.
- User impact: Code lookup feels slower even though search data is already available.
- Evidence: `catalogue-hub-mobile.png`.
- Fix: Reduce mobile hero height and copy length; make search the first task-oriented control.
- Verification: Screenshots and real input interaction at all requested phone widths.

### CAT-UX-05 - Ba Thanh detail delays the two most important actions

- Severity: P1
- Route: `/ma-mau-melamine/ba-thanh/<code>/`
- Device: All, most visible on mobile
- Persona: B, C
- Observed problem: The page does not expose copy-code and contextual Zalo actions beside the code heading. Inquiry actions appear after long explanatory content.
- User impact: Customers can mistype a code or abandon before asking for a specification or quote.
- Evidence: `ba-thanh-code-detail.png`.
- Fix: Add a reusable code action group near the identity block, with copied state announced to assistive technology and a concise supplier-aware Zalo message.
- Verification: Copy clipboard assertion, live-region assertion, and encoded Zalo URL assertion.

### CAT-UX-06 - An Cuong appears broken rather than intentionally limited

- Severity: P1
- Route: `/catalogue/an-cuong/`
- Device: All
- Persona: E
- Observed problem: Four generic placeholder categories are shown even though the approved export contains seven sample records. Repeated “image updating” panels resemble failed media.
- User impact: Customers cannot distinguish a limited data sample from a broken import.
- Evidence: `an-cuong-page.png`.
- Fix: Render seven text-first sample cards from the exported catalogue, explain the current data scope, retain `noindex`, and provide catalogue-level inquiry actions without publishing blocked media.
- Verification: Record-count/content test, browser audit, robots metadata audit.

### CAT-UX-07 - Supplier and category labels are not consistently human-readable

- Severity: P2
- Route: `/catalogue/`, Thanh Thuy and Ba Thanh listing pages
- Device: All
- Persona: A, C, D
- Observed problem: Category filter values can expose slugs such as `van-go`; supplier identity is sometimes implied by route or color instead of repeated as text.
- User impact: Non-technical customers spend additional time decoding taxonomy and can mix codes between suppliers.
- Evidence: `mobile-search-filter.png`, `thanh-thuy-detail.png`.
- Fix: Humanize taxonomy labels and place supplier text in cards, breadcrumbs, and detail identity blocks.
- Verification: Screen-reader snapshot and visual card inspection.

### CAT-UX-08 - Inquiry messages are inconsistent and omit fabrication context

- Severity: P2
- Route: Thanh Thuy and Ba Thanh catalogue routes
- Device: All
- Persona: A, B, D
- Observed problem: Zalo messages use different structures and do not consistently ask for board type, dimensions, stock status, and suitable fabrication services.
- User impact: Sales receives incomplete inquiries and customers need an extra clarification round.
- Evidence: Browser inspection of CTA `href` values.
- Fix: Use one business-config-backed message builder for code and supplier-level inquiries.
- Verification: Unit tests assert decoded messages without sending any message.

### CAT-UX-09 - Navigation duplicates supplier concepts

- Severity: P2
- Route: Global header and mobile menu
- Device: All
- Persona: A, E, F
- Observed problem: “Catalogue” and “Thuong hieu” expose overlapping supplier destinations with little explanation.
- User impact: Customers cannot predict which menu contains the searchable code data.
- Evidence: `mobile-menu.png` and desktop navigation.
- Fix: Keep a single compact “Catalogue nha cung cap” path for supplier lookup while retaining product navigation for material types.
- Verification: Header keyboard/mobile journey tests and browser inspection.

### CAT-UX-10 - Several interaction labels and states are too generic

- Severity: P2
- Route: Ba Thanh cards and copy actions
- Device: All
- Persona: B, C, F
- Observed problem: Multiple controls share the accessible name “Copy ma”, and success feedback is not uniquely associated with a code.
- User impact: Screen-reader and voice-control users cannot reliably select the intended action.
- Evidence: Accessibility tree inspection on Ba Thanh grid.
- Fix: Include the code in each accessible name and announce “Da sao chep ma <code>”.
- Verification: Axe/Playwright accessible-name and live-region tests.

### CAT-UX-11 - Non-secure LAN preview can crash before rendering

- Severity: P0
- Route: All routes served over local HTTP LAN
- Device: In-app browser
- Persona: All
- Observed problem: Analytics called `crypto.randomUUID()` unconditionally; that API is unavailable in a non-secure browser context, causing a blank screen during the required local browser audit.
- User impact: The whole customer journey is blocked in affected contexts.
- Evidence: Browser console error `TypeError: crypto.randomUUID is not a function`.
- Fix: Generate UUID v4 identifiers using `crypto.getRandomValues()` when `randomUUID()` is unavailable, and use the same helper for event IDs.
- Verification: Regression unit test and a rendered LAN production build.

### CAT-UX-12 - Exact supplier searches still return a product result wall

- Severity: P2
- Route: `/catalogue/`
- Device: All
- Persona: A, C, E
- Observed problem: Queries such as `Thanh Thuy`, `Ba Thanh`, and `An Cuong` match the supplier name but still render up to 48 product or code cards.
- User impact: A customer looking for a supplier hub must distinguish the intended brand entry from records that happen to contain the same supplier metadata.
- Evidence: Browser search with `An Cuong` and `ba-thanh-search-result.png` as the comparable result layout.
- Fix: Detect an unambiguous normalized supplier-name match and show one prominent supplier-hub result. Accent-free and hyphenated input remains supported.
- Verification: Unit coverage for normalized supplier matching and Playwright assertions that exact supplier queries suppress product results.

### CAT-UX-13 - Ba Thanh query and filter state disappears on return

- Severity: P2
- Route: `/ma-mau-melamine/ba-thanh/`
- Device: Desktop and mobile
- Persona: B, C, F
- Observed problem: The Ba Thanh search and group filter are component-only state, so detail navigation, browser back, and reload can reset a carefully narrowed result set.
- User impact: A designer comparing several swatches must repeat the query and filter after each detail view.
- Evidence: Before/after browser history interaction and `mobile-search-filter.png`.
- Fix: Store `q` and `category` in the URL, preserve existing history state, and restore the controls on load and `popstate`.
- Verification: Playwright covers search, filter, detail navigation, back, and reload restoration.

### CAT-UX-14 - Legacy noindex supplier routes look disconnected from live data

- Severity: P2
- Route: `/catalogue/ba-thanh/`, `/catalogue/thanh-thuy/`
- Device: All
- Persona: D, E
- Observed problem: Older noindex catalogue routes use placeholder-style cards even though the live canonical supplier hubs already contain searchable data.
- User impact: Bookmarks and internal links can make a complete catalogue appear unfinished or unavailable.
- Evidence: Browser inspection of `/catalogue/ba-thanh/` before and after the handoff copy change.
- Fix: Keep the noindex policy and route, but present the live record count and a direct, clearly named link to the canonical catalogue.
- Verification: Metadata and Playwright assertions confirm `noindex`, the canonical handoff URL, and removal of stale “đang cập nhật/bổ sung” language.

## Priorities

- P0: 1 found, fixed first.
- P1: 6 findings covering discovery, first-use comprehension, mobile search, detail conversion, and An Cuong trust.
- P2: 7 findings covering taxonomy, navigation, supplier clarity, messages, state restoration, legacy-route handoff, and accessibility labels.
- P3: Visual polish will be recorded only where it improves scanability or consistency; no standalone decorative redesign is planned.

## Guardrails

- Keep all existing routes, sitemap rules, structured data, supplier adapters, and `noindex` policy.
- Do not publish or transform An Cuong media while usage rights remain unconfirmed.
- Do not imply official distributor status, guaranteed inventory, or fixed prices.
- Use the existing Tùng Phát palette, typography, components, and business configuration.
