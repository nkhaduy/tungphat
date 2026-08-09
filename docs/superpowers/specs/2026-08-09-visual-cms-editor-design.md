# Tùng Phát Visual CMS Editor Design

## Outcome

Replace every normal-user raw JSON editor with a structured, Vietnamese visual editor and a live website preview. The supplied UX brief is treated as the approval gate for this design; no technical choice is delegated to the user.

## Audit Findings

- Worktree: `/Users/khaduy/Downloads/tungphat-light-cms-worktree`, branch `codex/light-cms-staging`, HEAD `a5a661c07a62d6c313f8178d3306774a174a48d1`.
- Production CMS is already Light CMS at `https://cms.mdftungphat.com`; current Pages deployment source is `a5a661c` and the Worker is `tungphat-light-cms-api-production`.
- Production authentication is Baogia ES256 SSO with independent CMS sessions; migrations `0003_baogia_sso.sql` and `0004_remove_password_runtime.sql` are applied. Pages `pages.dev` hostnames still have historical Cloudflare Access protection.
- Production public website remains Decap-backed at `https://mdftungphat.com`; Payload data and Decap rollback remain preserved.
- Production D1 read-only digest: 12 content records (6 products, 3 articles, 2 pages, 1 project), 5 settings records, 9 ready media. Existing database table is `settings_records`, not `settings`.
- Existing `/cms-preview` route already reuses the website's `ProductLanding`, `ArticleLanding`, `ProjectLanding`, and `ServiceLanding` components through a cross-origin `postMessage` bridge. It currently has origin allowlisting but no per-preview nonce.
- Existing raw JSON surfaces are `ContentScreen`, `SettingsScreen`, and the Media `pre` dump. Existing API data stays JSON internally; only normal-user presentation changes.

## Audited Content Model

The editor is generated from the real contracts in `light-cms/src/contracts/content.ts`, the website schemas in `lib/content-schema.ts`, and the Decap config in `cloudflare-cms/public/config.yml`.

### Products

Basic: `title`, `slug`, `category`, `materialType`, `supplier`, `excerpt`, `status`, `quoteCta`, `publishedAt`, `updatedAt`, `draft`, `featured`.

Specifications: `dimensions[]`, `thicknesses[]`, `surfaces[]`, `standards[]`, `applications[]`, `advantages[]`, `limitations[]`, `orderingSteps[]`, `faq[{question,answer}]`, `relatedArticles[]`.

Media: `featuredImage`, `featuredImageAlt`, `gallery[]`, `video`, `catalogue`, `ogImage`.

SEO: `seoTitle`, `seoDescription`, `canonical`, `noindex`.

### Articles

Basic: `title`, `slug`, `excerpt`, `category`, `author`, `publishedAt`, `updatedAt`, `draft`, `featured`, `tags[]`.

Content/media/SEO: `body` (structured rich blocks serialized internally), `featuredImage`, `featuredImageAlt`, `gallery[]`, `video`, `catalogue`, `ogImage`, `seoTitle`, `seoDescription`, `canonical`, `noindex`, `relatedProducts[]`, `relatedArticles[]`, `faq[]`.

### Projects

Basic: `title`, `slug`, `completedAt`, `materialType`, `processingType`, `thickness`, `area`, `quoteCta`, `publishedAt`, `updatedAt`, `draft`, `featured`.

Case study: `workItems[]`, `customerRequirement`, `process[]`, `result`, `body`.

Media/SEO: `featuredImage`, `featuredImageAlt`, `beforeImages[]`, `afterImages[]`, `gallery[]`, `video`, `catalogue`, `ogImage`, `seoTitle`, `seoDescription`, `canonical`, `noindex`.

### Service pages

Basic: `title`, `slug`, `eyebrow`, `excerpt`, `publishedAt`, `updatedAt`, `draft`, `quoteCta`.

Structured content: `materialTypes[]`, `workItems[]`, `process[]`, `fileGuidance[]`, `faq[]`, `body`.

Media/SEO: `featuredImage`, `featuredImageAlt`, `video`, `catalogue`, `ogImage`, `seoTitle`, `seoDescription`, `canonical`, `noindex`.

### Settings and homepage

Existing settings are `business-settings`, `seo-defaults`, `static-pages`, `material-categories`, and `brands`.

- Business fields: identity, legal/tax, phone/Zalo/email, opening hours, service areas, locations with map URLs/media, social links, footer copy and primary CTA.
- SEO defaults: site URL/name/title/description/default OG image.
- Static pages: update date, home hero description, contact intro, quote intro.
- Material categories: title and sortable `{name, slug}` items.
- Brands: sortable brand items with logo, description, catalogues and PDFs.

