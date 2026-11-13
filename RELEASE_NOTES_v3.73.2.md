# Local by Local v3.73.2 — Venue and Favorites Flow

- Browse directory now has one instruction: "Tap a venue card to see more details." Removed repeated hints from venue cards.
- Renamed header action to "City Guide".
- Removed Get Directions from venue details and single-venue map, avoiding inappropriate navigation from a remote city. The itinerary day-directions action is unchanged.
- Favorites now filters the visible saved venue list to the selected city and offers "Show Saved on Map" for saved venues in that city with coordinates. Saved favorites in other cities remain in device storage.
- Closing a venue details modal from the directory restores list-only view; closing the single-venue map also restores list-only view. Single-venue map X continues to return to venue details.
- No city datasets were changed.

Validation: JavaScript syntax and ZIP integrity checks. Interactive mobile and browser end-to-end tests have not been run; test before deploying to production.
