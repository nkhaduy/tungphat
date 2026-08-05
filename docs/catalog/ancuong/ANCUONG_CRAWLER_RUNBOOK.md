# An Cuong Crawler Runbook

Run only from the dedicated `codex/ancuong-catalog-crawler` worktree. Default and recommended concurrency is 2.

## Full detail and offline derivation

```bash
npm run catalog:ancuong:discover
npm run catalog:ancuong:crawl:listings -- --resume --concurrency=2
npm run catalog:ancuong:crawl:details -- --resume --concurrency=2
npm run catalog:ancuong:crawl:relations -- --concurrency=2
npm run catalog:ancuong:normalize
npm run catalog:ancuong:media -- --manifest-only --concurrency=2
npm run catalog:ancuong:validate
npm run catalog:ancuong:diff
npm run catalog:ancuong:export
npm run catalog:ancuong:report
```

`--manifest-only` writes the complete product-media URL inventory without fetching binaries. Use it whenever the storage gate has not passed.

## Resume rules

- `--resume` skips a detail only when checkpoint state is `parsed` and the raw detail exists.
- Each parsed result is atomically persisted, so a block or interruption does not discard earlier successes.
- HTTP 404/410 becomes `failed-final`; transient exhausted requests remain `failed-retryable`.
- Stop on CAPTCHA, challenge, HTTP 403, persistent 429, parser-wide failures, branch/HEAD change, or unsafe disk state. Never bypass the source control.

## Scoped verification

```bash
npm run catalog:ancuong:crawl:details -- --category=laminate --resume --concurrency=2
npm run catalog:ancuong:crawl:details -- --product=303000054 --force --concurrency=2
npm run catalog:ancuong:test:live -- --verbose
```

Do not delete raw, state, normalized, export, or media paths to force a retry. Re-run only the affected product/category after reviewing its checkpoint evidence.

## Storage-approved media download

Only after both the 20% free-space reserve and 10 GiB absolute reserve pass:

```bash
npm run catalog:ancuong:media -- --concurrency=2
```

Media files remain ignored by Git. Commit manifests/checksums/reports only. Preserve source formats and do not optimize, recolour, upscale, or convert in the crawler branch.

## Parser changes

For a verified new source layout, save a minimal sanitized fixture, write a failing parser test, update the parser, pass the focused/full suites, bump parser version if the canonical contract changes, and reparse affected cached source only.
