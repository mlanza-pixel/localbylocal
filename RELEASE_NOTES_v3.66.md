# Local by Local v3.66 — Responsive CSS consolidation and audit fixes

- Corrected root cause of squeezed iPad cards: body max-width was capped at 600px. On tablets the layout now expands to 1180px.
- Replaced conflicting v3.63/v3.65 CSS files with one responsive stylesheet.
- Corrected malformed stylesheet link in index.html.
- Three equal venue columns on iPad, equal-height cards, bottom-anchored actions, consistent touch targets.
- Grid-spanning load-more and empty-state elements.
- Added accessible names to venue favorite controls.
- Self-diagnostics no longer ignores tiny visible targets and reports selectors and dimensions.
- Updated service-worker cache to v3.66.
- Preserved only the three city datasets and their Excel files.

## Verification limits
Static code, resource, archive and data checks completed. Full rendered iPad/iPhone browser diagnostics have not been certified in this environment. Do not treat this as an Apple HIG certification.
