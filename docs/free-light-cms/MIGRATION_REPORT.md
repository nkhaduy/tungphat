# Light CMS migration report

- Report time: `2026-08-09 03:29 +07`
- Source of truth: current Decap content and referenced public media.
- Production mutation during this local run: none.
- Local acceptance status: `PASS`.

## Current source analysis

| Data group | Count |
|---|---:|
| Content records | 12 |
| Products | 6 |
| Articles | 3 |
| Projects | 1 |
| Pages | 2 |
| Settings contracts | 5 |
| Referenced media files | 9 |

The historical value `Media 10` does not match the current source tree, migration analysis, local D1/R2 smoke, or current production snapshot evidence. The verified baseline is 9 media; no synthetic tenth record is created.

## Identity-safe migration

- The migration actor exists only for foreign-key ownership and remains `active=0`, `status=disabled`, with no Access or Baogia subject.
- Migration `0004_remove_password_runtime.sql` removes `password_hash` from the active runtime schema.
- The generated migration SQL inserts no password hash and cannot create a login identity.
- Baogia subjects and assertion `jti` hashes are unique at the database layer.
- Remote deployment must apply both pending migrations `0003_baogia_sso.sql` and `0004_remove_password_runtime.sql`; the older plan text saying only `0003` is obsolete.

## Fresh local D1/R2 and idempotency evidence

| Check | Result |
|---|---|
| D1 records | 12 |
| D1 settings | 5 |
| D1 media | 9 |
| Initial versions | 12 |
| Migration actor | disabled |
| Local migration applications | 4/4 pass |
| Runtime idempotent runs | 2 |
| R2 put/get/delete | pass |
| R2 fixture bytes | 133,314 |
| R2 SHA-256 | `369a5bea2769efe083e7d50957cfd72c65f971e24d053a3bab3251e9f4c412c6` |
| Generated SQL SHA-256 | `e8d74bb4b3edb15c6f0b0bd924f52cb7e61c35bc16e2d0c3b34b6f446e2ae7e3` |
| Media manifest SHA-256 | `8982e26438ebfd14f08d13615cec025f2a12d66d340de2cbb7693ec56c20118e` |

A regression test now proves migration SQL is byte-identical when only analysis wall-clock time changes. The timestamp embedded in SQL is derived from source content dates, so repeated dry runs produce identical SQL and media manifest checksums.

Generated artifacts remain under `light-cms/output/migration/`. No remote D1 or R2 write occurred in this local acceptance run.
