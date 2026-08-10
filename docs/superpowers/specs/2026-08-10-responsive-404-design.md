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
- Make the 404 hero tall enough that the footer starts below the initial viewport on desktop, tablet, and mobile.
- Render the artwork as a responsive `<picture>` background using `/images/404-mobile.webp` below the tablet breakpoint and `/images/404-desktop.webp` from tablet upward.
- Let the artwork cover the available hero area with a centered focal point. Use a slightly adjusted mobile position so all three digits remain visible.
- Place the content near the lower center of the hero, separated from the image with a vertical gradient rather than a card.

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
- Extend the existing 404 viewport coverage to include tablet.
- Run the focused Playwright 404 tests, lint, typecheck, production build, and `git diff --check` before pushing `main`.
- After the Vercel Git deployment starts, verify the production 404 response, copy, CTA destinations, and deployed commit.
