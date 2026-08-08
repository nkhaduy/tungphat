# Light CMS provider parity report

- Report time: `2026-08-09 03:29 +07`
- Production website provider: `decap`.
- Production website cutover: not performed.
- Local parity status: `PASS`.

## Contract parity

The website provider facade continues to support `decap`, `payload`, and `light`, while missing or invalid configuration defaults to Decap. The Light snapshot contract validates schema version, checksum, published-only records, public settings, media metadata, and rejects malformed or tampered snapshots.

Fresh focused provider tests passed `5/5`:

1. Decap remains the default; Payload and Light require explicit selection.
2. Light is accepted explicitly without changing the default.
3. Malformed or checksum-tampered Light snapshots are rejected.
4. Configured snapshots are read and missing snapshots return null.
5. Media, SEO, arrays, and status map to the existing website contract.

## Data parity

| Collection | Decap source | Light migration input |
|---|---:|---:|
| Products | 6 | 6 |
| Articles | 3 | 3 |
| Projects | 1 | 1 |
| Pages | 2 | 2 |
| Total | 12 | 12 |
| Settings | 5 | 5 |
| Media | 9 | 9 |

The public snapshot includes only published records. Drafts, identities, roles, audit logs, versions, assertion uses, and sessions remain private.

## Production invariants before remote deployment

```text
CMS production: DECAP
Website production provider: DECAP
Payload data preserved: YES
Production provider cutover: NONE
```

These invariants are re-audited read-only before any Cloudflare mutation. The session does not authorize a website provider cutover.
