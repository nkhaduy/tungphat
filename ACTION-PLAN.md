# SEO/GEO action plan

## P0 — release gates

- Keep the after-build audit green: no invalid canonical, duplicate core metadata, broken internal link, schema parse error, sitemap error or accidental indexable thin page.
- Deploy `/robots.txt`, `/sitemap.xml`, `/llms.txt` and `/knowledge.json` together with the application release.
- Set `INDEXNOW_KEY` only in the deployment environment and verify the key URL before submitting changed URLs.

## P1 — evidence and authority

- Verify NAP, service area, opening hours and supplier relationships from business records.
- Replace placeholder specifications and generic images with approved first-party evidence.
- Publish the three drafted knowledge pages after technical review, then link them from the relevant material/CNC pages.
- Publish the first consented CNC case study and use it as the canonical project evidence page.

## P2 — information gain

- Add a validated material comparison table, dimensions/thickness reference, CNC capability matrix and material selector.
- Use one source dataset to drive page copy, JSON-LD, `knowledge.json`, sitemap and internal search.
- Re-run the 100-query AI-search set after each meaningful content release and record impressions/citations without scraping restricted services.

## Release checklist

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:links
npm run audit:seo
npm run validate:schema
```

Then verify production HTTP headers, sitemap, robots, canonical URLs and the external Search Console/Bing crawler reports.
