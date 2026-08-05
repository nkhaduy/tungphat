# An Cuong Crawler Runbook

Run all commands from the repository root on `codex/ancuong-catalog-crawler`.

## Common Runs

```bash
npm run catalog:ancuong:sample -- --limit=7 --resume
npm run catalog:ancuong:discover
npm run catalog:ancuong:crawl:listings -- --resume --concurrency=3
npm run catalog:ancuong:crawl:details -- --resume --concurrency=3
npm run catalog:ancuong:crawl:relations
npm run catalog:ancuong:media -- --resume --concurrency=3
npm run catalog:ancuong:normalize
npm run catalog:ancuong:validate
npm run catalog:ancuong:diff
npm run catalog:ancuong:export
npm run catalog:ancuong:report
```

Full orchestration:

```bash
npm run catalog:ancuong:all -- --resume --concurrency=3
```

## Scoped Runs

```bash
npm run catalog:ancuong:crawl:listings -- --category=melamine --resume
npm run catalog:ancuong:crawl:details -- --category=laminate --resume --limit=100
npm run catalog:ancuong:crawl:details -- --product=303000054 --force
npm run catalog:ancuong:crawl:details -- --product=https://ancuong.com/melamine/303000054.html --force
npm run catalog:ancuong:crawl:details -- --changed-only --resume
npm run catalog:ancuong:all -- --skip-media --resume
npm run catalog:ancuong:test:live -- --verbose
```

Use `--dry-run` for commands that would write runtime state, `--verbose` for planned counts, and conservative concurrency of 2-4. Stop rather than bypass if the source returns CAPTCHA, challenge, 403, or persistent 429.

## Resume And Failed URLs

1. Inspect `data/imports/ancuong/state/crawl-listings.json` or `crawl-details.json` for `failed-retryable` and `failed-final` records.
2. Re-run a product with `--product=<id-or-url> --force` after confirming the source is available.
3. Use `--resume` for normal continuation. Do not delete the state directory merely to retry one URL.

## Safe Cache Removal

Preview:

```bash
find data/imports/ancuong/cache -mindepth 1 -maxdepth 1 -print
```

Remove only the crawler cache after reviewing the preview:

```bash
find data/imports/ancuong/cache -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
```

Do not remove `raw`, `state`, `normalized`, `export`, or `media` when clearing HTTP cache.

## Dataset Rollback

Before replacing an integration import, archive the current six export files outside the production data path. To restore a reviewed Git snapshot in this crawler branch:

```bash
git restore --source=<reviewed-commit> -- data/imports/ancuong/export data/imports/ancuong/normalized
npm run catalog:ancuong:validate
```

This branch does not contain a production import command and must not be used to deploy.

## Parser Version Upgrade

1. Change `ANCUONG_PARSER_VERSION` in `scripts/ancuong/types.ts`.
2. Add or update an offline fixture and failing parser test for the source change.
3. Run `npx vitest run tests/ancuong`.
4. Re-run the affected scope with `--force`.
5. Normalize, validate, diff, export, and review reports before accepting the new snapshot.

