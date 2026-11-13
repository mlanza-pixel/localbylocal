# Local by Local v3.62 — Three-City Expanded Data Build

- Three cities only: Chicago (3,747), Los Angeles (2,835), Manhattan / NYC (3,944).
- Full 47-column Excel workbooks and matching JSON records with stable unique IDs.
- Description and Why Go text is **provisional**, generated from available listing/category data, not independently researched endorsements.
- Unknown Local Score / Hidden Gem Score remains null; the UI shows **Not rated**, not invented values.
- The hidden-gem filter returns only scored records, so currently it may return no matches.
- Initial list is limited to 60 venues with Load More to reduce browser freezes; map pins capped at 350 for responsiveness.
- Service worker cache version changed; city JSON fetched network-first when available.
- App is not published automatically; deploy all files to your hosting root to replace the current build.
- Manual cross-device browser testing is still recommended before production publication.
