# Light CMS provider parity report

- Report time: `2026-08-08 22:45 +07`
- Production provider: `decap`
- Light CMS cutover: not performed.
- Acceptance status: `PASS` for staging parity; production remains Decap.

## Contract parity

The website provider facade now recognizes an explicit Light CMS snapshot while continuing to default missing or invalid configuration to Decap. The Light snapshot contract validates schema version, checksum, published-only records, public settings, media metadata, and rejects malformed/tampered snapshots.

Fresh focused provider tests passed `5/5`:

1. Decap remains the default; Payload/Light require explicit selection.
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

The public snapshot intentionally includes only currently published records; private drafts, users, roles, audit logs, versions, Access subjects, and legacy password/session columns are excluded.

The real staging snapshot remained at `12` active content records, `8` published public records, `5` settings, and `9` ready media records after the Access benchmark fixture was cleaned up. Provider parity tests passed `5/5` in the final quality run.

## Production invariants

```text
CMS production: DECAP
Website production provider: DECAP
Payload data preserved: YES
Production DNS mutation: NONE
```

Provider parity passes locally and staging Access/CPU acceptance now passes. Production provider cutover remains intentionally out of scope; Vercel production is still on `main` and Decap markers remain present on both production CMS hostnames.
