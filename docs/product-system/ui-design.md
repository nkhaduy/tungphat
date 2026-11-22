---
name: Tùng Phát material discovery UI
description: Current implementation reference for material-family discovery and detail pages.
colors:
  forest-950: "#062b1d"
  forest-900: "#073b28"
  forest-800: "#0b4d34"
  wood-500: "#b84d00"
  wood-600: "#963d00"
  surface: "#ffffff"
  copy: "#16211b"
  copy-muted: "#52615a"
typography:
  body:
    fontFamily: "Montserrat, Arial, sans-serif"
    fontWeight: 400
rounded:
  control: "0.375rem"
  material-card: "0.75rem"
spacing:
  card-gap-mobile: "0.75rem"
  card-gap-wide: "1.25rem"
  card-padding: "1rem"
  card-padding-wide: "1.25rem"
---

# Material discovery UI reference

## Overview

This is a scoped record of the implemented product UI, not a replacement for the brand or root design authority. It covers the homepage material section, `/san-pham/`, shared material cards and the 16 specific material-family pages. The two existing broad guides keep their URLs and incumbent template.

The existing identity remains practical and product-first: deep green, bright white surfaces, restrained orange actions, real material photographs and readable technical explanations. `PRODUCT.md` supplies the durable buyer and brand constraints; this document records their current visual implementation.

## Colors

The palette above comes from `app/globals.css` and `tailwind.config.ts`. Deep green carries material titles and primary actions; darker orange carries card detail links and the global focus outline. White is the effective neutral surface: the global stylesheet explicitly overrides several older warm/tinted background utility values to white. Do not infer a new cream or green page background from those component class names.

The finder and product index also use the existing Tailwind slate neutrals for text, borders and the selected dark filter button. This is an implemented local treatment, not a second brand palette.

## Typography

Display and body share the locally configured Montserrat stack, including Vietnamese glyph coverage. Material headings are extra-bold (800); body text is regular, with bold action labels.

- Material hero H1: `clamp(2.2rem, 4.5vw, 4rem)`, line height 1.12, tracking −0.035em.
- Homepage section heading: 30px, increasing to 36px at the small breakpoint. Material-card titles: 16px, increasing to 18px.
- Card descriptions: 14px with 24px line height. Detail introductions: 16px, increasing to 18px, with 32px line height and a 65ch maximum. Detail article content has a 72ch maximum.
- The product index H1 has its own observed scale: `clamp(2.25rem, 4.8vw, 4.3rem)`, line height 1.12 and tracking −0.05em.

## Layout

The shared container is at most 1240px wide, with total horizontal gutter 32px, reduced to 24px at widths up to 640px. Homepage and finder grids show two columns by default, three from 768px and four from 1280px. Gaps are 12px, increasing to 20px from 640px. Homepage material section padding is 64px vertically, increasing to 96px from 1024px.

Material detail heroes use one column below 1024px. Their visual order is H1 → material image and any credit → introduction → actions. At desktop sizes, text and actions occupy the left column, with the image on the right in a 1.05:0.95 grid. Header-aware top padding keeps content clear of the existing site header.

The detail body becomes an article plus a 19rem consultation aside at 1024px; the aside is sticky at 7rem. Related materials use one column, increasing to three at 640px. The product index retains its explanatory sections, brand catalogue links, quote requirements and the two broad-guide links around the finder.

## Elevation & Depth

Material cards are flat white surfaces with a light green border, which becomes darker on hover. These components add no resting card shadow. Separation comes from borders, spacing and image frames; the existing site shell retains its own header and contact treatments.

## Shapes

Material cards, detail image frames and the consultation aside use 12px corners. Controls inherit the existing 6px global radius. Material images always sit in a 4:3 frame with internal padding: 12px in cards and 16px, increasing to 24px, in detail heroes.

## Components

**Material card.** The shared `MaterialCard` supplies the image, linked title, explanatory text and an explicit “Xem chi tiết” link. Content padding is 16px, increasing to 20px. The detail link sits at the bottom of the flexible card body and has a minimum 44px target height. Image and text links lead to the same specific material-family route.

**Material image.** `MaterialImage` uses native responsive local WebPs and actual-width `srcset` descriptors. This is intentional for the static export, whose Next image optimizer is unavailable. `object-fit: contain` preserves board edges and material identity; avoid cover crops in these product frames. Hero images load eagerly with high priority; card images load lazily. Source, alternatives, dimensions and provenance come from `data/product-image-index.json` and the media manifest, rather than hardcoded component copies.

The latest user source restriction permits only gothanhthuy.com and bathanhtaybac.com, plus the two mandatory supplied MDF originals. Fifteen material families currently have images in that scope. Tràm has no identified photograph on those sites and remains an explicit source blocker. The clean Melamine crop is500×333 and is resolution-limited. Acrylic/Laminate are official catalogue depictions whose capture origin cannot be independently established. Veneer has a1200×675 primary face image from Ba Thanh Tây Bắc and a500×498 curled-sheet supplementary image from Thanh Thuỳ. No upsampling is used. See `media-table.md` for current evidence; earlier broader-source visual verdicts do not establish full acceptance of this restricted asset set.

**Finder.** Search and four wrapping filter buttons operate on the same shared material registry. Search has a programmatic label; filters expose `aria-pressed`; the result count uses a polite live region. Search and group filters combine. An empty result has a text explanation and a suggestion to use a shorter material name or the catalogue. Filters are 44px high and the search field is 48px high.

**Actions and interaction.** Detail quote and consultation actions are at least 48px high. Existing orange focus outlines are 3px with 3px offset. Card images scale gently to 1.025 over 200ms on hover only when motion is allowed. Reduced-motion rules remove image transitions and suppress the site's broader animation/transition motion. The existing fixed Zalo control remains part of the site shell on mobile and desktop.

## Do's and Don'ts

- Do maintain the shared registry in `lib/product-taxonomy.ts`; publication filtering applies across discovery surfaces. The current 16 families comprise 10 core/material groups, five surface groups and one accessory group.
- Do keep material-family discovery separate from individual colour-code lookup. A colour code alone does not establish core board, thickness, availability or price.
- Do edit reviewed family explanations through `lib/product-editorial.ts` and respect CMS publication ownership described in `architecture.md`. Do not introduce a second local route for a hidden CMS material.
- Do preserve full material subjects, source attribution, real native dimensions and the original MDF assets. Do not substitute unrelated boards, generated images or enlarged files to conceal resolution limits.
- Do preserve the incumbent brand and shared shell when extending this UI. Do not treat this scoped document as authorization to redesign other pages.

Review references for this implementation are `/tmp/tungphat-products-audit/mdf-hero-1440.png`, `mdf-hero-390.png`, `home-grid-isolated-1440.png` and `san-pham-1440.png`. The final UI review disposition was `shipUI`, with no P0/P1 findings and no Hallmark critical, major or minor findings. This records the supplied visual review outcome; it does not assert that the remaining source-resolution limit are resolved or that deployment has been verified.
