# Visual CMS Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Replace raw JSON editing with structured Vietnamese forms and a secure real-time preview of the shared Tùng Phát website components.

**Architecture:** Keep D1 `content_json` and the existing collection/settings APIs as internal storage contracts. Add a schema-driven React editor layer that owns typed local state, maps field paths to human labels, and serializes only at save time. Extend the existing `/cms-preview` postMessage bridge with a per-iframe nonce and homepage payload support; no per-keystroke Worker/D1 writes.

**Tech Stack:** React 19, Vite 7, TypeScript strict, Zod 4, Vitest + Testing Library, Playwright + Axe, Cloudflare Workers/D1/R2, existing Lucide and Montserrat TP design tokens.

## Global Constraints

- Normal-user UI must contain no raw JSON, Markdown source, HTML, YAML, object dump, database IDs, `content_json`, R2 object keys, API response or debug metadata.
- Existing Decap/Payload/Light provider compatibility and all existing data remain intact.
- Baogia ES256 SSO remains the only CMS identity path; do not reintroduce password/PBKDF2 or Cloudflare Access runtime code.
- Live preview debounce is 350ms, local-only, no D1 write/version per keystroke.
- Preview draft is noindex, no-store, private to the CMS window/token, and excluded from sitemap/public snapshots.
- Desktop/tablet/mobile layouts must support 1440, 1024, 768 and 390 widths, keyboard access, reduced motion and touch targets >=44px.
- Do not modify unrelated dirty files in the Light CMS worktree.

---

### Task 1: Add failing contract and preview protocol tests

**Files:**
- Create: `light-cms/tests/visual-editor-contracts.test.ts`
- Create: `light-cms/tests/preview-protocol.test.ts`
- Modify: `light-cms/tests/admin-screens-ui.test.tsx`
- Modify: `e2e-light-cms/ui-accessibility.spec.ts`

**Interfaces:**
- Consumes: existing `collectionSchemas`, `settingSchemas`, `sanitizeCmsPreviewDraft` and future `VisualEditor` exports.
- Produces: executable red tests for descriptor coverage, human errors, nonce rejection and raw-JSON absence.

- [ ] **Step 1: Write tests that assert every schema field has a visual descriptor and no descriptor is a JSON editor.**
- [ ] **Step 2: Write tests for object/array normalization, human-readable nested validation errors, slug generation and published slug warning.**
- [ ] **Step 3: Write tests for preview token acceptance/rejection: correct origin/source/token accepted; forged token, wrong record, wrong collection and expired token rejected.**
- [ ] **Step 4: Update UI fixture tests to assert the product editor exposes `Tên sản phẩm`, `Kích thước`, `+ Thêm kích thước`, `SEO & Google`, and has zero JSON textarea/pre output.**
- [ ] **Step 5: Run `npm --prefix light-cms test -- --runInBand` and the focused Vitest files; confirm failures are caused by missing descriptors/components, not test syntax.**

### Task 2: Build shared visual editor primitives and descriptors

**Files:**
- Create: `light-cms/src/admin/editor/types.ts`
- Create: `light-cms/src/admin/editor/descriptors.ts`
- Create: `light-cms/src/admin/editor/field-utils.ts`
- Create: `light-cms/src/admin/components/visual/TextField.tsx`
- Create: `light-cms/src/admin/components/visual/Repeater.tsx`
- Create: `light-cms/src/admin/components/visual/SortableRepeater.tsx`
- Create: `light-cms/src/admin/components/visual/RichTextEditor.tsx`
- Create: `light-cms/src/admin/components/visual/MediaPicker.tsx`
- Create: `light-cms/src/admin/components/visual/ImageGallery.tsx`
- Create: `light-cms/src/admin/components/visual/SEOEditor.tsx`
- Create: `light-cms/src/admin/components/visual/StatusControls.tsx`
- Create: `light-cms/src/admin/components/visual/SaveIndicator.tsx`
- Create: `light-cms/src/admin/components/visual/index.ts`
- Modify: `light-cms/src/contracts/content.ts`

**Interfaces:**
- `FieldDescriptor<T>` maps a field path to `label`, `section`, `kind`, `required`, `help`, `condition`, and editor props.
- `createInitialDraft(collection, data)` returns normalized typed form state without changing unknown backend data.
- `humanizeValidationIssues(error)` returns `Record<string,string>` in Vietnamese.
- `SortableRepeater` supports add, remove, duplicate, keyboard move-up/down and pointer reorder.

