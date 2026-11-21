# Conversion Growth Audit

## Journey observations — production 08/11/2026

Sampled the An Cường Melamine collection as a customer searching for a color code. Top area shows breadcrumb, H1, 367-code note and a dense multi-column grid of code/name links. A search control by code/name/supplier and material filters are present below the initial linked-code block; interaction tree confirms a search input and filter counts. No color-chip preview was visible in the first screen screenshot. Page also exposes “Tải thêm 48 mã”. This is useful retrieval but does not visually help compare candidate surfaces before opening a code.

Phone CTA is present in the global header. Below the catalogue are “Nhắn Zalo tư vấn”, phone and “Báo giá theo quy cách”. This supports the buyer path; the next step should carry the selected code and preserve it when the user moves to the quote request. The audit did not send a Zalo message, call, form submission or production inquiry.

## Persona friction and recommendation

| Persona | Evidence/current path | Friction | Improvement | Effort / impact hypothesis |
|---|---|---|---|---|
| Contractor buying multiple panels | Materials → category / quote. Quote page asks for relevant material specifications | Need to describe cốt, supplier, surface, thickness, dimensions and quantity consistently | One concise quote checklist, multi-item line list, keep it lightweight; no checkout unless sales operation supports it | Medium / fewer incomplete quote requests |
| Workshop requesting CNC/cutting | Article preparation gets 254/11 live 3m; service pages expose file/spec instructions | Buyer must move from how-to to request while carrying file/material details | Link article to quote CTA; explain actual accepted file and fields after workshop confirms | Low–medium / more qualified requests |
| Individual looking for gỗ ghép | `/go-ghep/` gets 171/14 and strong historic CTR | SERP packs map/results and buyer needs actual face/spec examples | Real images and known availability/specs; provide a message template without promising stock | Medium / serious inquiries |
| An Cường code lookup | Search, code links, supplier filters, detailed code route and CTAs confirmed live | Text grid offers no visible swatches; code may be lost when contacting | Add copy-code and optional quote prefill with exact code; use curated verified swatches | Medium / fewer mismatched requests |
| Comparing materials | Material reference center includes a comparison matrix and external source citations | Long comparison can overwhelm mobile; data source/date must be easy to scan | Put plain-language selection summary above table, keep horizontally scrollable table; verify source/date | Low–medium / qualified route to category |

## Form/CTA and trust

Current public pages show actual business name, phone and two branch names/locations in site footer. The contact route points to Zalo, phone and Maps. This is useful trust/contact information, but the audit could not confirm it matches each Google Business Profile because no authorized profile access was available. No verified customer review or qualification/quote completion figures were supplied.

CTA labels should match intent: “Tra mã màu”, “Gửi mã hỏi vật liệu”, “Gửi quy cách để hỏi giá”, “Gửi file CNC”, “Gọi tư vấn”. Keep one clear primary action per page and avoid duplicating aggressive calls after each section. Prefill code/material/dimensions only after validating destination URL behavior on desktop/mobile; no prefilled link was submitted in this audit.

## Analytics status

Repository has a first-party analytics client that sends events to the CMS endpoint and optionally calls `window.gtag` if present. Code references `click_quote`, `click_zalo`, `click_phone`, `product_view`, `form_submit`, `click_maps`, and content engagement. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is optional in source; no value was read. Production GA4/GTM stream and real event counts were not inspectable through authorized analytics access.

Tracking gaps to resolve with owner: distinguish CTA clicks vs form success; identify an inquiry with minimum useful fields; record qualified lead outcome/order only with business/CRM approval; connect organic landing page to lead without collecting unnecessary personal data. The current source event does not prove a qualified lead or sale.

## Prioritized fixes

1. Preserve material/code/quantity/operation details between relevant pages and quote destination.
2. Add verified copy-code affordance; test keyboard and mobile.
3. Show real photo previews for a limited high-intent color-code cohort.
4. Place service-specific CTA beside CNC file requirements.
5. Confirm branch NAP and policy with owner before changing LocalBusiness/Maps data.
6. Instrument successful form submission and lead quality only after measurement/consent review.

No production conversion or test lead was submitted.
