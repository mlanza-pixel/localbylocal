# Local by Local v3.70 — Time-of-Day Itinerary Gating

## Changes
- Builds each day from five activity slots: Morning 8:30, Lunch 12:30, Afternoon 15:00, Dinner 19:00, Nightlife 21:30.
- Applies negative taxonomy exclusions before considering boolean flags. Ice cream/dessert is not breakfast or dinner; bakeries are not dinner/nightlife; bars are not breakfast or primary lunch/dinner.
- Explicitly normalizes TRUE/FALSE values; the string `FALSE` cannot be interpreted as truthy.
- Excludes explicitly FALSE suitability flags, and prevents reusing a venue across days.
- Retains one map per selected day, numbered pins, day selector, and directions for the current day.
- Leaves a slot unfilled when no suitable venue is available.
- Preserves the original three-city datasets; does not rewrite source data.

## Important data-quality limitations
The three pilot city JSON datasets have no Morning/Lunch/Afternoon/Dinner/Nightlife suitability flags. The runtime therefore uses conservative provisional taxonomy classification to provide usable itineraries. It does NOT verify opening hours for a specific travel date, reservations, accessibility, or travel time. The interface warns that hours are unverified. Once the City Database Validator exports approved flags, the app honors explicit TRUE/FALSE values.

## Testing
- Node syntax checks for inline scripts and the time-slot engine passed.
- Synthetic test covered desserts, bakeries, bars, FALSE strings, duplicate prevention, and two-day planning.
- Five-day planning executed on Chicago (3747), NYC (3944), LA (2835) without runtime errors.
- Interactive browser/iPad/Android tests remain outstanding.
- The app is not deployed; upload this ZIP's contents to your GitHub Pages repository to publish.
