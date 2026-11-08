# Local Like a Local — PWA Production Release v3.49

## Package Overview
This distribution archive contains the complete, production-ready Progressive Web Application (PWA) incorporating all 8 application screens and the dual-format JSON parser.

### Core Fixes Included:
1. **Bulletproof Splash Screen Lifecycle:** Solves the frozen splash/flash screen issue by checking `document.readyState`, running an immediate progress bar animation, providing a guaranteed 1.6s timeout, and enabling a manual tap-to-dismiss overlay.
2. **Restored Missing Screens from v3.47 Matrix:**
   - Screen 1: Splash Screen Overlay & Welcome Hero
   - Screen 2: Legal & Informational Disclaimer (`#screen-legal`)
   - Screen 3: 4-Step Interactive Walkthrough Carousel (`#screen-onboarding`)
   - Screen 4: Regional Cities Directory (`#screen-cities`)
   - Screen 5: Directory Browser with Smart Filters (`#screen-browser`)
   - Screen 6: Trip Customizer & Generated Itinerary (`#screen-prefs` & `#screen-itinerary`)
   - Screen 7: Saved Favorites with Personal Notes & PDF Export (`#screen-favorites`)
   - Screen 8: Help Center & System Diagnostics (`#modal-help`)
   - Component: Detailed Venue Card Popup (`#modal-detail`)
   - Component: Sticky Bottom Navigation Bar (`Cities`, `Browse`, `Favorites`, `Itinerary`)
3. **Dual-Format JSON Normalizer:** Seamlessly parses both the 40-column format (`palm_springs.csv` standard with `Address_Street`, `Local_Score`, native booleans) and legacy formats (`baltimore.txt` with `Address`, `Local Score`, `"TRUE"`/`"FALSE"`).
4. **Verified Runtime Datasets:** Includes Palm Springs (176 places), Baltimore (500 places), Madrid (500 places), and Paris (500 places) in `./cities/`.

## Deployment Instructions
- **Web / PWA Hosting:** Unpack into any web directory or deploy directly to GitHub Pages, Netlify, or Vercel.
- **Mobile Standalone:** Open in Safari (iOS) or Chrome (Android) and tap **"Add to Home Screen"**.
- **Capacitor Mobile Native:** Wrap with `@capacitor/ios` and `@capacitor/android` using `webDir: "dist"`.
