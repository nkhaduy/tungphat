# Light CMS Access staging rollback runbook

- Scope: staging-only Light CMS identity authentication.
- Production CMS/provider: Decap; no rollback action may change production.
- Current state: Access build is not remotely deployed, so the immediate rollback is a no-op.

## Preserved rollback assets

- Legacy PBKDF2 implementation: `light-cms/src/worker/security/legacy/password.ts`.
- Legacy D1 session implementation: `light-cms/src/worker/security/legacy/session.ts`.
- Existing `users.password_hash`, `sessions`, `login_attempts`, and lockout columns/tables remain intact.
- Existing Decap, Payload, Light CMS D1, and Light CMS R2 data remain intact.
- Access staging bundle does not import or expose the legacy modules.

## Before the first Access deployment

1. Commit the complete identity implementation atomically on `codex/light-cms-staging` and record its commit hash here.
2. Record the exact prior password-auth Worker deployment/version ID and staging Pages deployment ID.
3. Export or verify a D1 backup without deleting current data.
4. Confirm the prior bundle is retrievable and uses only staging resources.
5. Do not deploy both password login and Access login publicly at the same time.

The current worktree is uncommitted, so an identity rollback commit hash and prior password deployment ID are not yet available. This is an explicit staging blocker, not an invitation to delete legacy code.

## Roll back after a future Access deployment

1. Disable only the staging Access rollout/deployment; do not touch production Access/DNS because none is in scope.
2. Redeploy the recorded prior password-auth Worker version and prior staging Pages artifact.
3. Revert the atomic identity commit on the Light CMS branch if source rollback is required; do not reset or clean the shared repository.
4. Restore staging-only environment bindings expected by the prior build. Do not change production variables or domains.
5. Confirm `/api/auth/login` exists only on the rolled-back staging artifact and Access login is no longer public there.
6. Verify password login, D1 session revocation, CSRF, RBAC, content, versions, media, audit, provider parity, E2E, security, and CPU gates.
7. Leave `0002_access_identity.sql` columns in place. They are additive and do not require destructive data rollback.

## Roll forward again

Reapply the recorded identity commit, deploy the Access-only bundle, set the verified team issuer/application audience/secrets, re-enable staging-only Access policies, and rerun the complete real-session functional/security/CPU acceptance. Do not mark password auth deprecated until this succeeds.

## Emergency safety checks

```text
CMS production: DECAP
Website production provider: DECAP
Payload data preserved: YES
Production billing mutation: NONE
Production DNS mutation: NONE
```