- [ ] **Step 1: Implement descriptors for all Product, Article, Project and Page schema fields, including conditional material fields and FAQ objects.**
- [ ] **Step 2: Implement text/select/toggle/repeater/FAQ field primitives with visible labels, helper text, required markers, error slots and 44px controls.**
- [ ] **Step 3: Implement drag reorder with keyboard fallback and `aria-live` reorder announcements.**
- [ ] **Step 4: Implement rich block editor with heading/paragraph/lists/bold/italic/link/image/quote buttons and internal Markdown serialization only.**
- [ ] **Step 5: Implement media picker/gallery against existing API data; show thumbnails, alt, caption, dimensions and size, never object keys.**
- [ ] **Step 6: Implement SEO editor with character counts and Google result preview.**
- [ ] **Step 7: Run focused contract/component tests and TypeScript; keep tests green before screen integration.**

### Task 3: Replace ContentScreen with structured collection editors

**Files:**
- Create: `light-cms/src/admin/screens/VisualContentEditor.tsx`
- Create: `light-cms/src/admin/screens/content-editor-config.ts`
- Modify: `light-cms/src/admin/screens/ContentScreen.tsx`
- Modify: `light-cms/src/admin/api.ts`
- Modify: `light-cms/src/admin/components/Layout.tsx`
- Modify: `light-cms/src/admin/styles.css`

**Interfaces:**
- `VisualContentEditor` accepts `{ collection, record, media, onChange, onSave, onPublish, onClose }`.
- `PreviewPane` consumes `{ collection, recordId, slug, draft, state }` and emits retry/open-fullscreen events.

- [ ] **Step 1: Add search/filter/status/date columns to the collection list and a quick-preview action without JSON snippets.**
- [ ] **Step 2: Render Product sections in order: Thông tin cơ bản, Nội dung, Thông số kỹ thuật, Hình ảnh, SEO & Google, Cài đặt.**
- [ ] **Step 3: Render Article/Project/Page sections using the same primitives and their audited schema fields.**
- [ ] **Step 4: Add local unsaved state, debounced preview dispatch, explicit save draft, publish confirmation, conflict recovery and slug-change warning.**
- [ ] **Step 5: Add desktop resizable split, sticky preview, tablet split/tab option and mobile edit/preview tabs with bottom actions.**
- [ ] **Step 6: Map API validation fields to nearby controls, focus the first invalid field, and retain local state on failure.**
- [ ] **Step 7: Run focused UI tests and local Playwright at all required widths.**

### Task 4: Add homepage structured editor and shared website preview rendering

