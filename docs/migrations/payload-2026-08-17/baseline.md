# Payload migration baseline

- Captured: 2026-08-17 11:23 Asia/Ho_Chi_Minh
- Git: local `main` at `7cdbb0969236ab4a8ac5df2b7ad55cf216f20994`, ahead 200 and behind 208 relative to `origin/main`
- Public site: `https://mdftungphat.com` on Vercel
- Legacy CMS: `tungphat-light-cms-production` / `https://cms.mdftungphat.com`
- Legacy D1: `tung-phat-leads` (`1af7dea0-3168-446d-be77-828c57d1e370`), 1,056,768 bytes
- Production R2: `tung-phat-media`, 13,252 objects, 10.6 GB
- Existing Payload D1: `tungphat-payload-cms`, 2,297,856 bytes
- Existing duplicate Payload R2: `tungphat-payload-media`, 9 objects, 1.04 MB
- Repository `.git`: 2.1 GB
- Root `node_modules`: 711 MB
- Legacy `cloudflare-cms`: 349 MB including local dependencies/state
- Content data directory: 78 MB

## Legacy D1 records

| Table/group | Count |
| --- | ---: |
| leads | 2 |
| lead status history | 4 |
| rate limits | 4 |
| analytics visitors | 130 |
| analytics sessions | 320 |
| analytics events | 1,163 |
| analytics aggregates | 168 |
| analytics sync status | 1 |
| CMS sessions | 15 |
| CMS login attempts | 0 |
| CMS Git objects | 0 |
| GBP connections/reviews/performance/keywords | 0 |
| managed reviews | 2 |
| review widget settings | 1 |

## Current content records

| Source | Count |
| --- | ---: |
| editorial products | 6 |
| articles | 3 |
| projects | 1 |
| service pages | 2 |
| supplier search records | 3,639 |
| public supplier color-code records | 2,910 |
| Thanh Thuy products | 348 |
| Ba Thanh products | 233 |
| An Cuong normalized export records | 7 |

## Emergency backup

- Source: production D1 `tung-phat-leads`
- File: `/Users/khaduy/Downloads/tungphat-cms-backup-20260817T112500+0700/tung-phat-leads.sql`
- Bytes: 953,021
- SHA-256: `4997629f9188504f37afec89c2a7832d84f278903a8b06c3b892a56692a1d71c`
- The SQL export is outside the repository and must not be committed.
