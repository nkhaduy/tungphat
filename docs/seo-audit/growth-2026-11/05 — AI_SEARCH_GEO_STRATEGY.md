# AI Search / GEO Strategy

## Kết quả đo được

- Google Search Console’s “Tính năng AI tạo sinh” report is marked **Thử nghiệm**. On 08/11 it showed **7,83K impressions for 07/08–06/11/2026**, with landing-page rows: Melamine An Cường 550, homepage 215, Thanh Thuỳ Melamine 96, CNC file-prep article 93, An Cường code MS 503 MM 82, Thanh Thuỳ hub 81, MS 106 SH 76, Laminate collection 63, MS 502 MM 60, MS 426 SC 59. The report displays impressions only. It does not show the source citation count, outbound AI clicks, qualified lead or revenue.
- Prior report/export was 6.356 experimental impressions 01/08–31/10. The new window starts six days later and ends six days later; the higher total is not a like-for-like trend and should be re-run on identical dates.
- Two Google AI Overviews were visible in a personalized Hồ Chí Minh search sample on 08/11. “gỗ ghép cao su TP.HCM” showed an AI answer with citation to goghepphuongnam.com plus another source; “bảng màu Melamine An Cường” cited An Cường and Facebook. Tùng Phát was not in those observed citations. One answer is not a stable citation rank.
- No authorized current GA4 AI-referral report, Bing Webmaster Tools AI Performance report, or server/CDN logs were available in this audit. Copilot/Perplexity/ChatGPT answer citations are unknown.

Google states that normal technical SEO and helpful content remain the path to eligibility for AI Overviews/AI Mode; there are no special AI files or schema requirements. A page must be indexed and eligible for a normal search snippet, but eligibility does not guarantee appearance. [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features). Bing Webmaster Tools now offers an AI Performance report with citations and grounding-query samples; request owner access to measure rather than guessing ([Bing official announcement](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)).

## Crawler and machine-access audit

Production `robots.txt` fetched 08/11: generic `User-agent: *`, `Allow: /`, then rules for private/admin/api and query URL patterns, and sitemap. There is no specific group in the fetched file for OAI-SearchBot, GPTBot, ChatGPT-User, Bingbot, Claude-SearchBot or PerplexityBot. In ordinary robots matching, public paths are not disallowed for these user agents by the generic group. **Do not infer actual verified bot fetching.** No bot was spoofed. CDN/WAF allow/block configuration and verified bot logs were not available. A normal anonymous HTTP fetch is not proof a real crawler receives the same response.

Googlebot/search crawlers and model-training crawlers are separate purposes. OpenAI’s publisher guidance says OAI-SearchBot access helps content be found and cited in ChatGPT Search; GPTBot is a separate control. The current `User-agent: * Allow: /` appears to leave training crawlers permitted unless provider-specific policy applies. The audit made no robots changes. Owner must decide separately whether to keep or restrict training access; do not weaken an existing preference to gain search visibility. [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856), [ChatGPT Search guidance](https://help.openai.com/en/articles/9237897-chatgpt-search).

HTTP tests used a normal audit user-agent for public assets/pages only. `/`, Melamine collection, gỗ ghép, CNC, quote and contact pages returned HTTP 200, HTML with canonical and robots meta. Main page HTML is substantial/static enough to render key text without requiring crawler spoofing. Exact verified Googlebot/OAI SearchBot/Bingbot/Claude/Perplexity response parity, blocked assets by network identity, and CDN rules remain unknown. No actual request logs were accessible.

## llms.txt and resources

Live `/llms.txt` (1.381 bytes) is labelled an experimental supporting retrieval index, names company/website/contact and links to canonical sitemap, knowledge JSON, material-reference CSV, CNC checklist, materials, CNC, supplier, and material-reference pages. All eight linked resources checked returned 200. `/llms-full.txt` returns 404; no need to create a large duplicate text corpus. This file may help a reader or tool follow curated links, but Google does not require it and there is no evidence it improves ranking/citation. The current file correctly says canonical site resources remain source of truth and avoids fixed-price/availability guarantees. Keep concise and review links when routes change; no edit justified now.

## Citation-worthiness priorities

1. Add reliable source links to material comparisons and distinguish board core from decorative surface. Keep manufacturer specification/date references on-page where a spec is used.
2. Add first-party visual evidence: real panel/surface photos with code, supplier, material, source and date; make color limitations clear.
3. Explain what a buyer should send for quote: material/code, core, thickness, dimensions, quantity, cut/CNC/edge requirement and file.
4. Retain unique exact-code URLs with canonical self and real code data. Cross-link code ↔ category ↔ supplier hub without creating a duplicate text copy.
5. Make business identity, branch names and phone consistent; verify GBP before updating it.
6. Keep dates/revisions on durable reference content and correct manufacturer-dependent claims when sources change.

These are useful content practices for buyers first. AI citations cannot be promised.

## 36-question sampling matrix

`AI_CITATION_RESEARCH.csv` contains 36 commercial/informational questions. Only two were checked in the live Google interface; the other 34 are explicitly `UNKNOWN / not observed`, not fabricated. Rerun a representative sample in Google Search/AI Mode, ChatGPT Search, Bing/Copilot and Perplexity where available, recording query, locale, date, cited URL and source answer. Do not automate scraping or treat one result as stable rank.

## Measurement plan

| Layer | Measure | Authorized source needed | Interpretation |
|---|---|---|---|
| AI search visibility | GSC experimental impressions and page/date | GSC | Appearance exposure only, not citations/clicks |
| Citations | Bing AI Performance citation and grounding query; observed URLs in product interfaces | Bing Webmaster Tools and dated manual samples | A citation event, not ranking/revenue |
| Referral traffic | GA4 sessions/source/landing page after consent; server referrer if retained | GA4/analytics owner + privacy review | Clicks that arrive from AI surfaces |
| Leads | Submitted quote success and qualification outcome | First-party analytics/CRM operations | A button click alone is not a lead |
| Orders | Order IDs/source attribution | Business system | Revenue only with actual order association |

Repeat windows with same dates and compare by source. Tag experimental observations, preserve user privacy and do not merge GSC AI impressions with ordinary Web totals without understanding overlap.
