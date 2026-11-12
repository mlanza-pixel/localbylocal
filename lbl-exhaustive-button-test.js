/**
 * lbl-exhaustive-button-test.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.50 — Exhaustive Button Test
 * Tests every button across all 9 screens + 2 modals,
 * clicking FORWARDS and BACKWARDS through every screen.
 *
 * Usage:
 *   1. Open https://mlanza-pixel.github.io/localbylocal/
 *   2. Accept the legal disclaimer
 *   3. Open browser DevTools → Console
 *   4. Paste this entire script and press Enter
 *   5. Wait ~3 minutes for completion
 *   6. Results stored in window.__lblResults
 */

(async function exhaustiveButtonTest() {
  'use strict';

  const results = [];
  const errors = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Track errors
  const origError = console.error;
  console.error = function(...args) {
    errors.push(args.map(a => String(a)).join(' ').slice(0, 300));
    origError.apply(console, args);
  };
  window.addEventListener('error', e => errors.push('Uncaught: ' + e.message));

  // Track prompts/confirms
  const origConfirm = window.confirm;
  window.confirm = () => true;
  const origAlert = window.alert;
  window.alert = () => {};
  const origPrompt = window.prompt;
  window.prompt = (msg, def) => def || 'TestInput';

  function navigateTo(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      showScreen(screenId);
      return true;
    }
    return false;
  }

  function getVisibleButtons(scope) {
    const root = scope || document;
    return Array.from(root.querySelectorAll('button, [onclick], [role=button], .nav-btn'))
      .filter(b => b.offsetParent !== null || b.style.display !== 'none')
      .filter(b => !b.disabled);
  }

  function getLabel(btn) {
    return (btn.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50)
      || btn.id || btn.getAttribute('aria-label') || '(unnamed)';
  }

  function captureState() {
    return {
      activeScreen: document.querySelector('.screen.active')?.id || null,
      openModals: Array.from(document.querySelectorAll('.modal-overlay.active, .modal-overlay[style*="flex"]'))
        .map(m => m.id),
      url: location.hash,
      venueCount: document.querySelectorAll('.venue-card, .venue-item').length,
      cityCount: document.querySelectorAll('.city-card, .city-tile').length,
      favCount: document.querySelectorAll('.fav-item, .fav-card').length,
      mapVisible: document.getElementById('browse-map-container')?.style.display === 'block',
      errorCount: errors.length,
    };
  }

  function describeChange(pre, post) {
    const changes = [];
    if (pre.activeScreen !== post.activeScreen) changes.push(`screen→${post.activeScreen}`);
    if (JSON.stringify(pre.openModals) !== JSON.stringify(post.openModals))
      changes.push(`modals→${JSON.stringify(post.openModals)}`);
    if (pre.url !== post.url) changes.push(`url→${post.url}`);
    if (pre.venueCount !== post.venueCount) changes.push(`venues→${post.venueCount}`);
    if (pre.cityCount !== post.cityCount) changes.push(`cities→${post.cityCount}`);
    if (pre.favCount !== post.favCount) changes.push(`favs→${post.favCount}`);
    if (pre.mapVisible !== post.mapVisible) changes.push(`map→${post.mapVisible}`);
    if (post.errorCount > pre.errorCount) changes.push(`ERRORS+${post.errorCount - pre.errorCount}`);
    return changes.join('; ') || '(no observable change)';
  }

  async function clickAndRecord(btn, screen, direction) {
    const label = getLabel(btn);
    const pre = captureState();
    let crashed = false, crashMsg = '';

    try {
      btn.click();
      await sleep(400);
    } catch (e) {
      crashed = true;
      crashMsg = e.message.slice(0, 100);
    }

    const post = captureState();
    const changed = JSON.stringify(pre) !== JSON.stringify(post);
    const newErrors = post.errorCount - pre.errorCount;

    results.push({
      screen, direction, label, id: btn.id || null,
      changed, changeDesc: describeChange(pre, post),
      crashed, crashMsg,
      newErrors,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 1: FORWARD testing — click every button in screen order
  // ═══════════════════════════════════════════════════════════
  console.log('%c=== Phase 1: Forward Button Test ===', 'font-size:14px;font-weight:bold;color:#128C7E');

  const screens = [
    'screen-splash', 'screen-welcome', 'screen-legal', 'screen-onboarding',
    'screen-cities', 'screen-browser', 'screen-prefs', 'screen-itinerary',
    'screen-favorites'
  ];

  for (const screenId of screens) {
    // Navigate to the screen
    if (screenId === 'screen-splash') {
      // Splash shows on load; if we're past it, skip
      if (!document.getElementById('screen-splash')?.classList.contains('active')) {
        results.push({ screen: screenId, direction: 'forward', label: '(skipped — past splash)', changed: false, crashed: false });
        continue;
      }
    } else if (screenId === 'screen-welcome') {
      // Need to dismiss splash first
      const dismissBtn = document.querySelector('#screen-splash button[onclick*="dismiss"]');
      if (dismissBtn) { dismissBtn.click(); await sleep(500); }
      const startBtn = document.querySelector('#screen-welcome button[onclick*="handleStartApp"]');
      if (startBtn) { startBtn.click(); await sleep(500); }
    } else if (screenId === 'screen-legal') {
      // Accept legal
      const agreeBtn = document.querySelector('#screen-legal button[onclick*="agreeLegal"]');
      if (agreeBtn) { agreeBtn.click(); await sleep(500); }
    } else {
      navigateTo(screenId);
    }
    await sleep(800);

    const buttons = getVisibleButtons(document.getElementById(screenId) || document);
    console.log(`  ${screenId}: ${buttons.length} buttons found`);

    for (const btn of buttons) {
      await clickAndRecord(btn, screenId, 'forward');
      // Return to the screen we were testing
      navigateTo(screenId);
      await sleep(200);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 2: BACKWARD testing — reverse screen order
  // ═══════════════════════════════════════════════════════════
  console.log('%c=== Phase 2: Backward Button Test ===', 'font-size:14px;font-weight:bold;color:#CC5500');

  const reversedScreens = [...screens].reverse();
  for (const screenId of reversedScreens) {
    if (['screen-splash', 'screen-welcome', 'screen-legal', 'screen-onboarding'].includes(screenId)) {
      // Skip onboarding screens in backward pass (can't easily revisit)
      continue;
    }
    navigateTo(screenId);
    await sleep(800);

    const buttons = getVisibleButtons(document.getElementById(screenId) || document);
    console.log(`  ${screenId} (backward): ${buttons.length} buttons found`);

    for (const btn of buttons) {
      await clickAndRecord(btn, screenId, 'backward');
      navigateTo(screenId);
      await sleep(200);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 3: Modal testing — open/close each modal
  // ═══════════════════════════════════════════════════════════
  console.log('%c=== Phase 3: Modal Test ===', 'font-size:14px;font-weight:bold;color:#1B365D');

  // Help modal
  navigateTo('screen-browser');
  await sleep(500);
  const helpBtn = document.querySelector('[onclick*="openHelpModal"]');
  if (helpBtn) {
    const pre = captureState();
    helpBtn.click();
    await sleep(500);
    const postOpen = captureState();
    results.push({
      screen: 'modal-help', direction: 'open', label: 'Open Help Modal',
      changed: postOpen.openModals.includes('modal-help'),
      changeDesc: `modals→${JSON.stringify(postOpen.openModals)}`,
      crashed: false, crashMsg: '', newErrors: 0,
    });

    // Test buttons inside the help modal
    const modalButtons = getVisibleButtons(document.getElementById('modal-help'));
    for (const btn of modalButtons) {
      await clickAndRecord(btn, 'modal-help', 'modal-internal');
    }

    // Close help modal
    const closeBtn = document.querySelector('[onclick*="closeHelpModal"]');
    if (closeBtn) {
      closeBtn.click();
      await sleep(300);
    }
  }

  // Detail modal — open first venue
  navigateTo('screen-browser');
  await sleep(500);
  const firstVenue = document.querySelector('.venue-card button, .venue-item button, [onclick*="openDetailModal"]');
  if (firstVenue) {
    firstVenue.click();
    await sleep(500);
    const postOpen = captureState();

    const modalButtons = getVisibleButtons(document.getElementById('modal-detail'));
    for (const btn of modalButtons) {
      await clickAndRecord(btn, 'modal-detail', 'modal-internal');
    }

    const closeBtn = document.querySelector('[onclick*="closeDetailModal"]');
    if (closeBtn) { closeBtn.click(); await sleep(300); }
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 4: Map function test
  // ═══════════════════════════════════════════════════════════
  console.log('%c=== Phase 4: Map Function Test ===', 'font-size:14px;font-weight:bold;color:#128C7E');

  navigateTo('screen-browser');
  await sleep(500);

  // Load a city first (Palm Springs has data)
  if (typeof loadCityData === 'function' && typeof CITIES_REGISTRY !== 'undefined') {
    try {
      await loadCityData(CITIES_REGISTRY[0]);
      await sleep(1000);
    } catch(e) {
      results.push({ screen: 'screen-browser', direction: 'map-test', label: 'Load city data', changed: false, crashed: true, crashMsg: e.message });
    }
  }

  // Click Map View toggle
  const mapToggle = document.getElementById('btn-view-toggle');
  if (mapToggle) {
    const pre = captureState();
    mapToggle.click();
    await sleep(1000);
    const post = captureState();

    const mapContainer = document.getElementById('browse-map-container');
    const mapDiv = document.getElementById('leaflet-map');
    const leafletLoaded = typeof L !== 'undefined';
    const mapHasInstance = typeof mapInstance !== 'undefined' && mapInstance !== null;
    const mapHasMarkers = typeof mapMarkers !== 'undefined' && mapMarkers.length > 0;

    results.push({
      screen: 'screen-browser', direction: 'map-test', label: 'Toggle Map View',
      changed: pre.mapVisible !== post.mapVisible,
      changeDesc: `mapVisible→${post.mapVisible}; leafletLoaded=${leafletLoaded}; mapInstance=${mapHasInstance}; markers=${mapHasMarkers ? mapMarkers.length : 0}`,
      crashed: false, crashMsg: '',
      newErrors: post.errorCount - pre.errorCount,
      mapDetails: {
        leafletLoaded,
        mapHasInstance,
        mapHasMarkers,
        markerCount: mapHasMarkers ? mapMarkers.length : 0,
        mapContainerDisplay: mapContainer?.style.display,
        mapDivHasContent: mapDiv ? mapDiv.innerHTML.length > 0 : false,
      },
    });

    // Toggle back to list view
    mapToggle.click();
    await sleep(300);
  }

  // ═══════════════════════════════════════════════════════════
  // Restore mocks
  // ═══════════════════════════════════════════════════════════
  window.confirm = origConfirm;
  window.alert = origAlert;
  window.prompt = origPrompt;
  console.error = origError;

  // ═══════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════
  const total = results.length;
  const changed = results.filter(r => r.changed).length;
  const crashed = results.filter(r => r.crashed).length;
  const withErrors = results.filter(r => r.newErrors > 0).length;
  const noChange = results.filter(r => !r.changed && !r.crashed).length;

  const summary = {
    total, changed, noChange, crashed, withErrors,
    totalErrors: errors.length,
    passRate: ((total - crashed - withErrors) / Math.max(total, 1) * 100).toFixed(1) + '%',
  };

  console.log(`%c=== Result: ${total} buttons tested, ${crashed} crashed, ${withErrors} with errors ===`,
    `font-size:14px;font-weight:bold;color:${crashed + withErrors === 0 ? '#128C7E' : '#D9534F'}`);

  window.__lblResults = { summary, results, allErrors: errors };
  return summary;
})();
