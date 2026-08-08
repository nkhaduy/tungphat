# SEO/GEO Foundation Design

## Objective

Establish a maintainable search and AI-retrieval foundation for `mdftungphat.com` without inventing product, pricing, operating-hour, certification, customer, or supplier claims. The implementation must keep the current static-export architecture and derive machine-readable output from the same verified content and business settings used by the website.

## Baseline

- Canonical host: `https://mdftungphat.com` with trailing-slash page URLs.
- Production sitemap: 14 indexable URLs.
- Local export: 25 public HTML pages after draft/sentinel cleanup; brand/catalogue placeholders remain `noindex, follow` and stay out of the sitemap.
- Existing strengths: server-rendered static HTML, self-canonicals on indexable pages, draft/noindex gates, breadcrumbs, Product/Service/Article schema, centralized business settings, and automated link/sitemap checks.
- Confirmed gaps: inconsistent schema page identifiers, incomplete WebPage/primary-entity relationships, no machine-readable retrieval index, no `llms.txt`, production-wide security headers absent on Vercel, incomplete consolidated SEO output metrics, and no automated query/citation test corpus.

## Architecture

### 1. Canonical entity graph

Extend `lib/seo.ts` with reusable WebPage and entity-reference helpers. Every indexable template will expose a canonical WebPage node that points to the shared WebSite and Organization identifiers. Product and Service pages will link their primary entity to that WebPage. Absolute page URLs and fragment identifiers will always use the trailing-slash canonical form.

### 2. Machine-readable knowledge layer

Create a generated `knowledge.json` artifact from `content/settings`, published product/service content, and the existing sitemap rules. It will expose only verified public fields: business identity, locations, service area, page URLs, product specifications, applications, limitations, and updated dates. Add a concise `llms.txt` that links the canonical sitemap and knowledge dataset while explicitly remaining a supporting discovery artifact.

### 3. Search discovery and change notification

Keep one canonical sitemap and add an environment-driven IndexNow submission script. The script reads URLs from the built sitemap, requires `INDEXNOW_KEY`, stores no secret in Git, and submits only a content-hash change unless `--force` is supplied.

### 4. Extractable content and trust

Add one visible, self-contained direct-answer section on the homepage that states what Tùng Phát provides, who it serves, where it operates, and what must be confirmed before quoting. Preserve the existing factual, non-promissory tone. Correct image descriptions that claim unverified provenance.

### 5. Deterministic SEO quality gate

Add a consolidated static-output audit that reports indexable/noindex counts, duplicate titles/descriptions, canonical errors, schema parse/relationship errors, sitemap errors, broken links, orphan pages, thin indexable pages, and direct-answer coverage. The gate will fail on the user's P0/P1 quality conditions and emit JSON for before/after reporting.

### 6. Operational documentation

Add the requested AI query matrix and off-site strategy. Separate repository work from owner-controlled actions such as Google Business Profile, Search Console, Bing Webmaster Tools, supplier corroboration, and review acquisition.

## Safety and quality controls

- No price, inventory, delivery, tolerance, opening-hour, review, certification, partner-status, or customer claim is added without repository evidence.
- Placeholder brand/catalogue routes remain noindex until unique verified catalogue/product data exists.
- Draft articles and projects remain absent from the export and sitemap.
- No crawler is blocked from public content; training-specific crawlers are not granted special access beyond the public default.
- New behavior follows test-first red/green verification and the full repository quality gate.

