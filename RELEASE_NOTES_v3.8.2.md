# Local by Local v3.8.2 — Audit Remediation

- Removed viewport zoom restriction.
- Added meta description, canonical, Open Graph and Twitter metadata, favicon, robots.txt, sitemap.xml and 404.html.
- Removed duplicate CDN Leaflet CSS and JavaScript; retained local vendor copies.
- Deferred initial Chicago fetch until the user selects a destination.
- Removed automatic city JSON pre-cache from service-worker install.
- Corrected stale three-city initialization comment.
- Escaped dynamic venue IDs inside favorite/detail inline handlers.
- Updated header, VERSION.json, manifest and service-worker cache to v3.8.2.
- Left city JSON data unchanged pending City Database Validator v4.0.

## Deferred / risks

- A restrictive CSP would break existing inline event handlers and inline scripts. Migration to event listeners and external modules must precede CSP enforcement.
- Existing historical documentation and old fix filenames retain their original labels intentionally.
- `maskable` purpose is declared, but visual maskability of icon artwork has not been verified.
- No interactive live-browser, mobile, or accessibility certification has been performed.
