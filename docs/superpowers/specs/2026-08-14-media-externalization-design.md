# Media Externalization Design

## Goal

Remove production catalogue and generated media binaries from the current Git tree while preserving the existing public `/catalog/...` URLs, production behavior, SEO signals, and future crawler workflows.

## Storage And Delivery

Use the already-enabled Cloudflare R2 Standard bucket `tung-phat-media`. The existing Cloudflare Pages CMS already binds this bucket as `MEDIA` and serves private R2 objects through `cms.mdftungphat.com/media/...`. Extend that handler to serve `catalog/*` objects with immutable cache headers.

Keep browser-facing catalogue URLs unchanged. Vercel rewrites `/catalog/:path*` to `https://cms.mdftungphat.com/media/catalog/:path*` after the corresponding static files are removed. This preserves indexed image URLs, avoids browser CORS changes, and requires no new DNS record or paid service.

## Inventory And Retention

Inventory every tracked and untracked media file by path, size, Git state, content hash, reference state, runtime importance, and SEO importance. Exact duplicate content is uploaded once under a canonical object key; aliases are retained as zero-binary manifest mappings and served by the media handler. Production-referenced catalogue objects are retained. Unreferenced generated catalogue media is excluded unless a catalogue metadata record or runtime convention proves it is required.

Small design-source assets such as logos, favicons, UI images, and small SVGs remain in Git. Product, catalogue, gallery, thumbnail, downloaded crawl, large PDF, and generated media do not.

## URL Abstraction

`lib/media.ts` remains the single application URL resolver. Catalogue references continue to resolve to their same-origin `/catalog/...` path by default. An optional `NEXT_PUBLIC_MEDIA_BASE_URL` supports direct external URLs for non-proxied environments without scattering hard-coded hostnames through metadata.

## Sync And Manifest

Add a media inventory/sync command that hashes files, deduplicates content, checks existing remote metadata, uploads only missing or changed objects with correct MIME and immutable cache metadata, verifies representative downloads, writes a compact tracked manifest, and removes temporary cache files. Runtime downloads use an ignored `.cache/media-sync` area.

Supplier crawlers write downloads only to ignored cache/import locations. Their publish step invokes the shared upload module, stores logical `/catalog/...` paths plus object metadata in catalogue JSON, and removes temporary files. CI rejects tracked catalogue/generated media so a later crawl cannot reintroduce binaries.

## Failure And Rollback

The upload is idempotent and completes before Git removal. Production is deployed in two compatible layers: the CMS media route first, then the Vercel rewrite and binary removal. Until the website deployment is ready, existing static files continue serving. Rollback consists of reverting the Vercel deployment; uploaded R2 objects remain harmless and reusable.

## Verification

Verify manifest counts and hashes, zero tracked catalogue binaries, targeted media tests, full lint/typecheck/tests/build, representative E2E, Vercel production readiness, desktop/mobile browser behavior, image 200 responses, console/network failures, OG/schema URLs, 404 behavior, and final Git/current-tree measurements.

## Git History

Current-tree removal is mandatory. History rewriting is performed only when remote branches, tags, worktrees, and unpushed commits prove it safe. The current repository has numerous active worktrees and divergent branches, so history cleanup must be reported separately and deferred unless those dependencies can be preserved without force-updating collaborators.
