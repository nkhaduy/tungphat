# Repository forensics - 2026-08-20

## Conclusion

`01e4daff83d5e71181f80221d4a37ab1e26358fc` is the newest complete recoverable source state. It is six commits after the common ancestor `a0732174b75f161f13644cba29f3da20263290ec`. GitHub `main` (`58b91438608cbae075029fdf6af9e62247e5f312`) is eight commits on a sibling line. The recovery line intentionally replaces the legacy CMS with Payload and includes later supplier gallery deduplication, production media crawl coverage, cleanup ignores, and CMS login work.

No other clone, worktree, bundle, patch, archive, or source snapshot was found under `~/RECOVERY`. Recovery assets there are Cloudflare metadata, a verified D1 export, R2 inventory metadata, and provider configuration.

## Git evidence

- Origin: `https://github.com/nkhaduy/tungphat.git`, partial clone filter `blob:none`.
- All GitHub heads, tags, and PR heads 1-34 were fetched.
- Recovery branches `payload-migration-20260817` and `recovery/pre-erase-20260818` both point to `01e4daf`.
- `main` points to `58b9143`; divergence is 8 commits on main and 6 on recovery after `a073217`.
- Reflogs contain no post-`01e4daf` source checkout. `git fsck` exposed many dangling historical objects but no newer complete source tip.
- The pre-existing `.gitignore` change added a redundant `.env*` line; it was normalized without discarding its secret-protection intent.

## Deployment SHA recovery

Cloudflare Pages records abbreviated source labels. `a073217` was already present. GitHub Actions metadata resolved and GitHub still served two deleted-branch commits:

- `9ba3ff52693a8bd37c74b834a474cf787ce7b694` - older rewritten equivalent of `630b4e8`, GBP D1 migration compatibility.
- `04e01ba33f1162a0269402b559d9b726475333c1` - older rewritten equivalent of `d3ea3ae`, visual frontend refinement.

Unresolved labels are `7cdbb09`, `e45e89e`, `00dcd9d`, `c8e8bdb`, `6a4dbf7`, `279a4de`, `5740037`, and `c7e5e02`. They are absent from visible GitHub refs, PR refs, local reflogs/objects, and GitHub Actions run heads queried during recovery. Pages deployments contain compiled gateway output, not an authoritative Git source tree.

## Production comparison

Cloudflare Worker version 25 (`3b5e6543-0279-42de-aa7e-c8ea195201cd`, 2026-08-19) is active at 100%. Its bindings, compatibility date, build version, D1, R2, assets, and secret names match the recovered Payload configuration. Its script etag differs from version 24, proving a later bundle upload, but provider metadata does not expose its original TypeScript source. Deployment is therefore gated on live behavioral comparison; it must not be overwritten if recovered source lacks production behavior.

The D1 backup at `~/RECOVERY/tungphat-cloudflare/d1/tungphat-payload-cms.sql` matches SHA-256 `de77f819d747fcacec9356403d36fb44c495eaa573013c708e383da43365bed7`. R2 `tung-phat-media` was observed at 11,223 objects / 10.4 GB; no bulk download or mutation was performed.
