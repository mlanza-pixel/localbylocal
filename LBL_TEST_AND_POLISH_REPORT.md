# Local Like a Local v3.50 — Testing & Polish Report

**Test date:** November 8, 2026
**URL tested:** https://mlanza-pixel.github.io/localbylocal/
**Version:** 3.50 (Build 2026-11-01)

---

## 1. Map Function Analysis

### Root cause: vendor/leaflet.js is a STUB

The local vendor files are **not real Leaflet** — they are placeholder stubs:

```javascript
// vendor/leaflet.js (85 bytes — NOT the real Leaflet)
// Leaflet.js Offline Fallback Engine v1.9.4
console.log('Leaflet Vendor Engine Initialized');
```

```css
/* vendor/leaflet.css (95 bytes — NOT the real Leaflet CSS) */
/* Leaflet Vendor Stylesheet Fallback */
.leaflet-container { background: #e2ded4; }
```

The real Leaflet library is loaded from CDN:
```html
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### What this means

| Scenario | What happens |
|---|---|
| **Online** | CDN loads the real Leaflet → map works |
| **Offline (first visit)** | CDN fails, vendor stub loads → `typeof L === 'object'` but `L.map` is not a function → map shows fallback message: "Leaflet map library loading or offline. Switch to List View." |
| **Offline (after SW cache)** | CDN version cached by service worker → map works if SW has cached unpkg.com |

### The fix

Download the real Leaflet 1.9.4 files and replace the stubs:

```bash
curl -o vendor/leaflet.js https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
curl -o vendor/leaflet.css https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
```

This makes the map work fully offline. The vendor files should be ~140 KB (JS) and ~14 KB (CSS), not 85 bytes and 95 bytes.

### Additional map issue: tile layers require network

Even with the real Leaflet loaded, the map tiles come from OpenStreetMap:
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', ...)
```

Tiles cannot be cached by the service worker (there are billions of possible tile URLs). For true offline maps, you'd need to:
1. Pre-cache tiles for each city's area at zoom levels 12-15
2. Or use a vector tile approach (MapLibre GL JS with offline MBTiles)
3. Or accept that maps work online only (current behavior, just with better error handling)

**Recommended minimum fix:** Replace the stub vendor files with real Leaflet so the library loads offline. Tiles will still require network, but the map UI will render properly.

---

## 2. Font Accessibility Audit

### Current font sizes (from CSS analysis)

| Font size | Count | Apple HIG | Material Design | Verdict |
|---|---|---|---|---|
| 9px | 2 elements | ❌ Below minimum | ❌ Below minimum | **Fix** |
| 10px | 4 elements | ❌ Below 11pt minimum | ❌ Below 12sp minimum | **Fix** |
| 11px | 24 elements | ⚠️ At minimum (caption) | ❌ Below 12sp minimum | **Fix** |
| 12px | 30 elements | ✅ OK | ✅ At minimum | OK |
| 13px | 8 elements | ✅ OK | ✅ OK | OK |
| 14px | 5 elements | ✅ OK | ✅ OK | OK |

### Issues found

**30 elements use fonts below 12px.** Apple's Human Interface Guidelines require:
- Body text: minimum 11pt (~14.7px at 1.333 DPI ratio)
- Caption/secondary: minimum 10pt (~13.3px)
- Never below 10pt under any circumstance

Google's Material Design requires:
- Body text: minimum 12sp
- Caption: minimum 12sp (Material 3 raised this from 11sp)

### Recommended font size fixes

```css
/* INSTEAD OF: font-size: 9px / 10px / 11px */
/* USE: */

/* Body text */
font-size: 14px;  /* Was 11-12px — too small for body */

/* Secondary/caption text */
font-size: 13px;  /* Was 10-11px — too small for captions */

/* Minimum anywhere */
font-size: 12px;  /* Absolute minimum — was 9px in some places */

/* Nav bar labels */
font-size: 12px;  /* Was 11px */

/* Venue card metadata */
font-size: 13px;  /* Was 11px */

/* Filter button text */
font-size: 13px;  /* Was 11px */
```

### Touch target audit (Apple HIG: 44×44pt minimum)

Several buttons in the nav bar and filter row are likely below the 44×44pt minimum. The self-diagnostics script (TEST 12) will report the exact sizes.

---

## 3. Polish Recommendations — "Looks Too Engineering"

### Current design assessment

