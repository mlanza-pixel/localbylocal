/**
 * lbl-fast-test.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.52 — Fast Test (Under 60 seconds)
 *
 * Designed for iPad/iPhone via Safari Web Inspector.
 * Tests first 10 venues per screen (not all 500).
 *
 * Tests:
 *   1. App shell (9 screens)
 *   2. City load + dedup check
 *   3. 10 detail modals open/close
 *   4. 10 favorite toggles
 *   5. Map view toggle + markers
 *   6. Category filter
 *   7. Search
 *   8. Navigation forward + back
 *   9. Rapid filter chaos (10 cycles)
 *   10. Rapid modal chaos (10 opens)
 *   11. Font size check
 *   12. Touch target check
 *   13. Duplicate detection
 *   14. Diagnostics button presence
 *
 * Usage:
 *   Paste into browser console. Completes in ~45 seconds.
 */

(async function fastTest() {
  'use strict';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const results = [];
  const errors = [];
  const origError = console.error;
  console.error = function(...args) { errors.push(args.join(' ').slice(0,200)); origError.apply(console, args); };
  window.addEventListener('error', e => errors.push('Uncaught: ' + e.message));
  window.confirm = () => true; window.alert = () => {};

  function record(name, pass, detail) {
    results.push({ name, pass, detail });
    console.log(`%c[${pass ? 'PASS' : 'FAIL'}] ${name}: ${detail}`, `color:${pass ? '#128C7E' : '#D9534F'};font-weight:bold`);
  }

  console.log('%c═══ Local Like a Local — Fast Test (v3.52) ═══', 'font-size:14px;font-weight:bold;color:#1B365D');
  const start = Date.now();

  // 1. App shell
  const screens = ['screen-splash','screen-welcome','screen-legal','screen-onboarding','screen-cities','screen-browser','screen-prefs','screen-itinerary','screen-favorites'];
  const missing = screens.filter(id => !document.getElementById(id));
  record('App Shell', missing.length === 0, missing.length === 0 ? '9 screens present' : `Missing: ${missing.join(',')}`);

  // 2. City load + dedup
  try {
    await loadCityData(CITIES_REGISTRY[0]); await sleep(500);
    renderVenues(); await sleep(300);
    const count = allPlaces ? allPlaces.length : 0;
    const dedupInfo = window.__lblLastDedupInfo;
    record('City Load + Dedup', count > 0, `${count} venues loaded` + (dedupInfo ? `, ${dedupInfo.duplicatesRemoved} duplicates removed` : ''));
  } catch(e) { record('City Load + Dedup', false, e.message); }

  // 3. 10 detail modals
  let modalErrors = 0;
  const testCount = Math.min(10, allPlaces.length);
  for (let i = 0; i < testCount; i++) {
    try {
      openDetailModalByObj(allPlaces[i].ID); await sleep(100);
      closeDetailModal(); await sleep(50);
    } catch(e) { modalErrors++; }
  }
  record('Detail Modals (10)', modalErrors === 0, `${testCount} opened/closed, ${modalErrors} errors`);

  // 4. 10 favorite toggles
  let favErrors = 0;
  for (let i = 0; i < testCount; i++) {
    try { toggleFav(allPlaces[i].ID); await sleep(30); toggleFav(allPlaces[i].ID); await sleep(30); }
    catch(e) { favErrors++; }
  }
  record('Favorites (10)', favErrors === 0, `${testCount} toggled, ${favErrors} errors`);

  // 5. Map view
  try {
    toggleViewMode(); await sleep(1000);
    const visible = document.getElementById('browse-map-container')?.style.display === 'block';
    const hasInstance = !!mapInstance;
    const markers = mapMarkers ? mapMarkers.length : 0;
    const hasTiles = document.querySelectorAll('.leaflet-tile').length > 0;
    toggleViewMode(); await sleep(200);
    record('Map View', visible && hasInstance && markers > 0, `visible=${visible}, markers=${markers}, tiles=${hasTiles}`);
  } catch(e) { record('Map View', false, e.message); }

  // 6. Category filter
  try {
    currentCategory = 'Food'; renderVenues(); await sleep(200);
    const foodCount = document.querySelectorAll('.venue-card').length;
    currentCategory = 'All'; renderVenues(); await sleep(200);
    record('Category Filter', foodCount > 0, `Food=${foodCount}, All=${allPlaces.length}`);
  } catch(e) { record('Category Filter', false, e.message); }

  // 7. Search
  try {
    handleSearch('restaurant'); await sleep(200);
    const searchCount = document.querySelectorAll('.venue-card').length;
    handleSearch(''); await sleep(200);
    record('Search', searchCount > 0, `'restaurant'=${searchCount} results`);
  } catch(e) { record('Search', false, e.message); }

  // 8. Navigation forward + back
  try {
    showScreen('screen-cities'); await sleep(200);
    const citiesActive = document.querySelector('.screen.active')?.id === 'screen-cities';
    showScreen('screen-favorites'); await sleep(200);
    const favsActive = document.querySelector('.screen.active')?.id === 'screen-favorites';

    // Use lblGoBack if available, otherwise history.back()
    if (window.lblGoBack) {
      window.lblGoBack(); await sleep(300);
    } else {
      history.back(); await sleep(300);
    }
    const wentBack = document.querySelector('.screen.active')?.id === 'screen-cities';

    record('Navigation Back', citiesActive && favsActive && wentBack,
      `cities=${citiesActive}, favs=${favsActive}, back=${wentBack}`);
  } catch(e) { record('Navigation Back', false, e.message); }

  // 9. Rapid filter chaos (10 cycles)
  try {
    showScreen('screen-browser'); await sleep(200);
    const startErr = errors.length;
    for (let i = 0; i < 10; i++) {
      toggleOpenNow(); await sleep(80); toggleOpenNow(); await sleep(80);
      toggleHiddenGems(); await sleep(80); toggleHiddenGems(); await sleep(80);
    }
    resetAllFilters(); await sleep(200);
    const newErrs = errors.length - startErr;
    record('Filter Chaos (10×)', newErrs === 0, `40 rapid toggles, ${newErrs} errors`);
  } catch(e) { record('Filter Chaos', false, e.message); }

  // 10. Rapid modal chaos (10 opens)
  try {
    const startErr = errors.length;
    for (let i = 0; i < 10; i++) {
      const v = allPlaces[Math.floor(Math.random() * allPlaces.length)];
      openDetailModalByObj(v.ID); await sleep(80);
      closeDetailModal(); await sleep(50);
    }
    const newErrs = errors.length - startErr;
    record('Modal Chaos (10×)', newErrs === 0, `10 rapid opens, ${newErrs} errors`);
  } catch(e) { record('Modal Chaos', false, e.message); }

  // 11. Font size check
  try {
    let smallCount = 0;
    document.querySelectorAll('.venue-card *').forEach(el => {
      if (el.offsetParent === null) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (!isNaN(fs) && fs > 0 && fs < 12) smallCount++;
    });
    record('Font Sizes', smallCount === 0, smallCount === 0 ? 'All venue card elements ≥12px' : `${smallCount} elements still below 12px`);
  } catch(e) { record('Font Sizes', false, e.message); }

  // 12. Touch target check
  try {
    const btns = document.querySelectorAll('.sort-btn, .city-sort-rating, .city-sort-alpha, .modal-close-btn, .btn-card-action');
    let smallTargets = 0;
    btns.forEach(b => {
      if (b.offsetParent === null) return;
      const r = b.getBoundingClientRect();
      if (r.height < 44 || r.width < 44) smallTargets++;
    });
    record('Touch Targets', smallTargets === 0, smallTargets === 0 ? 'All buttons ≥44×44px' : `${smallTargets} buttons below 44px`);
  } catch(e) { record('Touch Targets', false, e.message); }

  // 13. Duplicate detection
  try {
    const info = window.__lblLastDedupInfo;
    if (info) {
      record('Duplicate Detection', info.duplicatesRemoved >= 0,
        `Original: ${info.originalCount}, After dedup: ${info.dedupedCount}, Removed: ${info.duplicatesRemoved}`);
    } else {
      record('Duplicate Detection', false, 'No dedup info — patch may not have loaded');
    }
  } catch(e) { record('Duplicate Detection', false, e.message); }

  // 14. Diagnostics button
  try {
    const hasBtn = !!document.getElementById('btn-run-diagnostics');
    const hasDedupBtn = !!document.getElementById('lbl-dedup-report');
    record('Diagnostics UI', hasBtn, `Run Diagnostics button: ${hasBtn}, Dedup button: ${hasDedupBtn}`);
  } catch(e) { record('Diagnostics UI', false, e.message); }

  // Restore
  console.error = origError;

  const elapsed = Math.round((Date.now() - start) / 1000);
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  console.log('');
  console.log(`%c═══ Result: ${passed}/${results.length} passed, ${failed} failed, ${elapsed}s ═══`,
    `font-size:14px;font-weight:bold;color:${failed === 0 ? '#128C7E' : '#D9534F'}`);

  window.__lblFastTestResults = { results, passed, failed, elapsed, errors };
  return { passed, failed, elapsed };
})();
