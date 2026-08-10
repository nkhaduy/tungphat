# Responsive 404 Page Design

## Goal

Replace the generic two-column 404 page with a focused, cinematic error state that makes the existing wooden 404 artwork the visual centerpiece and gives visitors two clear recovery actions.

## Selected Direction

Use a dedicated full-bleed hero inside the existing site shell. The horizontal artwork fills desktop and tablet layouts, while the portrait artwork fills mobile layouts. A restrained dark green-black overlay improves contrast without hiding the illuminated wood texture.

Two alternatives were considered and rejected:

- Reusing `PageHero` would preserve code reuse but keep the image too small and the page visually similar to normal content pages.
- A standalone page without the site header and footer would feel immersive but would remove familiar navigation and conflict with the rest of the public site.

## Layout

- Keep the existing site header, footer, skip link, and mobile quick actions.
- Make the 404 scene taller than the viewport and keep its visual stage sticky below the site header.
- Render the artwork as a responsive `<picture>` background using `/images/404-mobile.webp` below the tablet breakpoint and `/images/404-desktop.webp` from tablet upward.
- Let the artwork cover the available hero area with a centered focal point. Use a slightly adjusted mobile position so all three digits remain visible.
- Place the heading's visual center exactly at the vertical center of the sticky stage on initial load; position the two actions beneath it without shifting that heading anchor.
- While scrolling, keep the artwork fixed in the sticky stage and let the heading/actions move upward with document flow.
- Size the outer scene so the footer begins entering the viewport when the heading approaches the bottom edge of the sticky header; at that point the visual stage releases and scrolls away.

## Content And Actions

- Use the heading `Trang này không tồn tại`.
- Remove breadcrumbs, eyebrow text, and the explanatory paragraph to keep the page direct.
- Primary action: `Về trang chủ`, linking to `/`.
- Secondary action: `Xem catalogue`, linking to `/catalogue/`.
- Both controls meet the existing minimum touch target, expose visible keyboard focus, and stack on narrow phones.

## Visual Treatment

- Use a dark forest overlay with a lighter transparent center so the glowing 404 remains prominent.
- Add a stronger bottom gradient behind the text and buttons.
- Keep typography and button styling aligned with the current Tùng Phát design system.
- Avoid decorative motion; the large image and light contrast provide enough visual impact and reduced-motion behavior stays unchanged.

## Responsive Acceptance

- Mobile: 390x844 and 430x932, portrait artwork, full-width stacked actions, no horizontal overflow.
- Tablet: 768x1024 and 1024x768, horizontal artwork, centered content, actions can sit in one row.
- Desktop: 1280x800 and 1440x900, horizontal artwork, footer remains below the fold, content and focal digits remain readable.

## Testing

- Add an end-to-end assertion for the exact heading and both recovery links.
- Check that the responsive `<picture>` exposes both image sources.
- Assert that the visual stage keeps the same viewport position while the heading moves upward, then releases as the footer enters.
- Extend the existing 404 viewport coverage to include tablet.
- Run the focused Playwright 404 tests, lint, typecheck, production build, and `git diff --check` before pushing `main`.
- After the Vercel Git deployment starts, verify the production 404 response, copy, CTA destinations, and deployed commit.