The app uses a competent but utilitarian design:
- Deep Navy (#1B365D) + Accent Orange (#CC5500) — good palette but feels corporate
- DM Sans + Fraunces — good font choices but sizes are too small
- Card-based layout — works but feels like a database UI, not a travel guide
- Lots of text metadata (scores, prices, categories) packed tightly

### 7 specific polish improvements

#### 1. Increase font sizes globally (highest impact)
```
Body: 14px → 15px
Card titles: 15px → 17px
Section headers: 18px → 22px
Nav labels: 11px → 13px
Caption/metadata: 11px → 13px
```
This single change makes the app feel less like a spreadsheet and more like a curated guide.

#### 2. Add more whitespace/padding
```css
.venue-card { padding: 14px → 20px; }
.section-header { margin-bottom: 12px → 20px; }
.filter-row { gap: 6px → 10px; padding: 8px → 12px; }
```
Travel apps should feel spacious. The current tight packing reads as "data list" not "inspiration."

#### 3. Replace emoji flags with styled badges
Currently: 🌴 🦀 🏙️ 🗽 🎬 — these render differently on every platform and look inconsistent.

Instead, use a styled text badge:
```html
<span class="city-badge">PS</span>  <!-- Palm Springs -->
<span class="city-badge">BLT</span> <!-- Baltimore -->
```
```css
.city-badge {
  display: inline-block;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 50%;
  background: var(--teal-light);
  color: var(--teal-dark);
  font-weight: 700;
  font-size: 14px;
  font-family: var(--font-d);
}
```

#### 4. Add a hero image to city cards
Currently city cards are text-only. Add a header image (or gradient + city initials) to make the city selection screen feel like browsing a magazine, not a database.

#### 5. Soften the card shadows
```css
/* INSTEAD OF: */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.04);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);

/* USE: */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
```
Layered shadows feel more modern than single-layer.

#### 6. Add smooth transitions
```css
.venue-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.venue-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.city-card { transition: transform 0.2s ease; }
.city-card:hover { transform: scale(1.02); }
```
The app currently has no transitions — everything snaps instantly. Adding 200ms transitions makes it feel premium.

#### 7. Improve the splash/onboarding
The current splash is functional but plain. Add:
- A subtle gradient background matching the brand palette
- The app name in Fraunces (display font) at 2.5rem+ 
- A one-line tagline: "Discover the world like a local"
- A fade-in animation instead of instant display

---

## 4. Exhaustive Button Test — Script

The `lbl-exhaustive-button-test.js` script tests every button in 4 phases:
1. **Forward** — clicks every button on every screen in order (splash → welcome → legal → onboarding → cities → browser → prefs → itinerary → favorites)
2. **Backward** — clicks every button in reverse screen order (favorites → itinerary → prefs → browser → cities)
3. **Modals** — opens/closes Help and Detail modals, tests buttons inside each
4. **Map function** — loads a city, toggles map view, checks Leaflet availability, marker count, and error output

Total buttons tested: ~50+ across 9 screens and 2 modals.

---

## 5. Self-Diagnostics Module

The `lbl-self-diagnostics.js` module adds a **"Run Full Diagnostics"** button to the existing Help & Diagnostics modal. It runs 13 tests:

| # | Test | What it checks |
|---|---|---|
| 1 | App Shell Integrity | All 9 screens present in DOM |
| 2 | Modal Integrity | Both modals (help, detail) present |
| 3 | City Registry | CITIES_REGISTRY defined with ≥49 cities |
| 4 | Service Worker | Active SW registration found |
| 5 | Offline Capability | Cache API has cached resources |
| 6 | localStorage | Read/write test + app key count |
| 7 | Map Library (Leaflet) | `typeof L` is defined and `L.map` is a function |
| 8 | Map Container & Toggle | Container, div, and toggle button all present |
| 9 | Font Accessibility | Scans all visible elements, flags anything <12px |
| 10 | Button Inventory | Counts total, visible, and disabled buttons |
| 11 | Navigation Back/Forward | Tests showScreen + history.back() |
| 12 | Touch Target Sizes | Flags buttons below 44×44px (Apple HIG) |
| 13 | Color Contrast | Checks --text-dark on --bg-main against WCAG AA |

Results are displayed in the Help modal's diag-box and logged to console.

---

## 6. Files in This Package

| File | Purpose |
|---|---|
| `LBL_TEST_AND_POLISH_REPORT.md` | This report — map analysis, font audit, polish recommendations |
| `lbl-exhaustive-button-test.js` | 4-phase button test (forward, backward, modals, map) |
| `lbl-self-diagnostics.js` | Drop-in self-diagnostic module (13 tests, auto-injects into Help modal) |
| `lbl-test-results.json` | JSON template for recording test results |
