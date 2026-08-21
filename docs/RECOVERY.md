# Recovery record

The authoritative recovery line starts at commit `01e4daff83d5e71181f80221d4a37ab1e26358fc` and branch `recovery/canonical-20260820`. It replaces the legacy Git-backed CMS with Payload while retaining the public site and supplier catalogue pipeline.

Recovery was promoted to canonical `main` on 2026-08-21. The permanent working repository is `/Users/khaduy/tungphat`; `/Users/khaduy/RECOVERY/repos/tungphat-github` is historical evidence only and must not be used for normal development. The authenticated deployed-build recovery evidence remains at `/Users/khaduy/RECOVERY/tungphat-deployed-20260821`.

External recovery assets remain outside Git under `~/RECOVERY/tungphat-cloudflare/`. The D1 SQL backup SHA-256 is `de77f819d747fcacec9356403d36fb44c495eaa573013c708e383da43365bed7`. Production R2 is infrastructure, not source; do not bulk-copy or delete it for repository recovery.

See `docs/recovery/2026-08-20-repository-forensics.md` and `docs/recovery/2026-08-20-application-inventory.md` for evidence and unresolved deployment SHA labels.
