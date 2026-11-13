# Local by Local v3.67 — Stable Homepage Navigation

- Opening the root URL always displays the Welcome homepage, with no blocking splash overlay.
- Header title returns to the homepage rather than the Cities directory.
- Home navigation uses the canonical root URL (no screen hash).
- Browser Back with no valid screen now returns to Welcome rather than Cities.
- Existing consent and onboarding gates remain in effect when choosing a city.
- Responsive CSS file, displayed version, and service-worker cache updated to v3.67.
- Three test city JSON files and corresponding XLSX datasets retained.

## Testing caveat
Static checks verify code references and syntax; actual Safari/iPad and browser interaction testing has not been completed in this environment.
