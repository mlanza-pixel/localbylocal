# Local by Local v3.63 — Hybrid Navigation and Responsive Fixes

## Changes
- Three cities only: Chicago 3,747, Los Angeles 2,835, NYC 3,944; 10,526 total records.
- Retains 47-column Excel source workbooks and full city JSON datasets.
- Venue details now provide **View on Map** (internal Leaflet) and **Get Directions** (external Google Maps or Apple Maps).
- External directions search by venue name + address instead of coordinate-only lookup; a listing match is not guaranteed without a verified Google Place ID.
- Navigation provider can be selected in venue details and is remembered locally.
- Fixes favorites self-diagnostic using `favoritesList` objects, not undefined `favorites`.
- Adds responsive touch targets >=44 CSS px for buttons and common interactive controls, narrow screen wrapping, tablet grids, safe area handling.
- Bumps service worker cache to v3.63.

## Limits / remaining validation
- Browser-based interactive testing on actual iOS/Android hardware has not been performed.
- 44 CSS pixels is a pragmatic web touch-target approximation, not a proof of Apple 44-point compliance in every rendering environment.
- Map only renders first 350 venue markers for performance; selecting an unrendered venue centers map without adding its pin.
- Provisional descriptions are not independent venue reviews. Unverified scores remain unrated.
- GitHub Pages live site is NOT modified by this ZIP.
