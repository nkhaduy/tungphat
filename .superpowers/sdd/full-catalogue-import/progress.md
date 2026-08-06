# SDD ledger — plan: /Users/khaduy/Downloads/tungphat-catalog-full-supplier-import/.superpowers/plans/full-catalogue-import.md

Baseline: `npm test` passed 60 files / 340 tests at commit 5daa18af070ef6987d77899c8ad92fbdfd18e739 with the three known source snapshot modifications present.

Task 1: in progress
Task 1 fix round 1: reviewer found dry-run flag propagation, redirect evidence, real second-run regression coverage, derived report totals, and exact-multiple pagination gaps.
Task 1 fix round 2: reviewer found changed-source dry-run used the persisted catalogue instead of the hypothetical import result.
Task 1: complete — commits 43e220d, 1b7200e, 03fef77; reviewer PASS with no remaining findings.

Task 2: in progress
Task 2 fix round 1: reviewer found hard discovery ceilings at 233/33, unsupported blanket non-product outcomes for unknown URLs, and importer idempotency coverage that missed volatile timestamp drift.
Task 2 fix round 2: scoped re-review confirmed dynamic counts and idempotency, but found route-only unknown classification still mislabels code-less family pages and new Laminate details are appended as Melamine.
Task 2: complete — commits e2c3c56, 2c614c8, 2c402f8; scoped re-review confirmed all findings addressed with no new Critical/Important breakage.
Task 3: in progress
Task 3 fix round 1: reviewer found preview URL validation/SSRF ordering, 429 retry/checkpoint and total-deadline gaps, unbounded unknown-length GETs, preview concurrency above the global cap, stale seed precedence, and an incomplete Pages file-count gate. Fixed and verified with 25 focused tests, full supplier tests, type/lint/image gates, and a production build whose `STATIC_OUTPUT` capacity check passed (2,664 files; largest 2,108,160 bytes).
Task 3: fix round 1/5 (6 addressed, 0 open; commit 521b8cf)
Task 3: minor (deferred): the pre-download capacity projection prefers an existing `out/` tree even if stale relative to `public/`; the postbuild `STATIC_OUTPUT` gate still validates the final deployment artifact.
Task 3: complete (commits e558607..521b8cf, review clean)
Task 4: in progress
Task 4: minor (deferred): taxonomy option counts are computed from the combined index rather than recomputed for the active supplier selection; verify in final review whether this is acceptable for the current filter interaction.
Task 4: minor (deferred): per-supplier/type assertions in the compact-index tests include hand-maintained totals even though aggregate source count is derived.
Task 4: fix round 1/5 (5 addressed, 0 open; commit e611d33)
Task 4: minor (deferred): the Task 4 report retains a stale sentence saying non-curated An Cường category paths remain non-indexable route claims; the fixed adapter correctly removes those dead claims.
Task 4: minor (deferred): legacy deep-link groups filter correctly but are not visually represented as active buttons in the material row.
Task 4: complete (commits 4a52b41..e611d33, review clean)
Task 5: in progress
Task 5: fix round 1 — reviewer found missing mandatory coverage matrix columns, non-executable/incomplete supplier runbook commands, and root-cause report rewrite without required headings/file:line evidence.
Task 5: fix round 1 complete — commit 56133bd; scoped re-review PASS with no Critical/Important findings. Sample discovery/listing/detail/checkpoint paths are isolated; coverage matrix, executable runbook, and root-cause evidence are restored. Minor deferred: new-supplier onboarding is procedural because no generic fourth-supplier CLI exists.
Task 5: complete — commits 874ea1d..56133bd; scoped review clean.
