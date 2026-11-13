# Local by Local v3.8.1 — Venue browsing and audit fixes

- 20 venue cards per batch rather than 60; sticky Load 20 more bar and smooth jump to first newly loaded card.
- Reset pagination when search/category/filter changes.
- Hide missing score and price values on directory, saved venue, and detail cards where updated.
- Hide boilerplate placeholder descriptions at display time without changing JSON datasets.
- Separate category semicolons visually and improve metadata spacing.
- Decorative favorite hearts hidden from screen readers; favorite buttons retain accessible names.
- Semantic Continue button on splash and improved legal action spacing.
- Pilot destination count uses cities with datasets; diagnostics count matches.
- New service-worker cache key for fresh deployment.

Testing: static checks and JS syntax only; interactive browser/mobile testing not certified. Data enrichment belongs to City Database Validator v4.0.
