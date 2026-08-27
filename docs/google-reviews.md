# Google Reviews data path

The public `/api/gbp/reviews` endpoint is served by the Payload CMS Worker. It queries
Google Places API (New) Place Details for both verified Place IDs:

- `ChIJ6dw2A6YndTERr5eaiym-l-M` (Chi nhánh 1)
- `ChIJjWMBUikndTERNFK1M-j02ZY` (Chi nhánh 2)

The request uses the `GOOGLE_PLACES_API_KEY` Cloudflare Worker secret (the aliases
`GOOGLE_MAPS_API_KEY` and `GOOGLE_API_KEY` are accepted for migration). Places API
returns at most five reviews per Place ID; this is not the complete review history.
The endpoint preserves each branch's independent rating and `userRatingCount`, and
never calculates a combined rating.

Payload review rows are not a production source. Only rows written by this adapter,
with `sourcePayload.provider = google-places-api-v1`, qualify as a last-successful
cache. Legacy/manual rows (including rows whose old `source` field says `google`) are
ignored. If one Google request fails, the other branch still renders; a failed branch
uses its last Google-derived cache or an empty/error state. No HTML scraping or static
review fixture is used.

The upgrade path to the Google Business Profile API is the existing `gbp-connections`
collection. When OAuth access is provisioned, the adapter can replace the Places
fetcher with `accounts.locations.reviews.list` while retaining the same branch payload
and provenance-gated cache contract.
