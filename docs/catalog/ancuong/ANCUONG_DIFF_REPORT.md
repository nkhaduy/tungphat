# An Cuong Diff Report

The second representative pipeline run produced:

- `NEW`: 0.
- `UPDATED`: 0.
- `UNCHANGED`: 7.
- `MISSING_FROM_SOURCE`: 0.
- `INVALID`: 0.
- `DUPLICATE`: 0.
- `RELATION_CHANGED`: 0.
- `MEDIA_CHANGED`: 0.

Canonical catalogue, categories, taxonomy, relations, and media manifests remain stable on resume. Missing products are retained with status `missing`; the pipeline does not delete them automatically.

Diff identity uses source ID first, then canonical source URL, normalized product code, category, and source hash fallbacks. Relationship and media signatures are compared independently from normalized product facts.

