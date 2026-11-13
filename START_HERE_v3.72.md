# Local by Local v3.72 — 48-column test release

1. Extract this complete ZIP to a clean directory and serve over localhost or GitHub Pages.
2. Load Chicago, New York City, and Los Angeles and generate 3-day itineraries.
3. Compare `cities/*_48_COLUMN_v3_72.xlsx` against `cities/*.json` using ID and `Suggested_Visit_Duration_Minutes`.
4. Run `node test_v372_48_column.js` for runtime integration checks.
5. The original `cities/*_DISCOVERED_MAX_WITH_IDS.xlsx` files remain unchanged as historical inputs.
6. All generated durations are category-based estimates; hours and travel time are not independently verified.
7. The JSON exports contain the 48 official schema fields plus existing app-specific fields; these are NOT strictly 48-key JSON records.

Version: Local by Local v3.72. Data contract: City Database Validator v4.0, 48 columns.
