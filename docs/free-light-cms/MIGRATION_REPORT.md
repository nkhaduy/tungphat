# Light CMS migration report

- Report time: `2026-08-08 22:45 +07`
- Source of truth: current Decap content and referenced public media.
- Production mutation: none.
- Acceptance status: `PASS`.

## Source analysis

| Data group | Count |
|---|---:|
| Content records | 12 |
| Products | 6 |
| Articles | 3 |
| Projects | 1 |
| Pages | 2 |
| Settings contracts | 5 |
| Referenced media files | 9 |

The requested historical value `Media 10` does not match the current source tree, Payload verification, migration manifest, or local D1/R2 smoke. All available sources consistently contain 9 media records/files, so the report preserves 9 rather than manufacturing a tenth entry.

## Identity-safe migration

- The migration actor remains present for foreign-key ownership but is not a login identity.
- `active = 0`.
- `status = disabled`.
- `access_subject = NULL`.
- `password_hash = !access-only!`.
- No password hash was converted or deleted.
- No login creates or promotes a user.

## Fresh local D1/R2 smoke

| Check | Result |
|---|---|
| D1 records | 12 |
| D1 settings | 5 |
| D1 media | 9 |
| Initial versions | 12 |
| Migration idempotent runs | 2 |
| R2 put/get/delete | pass |
| R2 fixture bytes | 133,314 |
| R2 SHA-256 | `369a5bea2769efe083e7d50957cfd72c65f971e24d053a3bab3251e9f4c412c6` |

Generated artifacts remain in `light-cms/output/migration/`. No remote D1/R2 write was performed during this identity change.

## Fresh remote staging verification

- Remote D1 read-only audit after the Access benchmark reports `12` active content records, `5` settings, and `9` ready media records.
- The benchmark fixture has `0` active content rows and `0` active media rows after cleanup; its content row and media metadata rows remain soft-deleted for auditability.
- Remote D1 audit query wrote `0` rows. No production database or bucket was queried for mutation.

Migration and idempotency pass locally, and the migrated staging baseline remains intact after the real Access workflow.
