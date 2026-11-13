# Local by Local v3.73.1 — Single Venue Map Hotfix

Fixed a regression introduced in v3.73: clicking **View on Map** from Venue Details immediately closed the selected map because the generic toggle handler interpreted an active selected venue as a close request. The button now opens map mode explicitly, keeps the selected venue, and renders one venue pin/card. The circled X on the map returns to that venue's details.

Validation: inline JavaScript syntax checked using Node.js. Chromium browser interaction could not be completed in this environment because both local file and localhost navigation were blocked by browser administrator policy. Requires real-device regression test before production deployment.
