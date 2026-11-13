# Local by Local v3.71 — Flexible Time-of-Day Scheduler

- Eight daily slots: 8:30 breakfast, 9:30 morning activity, 11:00 late-morning activity, 12:45 lunch, 2:15 afternoon activity, 4:00 treat, 7:00 dinner, 9:30 nightlife.
- Parks and museums may be morning or afternoon activities. Opening-hours constraints are applied conservatively when simple OSM time ranges exist.
- Estimated durations: 30–90 minutes, with local proximity and category variety in selection. No real route-time computation.
- Ice cream/dessert is a treat, never a dinner substitute; bakery and bar exclusions remain; string FALSE stays false.
- One day at a time, numbered pins, synchronized stop list and day directions retained.
- Unknown or weekday-dependent hours are not represented as verified. Travel dates are not supplied to the planner.
- No source city JSON changed; 47-column validator schema not changed in this app release.

## City Validator follow-up
To improve accuracy, the City Database Validator should export: six approved suitability flags (Morning, Lunch, Afternoon, Drinks, Dinner, Nightlife), structured weekly hours with provenance/confidence, meal-service classification, suggested visit duration, and exceptional opening hours. The app can consume six flags today, but its eight activity slots are derived from those six flags plus taxonomy. Do not silently overwrite existing 47-column schema; map new evidence to an extension or documented export contract.

## Tests
- Node syntax checks of scheduler and inline HTML scripts.
- Regression checks of museums/parks before 3 PM, dessert/bakery/bar exclusions, FALSE handling, closing-hour filtering, uniqueness.
- Five-day itinerary generation across Chicago 3747, NYC 3944, LA 2835.
- No real-device browser walkthrough, holiday hours validation, or travel-time validation performed.
- Not deployed to GitHub.
