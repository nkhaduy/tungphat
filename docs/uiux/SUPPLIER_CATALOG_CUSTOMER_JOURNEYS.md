# Supplier Catalogue Customer Journeys

Date: 2026-08-05

Branch: `codex/catalog-suppliers-uiux-review`

Base commit: `ca939b0dcfe5abb7e3361c6370b64531e66f8e9a`

## Persona A - Homeowner choosing a bright, moisture-resistant kitchen finish

- Goal: Find a light surface, understand the difference between decor and board core, ask whether moisture-resistant MDF is suitable, and locate a branch.
- Entry point: Homepage, then the supplier catalogue navigation.
- Steps: Open catalogue; read the surface/core explanation; browse Thanh Thuỳ or Ba Thanh; open a code; follow MDF chống ẩm and contact paths; send the code through Zalo.
- Original friction: Homepage partner cards could open placeholder routes, the hub started with 48 unexplained records, and surface colors were not clearly separated from the board core.
- Fix: Canonical supplier links, search-first hub, supplier summaries, plain-language material guidance, stock-confirmation copy, and phone/Zalo/location paths.
- Result after fix: The customer can begin by supplier or code and is told that the visual finish and the moisture-resistant core are separate choices that Tùng Phát must confirm.

## Persona B - Carpenter looking up BT 111

- Goal: Resolve `BT111`, `BT 111`, or `bt-111`, verify the supplier, copy the exact code, and ask about dimensions and edge-banding/cutting.
- Entry point: `/catalogue/` or the Ba Thanh code table.
- Steps: Enter the code; open the exact result; copy `BT 111`; inspect the group and image; use the contextual Zalo action; continue to fabrication services or the quote form.
- Original friction: Enter and Escape did not complete the keyboard flow, code actions were delayed, copy labels were duplicated, and returning from details lost the Ba Thanh query/filter.
- Fix: Normalized exact-code matching, safe ambiguity handling, Enter/Escape behavior, URL-backed state, unique accessible copy labels, live confirmation, and a concise supplier-aware Zalo message.
- Result after fix: A unique Ba Thanh match opens directly, preserves its lookup context on return, and sends the exact code and supplier without implying stock.

## Persona C - Interior designer comparing a group of swatches

- Goal: Scan many codes in one group, retain filters while opening details, and avoid mixing suppliers.
- Entry point: Ba Thanh vân gỗ/đơn sắc or a Thanh Thuỳ category.
- Steps: Select a group; scan the grid; open a detail; use breadcrumb/back; return to the same query/filter; repeat with related records.
- Original friction: Supplier identity was sometimes implicit, slugs appeared as labels, generic copy buttons were hard to distinguish, and component-only filters reset.
- Fix: Visible supplier text, human-readable taxonomy, consistent card metadata, unique copy names, related-item context, and URL-restored filters.
- Result after fix: Codes remain easy to scan at desktop and mobile widths, and browser back/reload returns to the narrowed Ba Thanh set.

## Persona D - Customer with a Thanh Thuỳ code or series

- Goal: Confirm that Tùng Phát can source or advise on the material, then request a quote or CNC support.
- Entry point: Homepage supplier card, central search, or `/thuong-hieu/thanh-thuy/`.
- Steps: Search a code or series; open the category/product; confirm supplier and code; copy/send the code; review the color and stock disclaimer; open a fabrication or contact route.
- Original friction: Product identity and inquiry actions were less prominent than catalogue description, and old `/catalogue/thanh-thuy/` bookmarks appeared disconnected from live data.
- Fix: Clear supplier identity, code actions near the heading, useful fallback product copy, canonical handoff from the noindex legacy route, and consistent inquiry wording.
- Result after fix: Indexable and noindex product pages remain useful customer pages while clearly requiring stock, specification, and sample confirmation.

## Persona E - Customer seeking An Cường

- Goal: Understand what Tùng Phát currently exposes, inspect representative records, and ask for a broader catalogue or quote.
- Entry point: Menu, homepage supplier card, or exact supplier search.
- Steps: Search `An Cuong` or `An Cường`; open the supplier page; review seven sample items and scope; use a catalogue-level inquiry action.
- Original friction: Exact supplier search produced a result wall, four placeholder cards looked like missing data, and “image updating” panels resembled broken media.
- Fix: One exact supplier result, seven text-first exported samples, explicit scope/status copy, retained `noindex`, and no publication of rights-blocked media.
- Result after fix: The page reads as an intentionally limited, usable sample rather than a failed catalogue import.

## Persona F - Mobile customer on a medium connection

- Goal: Open navigation, search/filter, copy/send a code, return to results, and find phone or branch details without layout obstruction.
- Entry point: Homepage at 390x844, 375x667, or 360x800.
- Steps: Open the mobile menu; select catalogue; use the first-task search; filter; open a detail; copy/send the code; go back; reach contact information.
- Original friction: Duplicate supplier concepts complicated the menu, the hero delayed search, the menu did not lock background scroll, and state could disappear after navigation.
- Fix: One catalogue group, Escape/focus restoration, scroll lock, a 44 px minimum search target, compact mobile hero, no horizontal overflow, URL state, and concise actions.
- Result after fix: The journey remains operable at every requested viewport, after rotation, with reduced motion, and at 200% zoom.

## Shared trust outcome

Every supplier journey now states or preserves these constraints: screen colors are references, stock and specification require confirmation, the page does not promise price or availability, and Tùng Phát is the party providing advice, supply checks, quotation, and fabrication guidance.
