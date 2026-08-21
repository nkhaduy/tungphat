# Canonical Promotion - 2026-08-21

## Source relationship

- Production Vercel source SHA: `1f2cc6fc529d5a87e353515928e26e479804994f`.
- That SHA is an ancestor of `recovery/deployed-canonical-20260821`.
- Recovery commits `95ff771` and `eba83db` preserve repository guidance and five deployed-only content configuration files; they do not change application runtime behavior beyond restoring tracked content/configuration.
- The recovery branch also contains the previously verified Payload CMS migration and supplier/catalogue recovery history beginning at `1f2cc6f`.
- `origin/main` has newer post-recovery Ba Thanh media/lightbox work and must be merged without discarding that work.

## Recovered deployed-only content

These files were present in the deployed Vercel build but absent from editable Git source. They are legitimate source content/configuration and remain tracked:

| Path | SHA-256 in deployed recovery and repository | Purpose | Decision |
| --- | --- | --- | --- |
| `content/categories/brands.json` | `a0fcf2060f5351f3e21d022d6379415087e7e23e911d095d385cf5a17786db30` | Catalogue brand/category definitions | Keep; source content |
| `content/categories/materials.json` | `0f5c17a962d5fcc4b55a3c824241c9448d56f5cdcce4ec42f9bbfec1be8402cb` | Catalogue material/category definitions | Keep; source content |
| `content/settings/business.json` | `5150a9c13f86f93d27c5dd293054b7ea24996fec7e4fb932c2b9129a7ec39c17` | Business identity and contact settings | Keep; source configuration |
| `content/settings/seo.json` | `5b7463a2a81a255e209cd962aca7c3151b840067e5e08effd62fb32dd5b28748` | Site SEO defaults | Keep; source configuration |
| `content/settings/static-pages.json` | `b7a27570c2c39ce103eb889e18c56aa0f1298794a462be61561a2a3cedd346bb` | Static page content/settings | Keep; source configuration |

The files are small JSON source documents, not generated build output, deployment dumps, credentials, or forensic artifacts. Their contents are validated by the repository content and build checks.

## Promotion intent

The recovered branch is the best editable source corresponding to the deployed application. Promotion to `main` must preserve the recovery commits and merge any newer legitimate `origin/main` changes. No force push, CMS deployment, D1 mutation, or R2 mutation is part of this source promotion.