The homepage editor exposes these real sections: Hero, product categories, CNC service, workshop media, reasons to choose Tùng Phát, Google reviews, branch maps, contact CTA, and SEO. Existing translations and fixed layout remain design-system controlled. New optional homepage copy/image/CTA fields are added to `static-pages` with defaults matching the current website, so old records parse unchanged. Only content values are editable; no CSS, HTML, JS, font, arbitrary section, or brand-color controls are exposed.

## Architecture Options

1. **CMS-only mock preview**: cheap but violates “what you see is what visitors see”; rejected.
2. **Iframe website preview with local draft via `postMessage`**: reuses real website components, sends no D1 write per keystroke, and keeps drafts private. Recommended.
3. **Server-render a temporary draft snapshot on every change**: strongest server parity but adds Worker/D1 CPU, cache and token complexity for no UX benefit.

## Recommended Design

### Structured editor

`ContentScreen` becomes a list + editor shell. A schema-driven `VisualEditor` renders reusable `TextField`, `Textarea`, `Select`, `Switch`, `SlugField`, `SortableRepeater`, `FaqRepeater`, `RichTextEditor`, `MediaPicker`, `ImageGallery`, `SEOEditor`, `SaveIndicator`, and `PublishControls`. Product sections are Basic, Content, Specifications, Images, SEO and Settings. Other collections use the same primitives with collection-specific field descriptors. Object/array values remain typed state and serialize to `content_json` only at save time.

### Preview protocol

The CMS creates a 128-bit random preview instance token per iframe. The token is placed in the website preview URL fragment, never in a request or server cache. The website preview reads the fragment and accepts `tp-preview-init`, `tp-preview-ready`, and `tp-preview-draft` only when origin, `event.source`, collection/record identity and token match. The parent sends sanitized field state after a 350ms debounce. Website preview responses use `noindex`, `no-store`, and existing frame-ancestor CSP. Opening a new tab creates a new token and uses the same handshake. No D1 write or version is created by live typing.

### Homepage preview

The same bridge sends `collection: "homepage"` and the structured `static-pages` homepage payload. The website preview route renders the shared homepage view using the current website component tree. Until a homepage field is persisted, current Decap/default values are used. Public homepage content is unchanged while the CMS draft is unsaved or unpublished.

### Responsive layout

At >= 1100px, the editor uses a resizable 44/56 split with a sticky preview toolbar and one scrollable form pane. At 769–1099px, it uses a narrower split with the preview tab available. At <= 768px, it switches to `Chỉnh sửa` / `Xem trước` tabs and a fixed bottom action bar. Preview viewport buttons are Desktop 1440, Tablet 768 and Mobile 390; one iframe is reused.

### Persistence and validation

Local form state is independent from saved draft and published state. Saves are explicit and use the existing optimistic version API. Human-readable field errors are derived from the existing schema paths and focus the first invalid field. Slug changes show a published-URL warning. Publish is blocked until validation passes. Local state survives preview errors and reload after a successful draft save.

### Media

Media is a searchable thumbnail grid with upload, alt/caption editing, dimensions and file size. Object keys, hashes and API response shapes are never rendered. `MediaPicker` and `ImageGallery` only emit media URLs/IDs into the internal draft state; reorder uses keyboard buttons as well as pointer drag.

### Rich content

The editor uses lightweight structured blocks (`heading`, `paragraph`, `bulletList`, `numberedList`, `quote`, `link`, `image`) with a plain-language toolbar. It converts to the website's existing Markdown-compatible body at save/preview boundaries; no Markdown source is shown.

### Error and security behavior

Preview failures show “Không thể tải bản xem trước” with retry and never clear form state. Forged origins, wrong source windows, wrong tokens, wrong collection/record, expired sessions and private media requests fail closed. Drafts never enter public snapshot, sitemap, public cache or indexing.

## Testing and Acceptance

- Unit: field descriptors, array/object normalization, schema-to-human-error mapping, slug warning, nonce handshake and preview sanitization.
- Component: no `textarea` containing JSON, product repeater add/delete/reorder, SEO preview, Media grid, homepage section fields, save states and mobile tabs.
- E2E: product and homepage live draft update, save/reload, publish fixture/cleanup, media selection, 1440/1024/768/390 viewports, preview failure recovery.
- Axe: zero serious/critical/color-contrast violations; keyboard, focus, dialogs, sortable keyboard alternatives and reduced motion.
- Cloudflare: Worker dry-run, D1/R2 local smoke, remote read-only backup/checksum, SSO/RBAC/CSRF/security suite, preview protocol tests, CPU benchmark with p99 <= 8 ms and max <= 9 ms.

## Deployment Boundary

The current CMS production is already Light CMS with a rollback-safe Pages deployment. After backup, full gates and live smoke, deploy the CMS Pages UI and Worker only if the Worker diff is limited to preview/security endpoints and the Baogia SSO path remains unchanged. Do not change website provider, DNS outside the existing CMS hostname, Payload, Decap, Workers plan or billing.