**Files:**
- Create: `light-cms/src/admin/screens/HomepageScreen.tsx`
- Create: `light-cms/src/admin/homepage-schema.ts`
- Modify: `light-cms/src/admin/app.tsx`
- Modify: `light-cms/src/admin/components/Layout.tsx`
- Modify: `light-cms/src/contracts/content.ts`
- Modify: `lib/content-schema.ts`
- Modify: `lib/cms-preview.ts`
- Modify: `app/cms-preview/page.tsx`
- Modify: `app/cms-preview/layout.tsx`
- Modify: `components/Hero.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- `HomepageDraft` is a typed, backward-compatible extension of `static-pages` with optional hero/category/CNC/why-us/contact values and stable defaults.
- `previewEntry({ collection: "homepage", data, token })` returns the sanitized homepage render payload.

- [ ] **Step 1: Add optional homepage fields with defaults matching current `translations`, static pages and hardcoded image choices; existing records parse unchanged.**
- [ ] **Step 2: Extract a shared homepage view and make Hero/content sections accept the resolved homepage values without changing public default output.**
- [ ] **Step 3: Add `Trang chủ` navigation and section editor with enable/disable only where existing sections can safely be hidden/reordered.**
- [ ] **Step 4: Add homepage preview handling to `/cms-preview` with noindex/no-store and the nonce handshake.**
- [ ] **Step 5: Add unit tests for default parity and draft-only homepage updates.**

### Task 5: Harden preview protocol and website headers

**Files:**
- Create: `light-cms/src/admin/components/visual/PreviewPane.tsx`
- Create: `light-cms/src/admin/preview-protocol.ts`
- Modify: `lib/cms-preview.ts`
- Modify: `app/cms-preview/page.tsx`
- Modify: `app/cms-preview/layout.tsx`
- Modify: `light-cms/src/worker/http.ts`
- Modify: `light-cms/src/worker/index.ts`
- Test: `light-cms/tests/preview-security.test.ts`

**Interfaces:**
- `createPreviewHandshake(targetOrigin, iframeWindow)` returns token, init message and `sendDraft`/`dispose` methods.
- `sanitizeCmsPreviewDraft` supports only audited fields and a maximum 512 KiB payload.

- [ ] **Step 1: Implement cryptographically random per-instance token and handshake timeout/retry.**
- [ ] **Step 2: Require token, exact trusted origin, exact parent source, collection and optional record ID on every draft message.**
- [ ] **Step 3: Reject stale/expired token messages and clear the preview after 30 minutes or tab close.**
- [ ] **Step 4: Add iframe `sandbox` restrictions, no-store/noindex headers and preserve existing CSP frame ancestors.**
- [ ] **Step 5: Run security tests, bundle scan and existing SSO/RBAC/CSRF suites.**

### Task 6: Add media/settings visual screens and collection navigation polish

**Files:**
- Modify: `light-cms/src/admin/screens/MediaScreen.tsx`
- Modify: `light-cms/src/admin/screens/SettingsScreen.tsx`
- Modify: `light-cms/src/admin/screens/DataScreen.tsx`
- Modify: `light-cms/src/admin/components/Layout.tsx`
- Modify: `light-cms/src/admin/styles.css`
- Modify: `light-cms/tests/admin-screens-ui.test.tsx`

- [ ] **Step 1: Replace Media JSON dump with thumbnail grid, search/filter, upload progress, alt/caption edit and delete confirmation.**
- [ ] **Step 2: Replace Settings JSON textarea with field descriptors for business, SEO defaults, static pages, material categories and brands.**
- [ ] **Step 3: Add settings/homepage preview selection and saved/unsaved indicators.**
- [ ] **Step 4: Keep users/versions/audit technical views available only in their existing admin routes; avoid exposing technical data in normal editors.**
- [ ] **Step 5: Run UI tests and lint.**

### Task 7: Implement E2E, screenshots and accessibility acceptance

**Files:**
- Modify: `e2e-light-cms/ui-accessibility.spec.ts`
- Create: `e2e-light-cms/visual-editor.spec.ts`
- Create: `e2e-light-cms/homepage-editor.spec.ts`
- Create: `e2e-light-cms/visual-screenshots.spec.ts`
- Create: `output/playwright/light-cms-visual-editor/.gitkeep`

- [ ] **Step 1: Test product title/description/repeater/media/SEO live preview, save/reload and publish fixture cleanup.**
- [ ] **Step 2: Test homepage hero title/CTA/image draft preview and public homepage remains unchanged before publish.**
- [ ] **Step 3: Test desktop/tablet/mobile modes, edit/preview tabs, resize handle and preview error retry.**
- [ ] **Step 4: Capture all requested screenshots into `output/playwright/light-cms-visual-editor/` and inspect them visually.**
- [ ] **Step 5: Run Axe and keyboard/focus assertions at 1440, 1024, 768 and 390 widths.**

### Task 8: Full quality gates, data backup and safe deployment

**Files:**
- Create: `docs/free-light-cms/VISUAL_EDITOR_IMPLEMENTATION_REPORT.md`
- Create: `docs/free-light-cms/VISUAL_EDITOR_BACKUP_MANIFEST.json`
- Create: `light-cms/output/visual-editor/quality-gates.json`

- [ ] **Step 1: Run root lint/typecheck/tests/build and Light CMS lint/typecheck/tests/build, contracts, Worker integration, D1/R2 local smoke, SSO/RBAC/CSRF/security, migration/idempotency/provider parity, E2E/Axe, bundle/secret scans and `git diff --check`.**
- [ ] **Step 2: Export production and staging D1 before mutation; record record/settings/media counts, byte totals and SHA-256 checksums.**
- [ ] **Step 3: Run Worker production dry-run and benchmark; require CPU p50/p95/p99/max <= 2/4/8/9 ms, 0 errors/1102/5xx.**
- [ ] **Step 4: Deploy Worker only if the diff contains preview protocol/API compatibility changes; deploy Pages UI to staging first.**
- [ ] **Step 5: Smoke-test `https://cms.mdftungphat.com/#/` and the exact staging URL; retain previous Pages deployment ID and Worker version for rollback.**
- [ ] **Step 6: Deploy production UI after staging smoke and backup; verify auth, product editor, preview, media, homepage draft isolation and public website unchanged.**
- [ ] **Step 7: Record final CPU/error metrics, deployed version, rollback command and billing invariants.**
