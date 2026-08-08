# Floating Zalo Contact Button Design

## Goal

Replace the homepage's generic floating chat icon with a recognizable Zalo contact button that attracts attention without becoming distracting or covering important content.

## Scope

- Change only the floating contact link on the homepage.
- Preserve the existing Zalo destination, analytics event, link semantics, and accessible label.
- Keep the existing mobile contact bar as the primary mobile interaction; the floating button remains hidden below the `md` breakpoint.
- Do not change other Zalo links, navigation, contact forms, or page content.

## Visual Design

- Use the supplied Zalo artwork as the visible logo, prepared as a transparent web asset.
- Display it inside a 64px circular floating control on tablet and desktop.
- Use a thin white edge, a soft blue-tinted shadow, and a subtle outer pulse to separate the button from varied page backgrounds.
- On hover, lift and scale the control slightly while keeping the logo legible.

## Motion

- Run a short shake sequence of two to three small rotations, then remain still for most of a roughly four-second cycle.
- Keep movement restrained so the button reads as an invitation to contact rather than an alert.
- Disable the shake and pulse through the existing `prefers-reduced-motion` rule.

## Implementation Boundaries

- Add the optimized logo under `public/images/`.
- Add narrowly scoped animation classes and keyframes to `app/globals.css`.
- Update `app/page.tsx` to render the image instead of the Lucide chat icon.
- Avoid adding a client component or animation dependency; CSS is sufficient.

## Accessibility And Behavior

- Retain the existing descriptive `aria-label`.
- Treat the logo image as decorative because the link already has an accessible name.
- Preserve keyboard focus visibility and the existing external-link security attributes.
- Keep the click target at least 56px; the selected design uses 64px.

## Verification

- Add an end-to-end assertion that the homepage exposes the Zalo floating link on desktop and that it uses the branded image.
- Confirm it is hidden on a phone viewport where the sticky mobile action bar is present.
- Run the focused Playwright test, lint, type checking, relevant tests, production build, and `git diff --check`.
- Visually inspect desktop and mobile screenshots before deployment.

## Deployment

- Commit the verified implementation on `main` and push to `origin/main`.
- Vercel Git Integration deploys the public website automatically.
- Verify the production homepage after the deployment completes.
