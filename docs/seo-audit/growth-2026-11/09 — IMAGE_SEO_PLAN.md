# Image SEO Plan

## Observed state

Google Search Console Web Performance export is not Image search. A separate Image search performance report was not retrieved. The historical GSC Search Appearance export through 31/10 has only 2 Product snippet impressions/0 clicks; this does not measure Google Images.

The production Melamine collection currently exposes 367 linked code/name records. The inspected first screen is a grid of text labels without visible swatch preview images. That is a user-selection gap and a possible image opportunity, not proof that Google Image traffic is available. The product-code pages and current media catalogue contain real assets for some codes; source/license and code match should be respected.

## Recommended sequence

1. Export GSC Search type=Image for 3 months/6 months, country, device, page and query; note data date, table cap and query coverage.
2. Inventory image source/license by supplier/code, dimensions, file size, existing alt text and where it appears. Keep provenance in the asset inventory; do not rename or replace assets in bulk.
3. Start with the top codes that have GSC clicks/impressions: MS 852 T and other observed exact-code cohort. Validate the image is the exact manufacturer surface/code, not a similar color. Keep a “no verified image yet” state instead of rendering a false swatch.
4. Use a limited thumbnail, responsive dimensions, lazy loading below fold and fixed aspect ratio. Keep the code/name as HTML text and link; a broken/missing image must not remove access to the code.
5. Add descriptive alt text with code/material only where image meaning is not redundant; do not use keyword lists. Give each image surrounding text that explains the product and source.
6. Record allowed usage rights, especially supplier catalogue images. Do not assume visible online image grants reuse rights.

## Validation plan

Measure Image impressions/clicks by code, image indexability and crawl status before/after a small cohort. Watch LCP, mobile payload, broken images and image dimensions. Compare the same product cohort with unchanged code pages, but report the result as observational. Do not create 367 large image cards in the initial load or build a separate image sitemap without evidence the current sitemap is failing image discovery.
