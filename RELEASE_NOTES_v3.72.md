# Local by Local v3.72 — City Validator 4.0 / 48-column compatibility

- Uses City Database Validator v4.0 field `Suggested_Visit_Duration_Minutes` (column AV).
- All three production-sized city JSON files now include the field. Values are provisional category estimates, NOT verified venue-specific durations. Unknowns are null.
- Planner uses duration when valid (integer 10–480); otherwise falls back to slot default. It rejects stops that would overlap the next fixed slot and rejects stops outside clearly incompatible time ranges. It may leave slots unfilled instead of fabricating a schedule.
- App still accepts older 47-column JSON without the field.
- Three 48-column XLSX fixtures and JSON fixtures are included for reproducible testing. The original legacy XLSX files are retained untouched for comparison.
- No real travel-time routing, live opening-hour verification, browser/device QA or GitHub deployment is claimed.
