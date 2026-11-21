# Product system implementation plan

Goal: one consistent catalogue for homepage, navigation, material listing and root detail routes, preserving the existing Next.js static export, Payload content and supplier catalogue.

User-authorized scope: implement locally; no production CMS/media writes, push or production deployment. Preserve all pre-existing workspace edits. Keep the two original sanpham-media files untouched. Apply the existing tung-phat-writing skill.

- [x] Audit: 12 homepage cards; 6 CMS entries (4 specific materials + 2 guides); split MDF/HDF and Okal/MFC; retain tràm and PVC Film/PET already defined. Result: 16 concrete groups plus 2 existing guides.
- [x] Central registry: compact client-safe card metadata; server-only editorial sections and technical references; explicit media provenance and completeness status.
- [x] Integrate: deterministic enrichment of existing CMS entries by slug; append only missing published material guides; CMS draft/noindex and discontinued state remain authoritative. Document exactly which fields are code-owned so there is no competing public record.
- [x] UI: reuse ProductLanding and brand primitives; shared responsive material image/card; accurate un-cropped imagery; detail links, contextual related materials and existing catalogue/quote actions.
- [x] SEO: reuse metadata/root routing/sitemap; CollectionPage for material families, no invented SKU/offer/rating; unique copy and correct canonicals.
- [ ] Verify: focused failing regression tests before implementation; full repository verify; browser desktop/mobile direct URL + refresh, images, links, canonical after hydration, contact and catalogue regression; screenshot inspection; bounded Hallmark/Web Quality review.
- [ ] Deliver: local preview and report including every material, route, image provenance, test evidence and unresolved licensing/material-specific image blockers. Do not claim complete unless every group has an appropriate licensed photo.

Image acceptance: exact material identity + commercial reuse rights + usable resolution + visual inspection. Existing presence on a supplier site or Google Images is not a license. Never replace absent material photography with AI images, textures of another substrate, unrelated interiors, or generic boards.

Final source restriction: only gothanhthuy.com and bathanhtaybac.com plus the two mandatory MDF originals. Current result:16 pages,15 material families with permitted images; tràm image blocked. Validation was run and failures remain explicit:3 unit assertions and4 browser acceptance cases detect that missing image. Final evidence and the full source table are in report.md; whole-task acceptance is not PASS.
