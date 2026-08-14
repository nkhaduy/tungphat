# Two-Branch Google Reviews Design

## Goal

Replace the current review section with a trustworthy two-branch Google review experience. The UI must resemble a polished Google/Trustindex embed while rendering only data synchronized from the Google Business Profile API.

## Chosen Direction

Use a custom Google-style embed rather than a third-party iframe. Google does not expose a review-widget iframe from a `share.google` URL, while the existing API integration provides the reviewer, rating, text, dates, owner reply, and profile-photo fields needed for a credible native component.

The section retains the current heading and brand typography. Below it, each Tùng Phát branch receives an independent review row:

- Branch 1: rating summary/profile panel on the left and a slow left-moving review rail on the right.
- Branch 2: a slow right-moving review rail on the left and rating summary/profile panel on the right.
- Branch 2 links to `https://share.google/sv4nkFEznsGsWhRAQ` unless the GBP API supplies a more canonical Maps URI.

Both branch rows have equal visual weight: identical summary dimensions, review-card sizing, rail height, typography, spacing, and responsive behavior. Branch 2 differs only in panel placement, movement direction, and branch-specific data; it must never appear smaller or secondary to Branch 1.

Desktop uses the opposing movement to distinguish the branches. Mobile and reduced-motion environments use manual horizontal scrolling without autoplay. Hover, focus, or expanded review content pauses the relevant desktop rail.

## Data Architecture

Extend the current GBP storage and synchronization model from one fixed connection to multiple locations under the authorized account. Each location keeps its own connection metadata, cached reviews, aggregate rating, review count, Maps URI, place ID, and synchronization state.

The public endpoint returns a collection of branch payloads rather than a single location payload. Every branch payload has an independent `ready`, `empty`, or `error` state so one failing branch does not hide valid data from the other branch.

The frontend maps these real fields when present:

- reviewer display name
- reviewer profile photo URL
- star rating
- create and update timestamps
- review comment
- owner reply
- branch Maps URL
- aggregate rating
- aggregate review count

No sample review, placeholder reviewer, invented aggregate, or fabricated photo appears after loading. Missing optional values use safe UI fallbacks or are omitted.

## Review Ordering

Within each branch, sort reviews deterministically by content completeness before recency:

1. Reviews with substantive written comments, ordered by normalized comment length descending.
2. Short written reviews.
3. Rating-only reviews with no comment.
4. Ties use the latest update/create timestamp first.

This ordering surfaces detailed, useful reviews without changing their text or filtering by sentiment. Rating-only reviews remain visible but appear later in the rail.

## Components

`GoogleReviews` owns fetching, caching, top-level states, and branch selection.

`BranchReviewRow` renders one branch summary and its review rail, with a direction prop controlling desktop motion.

`RatingSummary` renders branch name, average rating, review count, stars, Google identity mark, and the external Google link.

`ReviewCard` renders the real profile photo when supplied. If the image is absent or fails, it renders a branded circular initial fallback. The card includes reviewer name, formatted date, accurate star count, written content, optional owner reply, and a subtle Google source footer.

Long comments clamp to five lines initially and expose an accessible `Xem thêm`/`Thu gọn` control. Short comments determine their own natural card height; the layout does not force large empty areas. Rating-only cards use a compact presentation.

## Loading, Empty, And Error States

The initial section renders polished skeleton summaries and cards to avoid layout shift. Each branch then resolves independently:

- `ready`: render aggregate and real reviews.
- `empty`: show a concise message and a link to the real Google profile, without empty cards.
- `error`: preserve the branch panel and show a compact retry-safe message.

Session caching remains optional and must never block a fresh API request. Invalid cached data is ignored safely.

## Motion And Accessibility

Desktop rails use slow linear movement only when enough cards exist to create a seamless loop. Duplicate DOM items used for the visual loop are hidden from assistive technology and cannot receive focus. The source reviews remain represented once in the accessibility tree.

Autoplay pauses on hover and keyboard focus. `prefers-reduced-motion` disables autoplay. Mobile uses touch-friendly horizontal scroll with snap points. Buttons and cards have visible focus states, external links identify their destination, star ratings have numeric accessible labels, and profile images use appropriate reviewer alt text.

## Responsive Layout

- Large desktop: two-column branch rows with summary and review rail.
- Tablet: narrower summary panel and two visible cards where space permits.
- Mobile: summary above its manually scrollable one-card-wide rail for both branches.

The section stays within the existing container and color tokens so no neighboring section changes visually.

## Verification And Delivery

Add focused tests for data mapping, ordering, fallbacks, state handling, branch isolation, expansion controls, external URLs, and reduced-motion behavior. Run lint, typecheck, unit tests, production build, and relevant Playwright checks.

Deploy both the CMS/API changes and the website through the existing Cloudflare production workflow. After deployment is ready, verify `https://mdftungphat.com` in a real browser at desktop and mobile widths, including both branch rows, live review data, profile images/fallbacks, Google links, console errors, and failed network requests.
