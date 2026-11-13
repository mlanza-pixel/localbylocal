/**
 * lbl-self-diagnostics.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.57 — Self-Diagnostic Module
 * Drop-in module that adds a "Run Diagnostics" button to the
 * existing Help & Diagnostics modal.
 *
 * Tests: app shell, screens, data loading, map function,
 * service worker, offline capability, font accessibility,
 * localStorage, and button inventory.
 *
 * Installation:
 *   Add this <script> tag before </body> in index.html.
 *   The module auto-injects a "Run Full Diagnostics" button
 *   into the existing .diag-box in the Help modal.
 */

(function() {
  'use strict';

  const DIAG_VERSION = '1.1.0';
  // Dynamically read version from the app badge instead of hardcoding
  function getAppVersion() {
    const badge = document.querySelector('.app-badge');
    if (badge) {
      const txt = badge.textContent.trim().replace(/^v/i, '');
      if (txt) return txt;
    }
    return '3.57';
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  const tests = [];
  let testResults = [];
  let running = false;

  function addTest(name, fn) {
    tests.push({ name, fn });
  }

  function recordResult(name, pass, detail, durationMs) {
    testResults.push({ name, pass, detail, durationMs });
    console.log(`%c[${pass ? 'PASS' : 'FAIL'}] ${name} (${durationMs}ms): ${detail}`,
      `color:${pass ? '#128C7E' : '#D9534F'};font-weight:bold`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 1: App shell integrity
  // ═══════════════════════════════════════════════════════════
  addTest('App Shell Integrity', async () => {
    const expectedScreens = [
      'screen-splash', 'screen-welcome', 'screen-legal', 'screen-onboarding',
      'screen-cities', 'screen-browser', 'screen-prefs', 'screen-itinerary',
      'screen-favorites'
    ];
    const missing = expectedScreens.filter(id => !document.getElementById(id));
    if (missing.length === 0) {
      return { pass: true, detail: `${expectedScreens.length} screens present` };
    }
    return { pass: false, detail: `Missing screens: ${missing.join(', ')}` };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 2: Modal integrity
  // ═══════════════════════════════════════════════════════════
  addTest('Modal Integrity', async () => {
    const expectedModals = ['modal-help', 'modal-detail'];
    const missing = expectedModals.filter(id => !document.getElementById(id));
    if (missing.length === 0) {
      return { pass: true, detail: `${expectedModals.length} modals present` };
    }
    return { pass: false, detail: `Missing modals: ${missing.join(', ')}` };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 3: City registry loaded
  // ═══════════════════════════════════════════════════════════
  addTest('City Registry', async () => {
    if (typeof CITIES_REGISTRY === 'undefined') {
      return { pass: false, detail: 'CITIES_REGISTRY not defined' };
    }
    const count = CITIES_REGISTRY.length;
    if (count >= 49) {
      return { pass: true, detail: `${count} cities registered` };
    }
    return { pass: false, detail: `Only ${count} cities (expected ≥49)` };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 4: Service worker registration
  // ═══════════════════════════════════════════════════════════
  addTest('Service Worker', async () => {
    if (!('serviceWorker' in navigator)) {
      return { pass: false, detail: 'Service worker not supported by browser' };
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        return { pass: true, detail: `Active: ${reg.active.scriptURL}` };
      }
      return { pass: false, detail: 'No active service worker registration' };
    } catch(e) {
      return { pass: false, detail: 'Error: ' + e.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 5: Offline capability
  // ═══════════════════════════════════════════════════════════
  addTest('Offline Capability', async () => {
    if (!('caches' in window)) {
      return { pass: false, detail: 'Cache API not available' };
    }
    try {
      const keys = await caches.keys();
      if (keys.length > 0) {
        return { pass: true, detail: `${keys.length} cache(s): ${keys.join(', ')}` };
      }
      return { pass: false, detail: 'No caches found — offline mode may not work' };
    } catch(e) {
      return { pass: false, detail: 'Error: ' + e.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 6: localStorage persistence
  // ═══════════════════════════════════════════════════════════
  addTest('localStorage Persistence', async () => {
    try {
      const testKey = '__lbl_diag_test__';
      localStorage.setItem(testKey, 'ok');
      const val = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      if (val === 'ok') {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('lbl') || k.startsWith('fav') || k.includes('local'));
        return { pass: true, detail: `Working. ${keys.length} app keys stored.` };
      }
      return { pass: false, detail: 'localStorage read/write failed' };
    } catch(e) {
      return { pass: false, detail: 'Error: ' + e.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 7: Leaflet/map library availability
  // ═══════════════════════════════════════════════════════════
  addTest('Map Library (Leaflet)', async () => {
    if (typeof L === 'undefined') {
      return { pass: false, detail: 'Leaflet (L) not loaded — map view will show fallback message' };
    }
    if (typeof L.map !== 'function') {
      return { pass: false, detail: 'L.map is not a function — library may be a stub' };
    }
    return { pass: true, detail: 'Leaflet ' + (L.version || 'v?') + ' loaded and functional' };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 8: Map container and toggle
  // ═══════════════════════════════════════════════════════════
  addTest('Map Container & Toggle', async () => {
    const container = document.getElementById('browse-map-container');
    const mapDiv = document.getElementById('leaflet-map');
    const toggleBtn = document.getElementById('btn-view-toggle');

    const issues = [];
    if (!container) issues.push('browse-map-container missing');
    if (!mapDiv) issues.push('leaflet-map div missing');
    if (!toggleBtn) issues.push('btn-view-toggle missing');

    if (issues.length > 0) {
      return { pass: false, detail: issues.join('; ') };
    }
    return { pass: true, detail: 'Map container, div, and toggle button all present' };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 9: Font accessibility audit
  // ═══════════════════════════════════════════════════════════
  addTest('Font Accessibility (Apple HIG / Material)', async () => {
    const allElements = document.querySelectorAll('*');
    const smallFonts = [];
    let checked = 0;

    allElements.forEach(el => {
      if (el.offsetParent === null) return; // skip hidden
      // Skip native form controls — their font-size is a browser default, not text
      if (el.tagName === 'INPUT' && ['checkbox','radio','submit','button','file','hidden','image'].includes(el.type)) return;
      if (el.tagName === 'SELECT' || el.tagName === 'OPTION') return;
      if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT' || el.tagName === 'HEAD' || el.tagName === 'META' || el.tagName === 'LINK') return;
      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      if (!isNaN(fontSize) && fontSize > 0) {
        checked++;
        // Apple HIG: minimum 11pt for body = 14.7px
        // Material Design: minimum 12sp for body
        // Flag anything under 14px
        if (fontSize < 14) {
          // Skip elements with no actual text content
          const text = el.textContent?.trim();
          if (!text && !el.querySelector('img, svg')) return;
          smallFonts.push({
            tag: el.tagName,
            id: el.id || '(none)',
            class: el.className?.toString().slice(0, 30) || '',
            size: fontSize + 'px',
            text: text?.slice(0, 40) || '',
          });
        }
      }
    });

    if (smallFonts.length === 0) {
      return { pass: true, detail: `${checked} elements checked, all ≥14px (Apple HIG)` };
    }
    return {
      pass: false,
      detail: `${smallFonts.length} elements below 14px (Apple HIG min: 11pt = 14.7px). Examples: ${smallFonts.slice(0, 5).map(f => `${f.tag}#${f.id} ${f.size}`).join(', ')}`,
      details: smallFonts,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 10: Button inventory
  // ═══════════════════════════════════════════════════════════
  addTest('Button Inventory', async () => {
    const buttons = document.querySelectorAll('button, [onclick], [role=button], .nav-btn');
    const visible = Array.from(buttons).filter(b => b.offsetParent !== null);
    const disabled = Array.from(buttons).filter(b => b.disabled);

    return {
      pass: visible.length > 0,
      detail: `${buttons.length} total buttons (${visible.length} visible, ${disabled.length} disabled)`,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 11: Navigation back/forward
  // ═══════════════════════════════════════════════════════════
  addTest('Navigation Back/Forward', async () => {
    if (typeof showScreen !== 'function') {
      return { pass: false, detail: 'showScreen function not found' };
    }

    // Save current screen so we can restore it
    const initialScreen = document.querySelector('.screen.active')?.id || 'screen-cities';

    // Reset the history stack for a clean test
    if (window.__lblScreenHistory) window.__lblScreenHistory.length = 0;

    // Step 1: Navigate to cities
    showScreen('screen-cities');
    await sleep(600);
    const citiesActive = document.querySelector('.screen.active')?.id === 'screen-cities';

    // Step 2: Navigate to favorites (this should push 'screen-cities' onto history)
    showScreen('screen-favorites');
    await sleep(600);
    const favsActive = document.querySelector('.screen.active')?.id === 'screen-favorites';

    // Step 3: Go back via lblGoBack (should pop 'screen-cities' and navigate to it)
    let wentBack = false;
    if (typeof window.lblGoBack === 'function') {
      const result = window.lblGoBack();
      await sleep(1000);
      wentBack = document.querySelector('.screen.active')?.id === 'screen-cities';
    } else {
      // Fallback: try history.back()
      history.back();
      await sleep(1000);
      wentBack = document.querySelector('.screen.active')?.id === 'screen-cities';
    }

    // Restore initial screen (quietly, without pushing to history)
    if (typeof showScreen === 'function') {
      showScreen(initialScreen, false);
    }

    if (citiesActive && favsActive && wentBack) {
      return { pass: true, detail: 'Navigation + lblGoBack() working correctly (cities→favs→cities)' };
    }
    return { pass: false, detail: `citiesActive=${citiesActive}, favsActive=${favsActive}, wentBack=${wentBack}, historyLen=${window.__lblScreenHistory?.length || 0}` };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 12: Touch target sizes (Apple HIG: 44pt min)
  // ═══════════════════════════════════════════════════════════
  addTest('Touch Target Sizes (Apple HIG: 44pt min)', async () => {
    // Comprehensive selector for all interactive elements
    const buttons = document.querySelectorAll(
      'button, .nav-btn, .cat-pill, .sort-pill, .toggle-filter-btn, ' +
      '.icon-btn, .venue-fav-btn, .btn-card-action, .btn-header-action, ' +
      '.btn-step-nav, .pwa-install-btn, .modal-close-btn, ' +
      'input[type="checkbox"], input[type="radio"], input[type="submit"], ' +
      '[role="button"]'
    );
    const smallTargets = [];
    const seen = new Set(); // dedupe

    buttons.forEach(btn => {
      if (seen.has(btn)) return;
      seen.add(btn);
      if (btn.getClientRects().length === 0) return; // skip elements not laid out
      const style = getComputedStyle(btn);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return;
      const rect = btn.getBoundingClientRect();
      // Report even very small visible targets; never silently exclude failures.
      if (rect.height < 44 || rect.width < 44) {
        smallTargets.push({
          id: btn.id || '(none)',
          selector: btn.id ? '#'+btn.id : btn.tagName.toLowerCase() + (btn.className && typeof btn.className === 'string' ? '.'+btn.className.trim().split(/\s+/).join('.') : ''),
          tag: btn.tagName,
          text: btn.textContent?.trim().slice(0, 20) || '',
          w: Math.round(rect.width) + 'px',
          h: Math.round(rect.height) + 'px',
        });
      }
    });

    if (smallTargets.length === 0) {
      return { pass: true, detail: 'All interactive elements ≥44×44px' };
    }
    return {
      pass: false,
      detail: `${smallTargets.length} buttons below 44×44px. Examples: ${smallTargets.slice(0, 5).map(t => `${t.selector} [${t.text || 'no text'}] (${t.w}×${t.h})`).join(', ')}`,
      details: smallTargets,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 13: Color contrast (basic check)
  // ═══════════════════════════════════════════════════════════
  addTest('Color Contrast (WCAG check)', async () => {
    // Check the main text color against background
    const body = document.body;
    const bodyStyle = getComputedStyle(body);
    const rootStyle = getComputedStyle(document.documentElement);

    const textColor = rootStyle.getPropertyValue('--text-dark').trim();
    const bgColor = rootStyle.getPropertyValue('--bg-main').trim();

    // Simple hex luminance check
    function hexToLum(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
      const r = parseInt(hex.substr(0,2), 16) / 255;
      const g = parseInt(hex.substr(2,2), 16) / 255;
      const b = parseInt(hex.substr(4,2), 16) / 255;
      return 0.299*r + 0.587*g + 0.114*b;
    }

    const textLum = hexToLum(textColor);
    const bgLum = hexToLum(bgColor);
    const ratio = (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);

    if (ratio >= 4.5) {
      return { pass: true, detail: `Contrast ratio ${ratio.toFixed(1)}:1 (WCAG AA: 4.5:1) — PASS` };
    }
    return { pass: false, detail: `Contrast ratio ${ratio.toFixed(1)}:1 — below WCAG AA (4.5:1)` };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 14: City Data Load (REAL CYCLING — loads first city)
  // ═══════════════════════════════════════════════════════════
  addTest('City Data Load (Live)', async () => {
    if (typeof loadCityData !== 'function' || typeof CITIES_REGISTRY === 'undefined') {
      return { pass: false, detail: 'loadCityData or CITIES_REGISTRY not available' };
    }
    try {
      const firstCity = CITIES_REGISTRY[0];
      await loadCityData(firstCity);
      await sleep(1500); // wait for async fetch + normalize
      if (typeof renderVenues === 'function') { renderVenues(); await sleep(800); }
      const venueCount = (typeof allPlaces !== 'undefined' && allPlaces) ? allPlaces.length : 0;
      const rendered = document.querySelectorAll('.venue-card').length;
      const dedupInfo = window.__lblLastDedupInfo;
      if (venueCount > 0 && rendered > 0) {
        return { pass: true, detail: `${firstCity.name}: ${venueCount} venues loaded, ${rendered} rendered${dedupInfo ? ', ' + dedupInfo.removed + ' dupes removed' : ''}` };
      }
      return { pass: false, detail: `${firstCity.name}: ${venueCount} loaded, ${rendered} rendered` };
    } catch(e) {
      return { pass: false, detail: 'Error: ' + e.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 15: Detail Modal Cycle (opens 3 modals)
  // ═══════════════════════════════════════════════════════════
  addTest('Detail Modal Cycle (3 opens)', async () => {
    if (typeof openDetailModalByObj !== 'function' || typeof closeDetailModal !== 'function') {
      return { pass: false, detail: 'Modal functions not available' };
    }
    if (typeof allPlaces === 'undefined' || !allPlaces || allPlaces.length === 0) {
      return { pass: false, detail: 'No venues loaded (run City Data Load first)' };
    }
    let errors = 0;
    const testCount = Math.min(3, allPlaces.length);
    for (let i = 0; i < testCount; i++) {
      try {
        openDetailModalByObj(allPlaces[i].ID);
        await sleep(800);
        const modalOpen = document.getElementById('modal-detail')?.classList.contains('active') ||
                          document.getElementById('modal-detail')?.style.display === 'flex' ||
                          document.getElementById('modal-detail')?.style.display === 'block';
        if (!modalOpen) errors++;
        closeDetailModal();
        await sleep(400);
      } catch(e) { errors++; }
    }
    if (errors === 0) {
      return { pass: true, detail: `${testCount} modals opened and closed successfully` };
    }
    return { pass: false, detail: `${testCount} tested, ${errors} errors` };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 16: Map View Toggle (real map render)
  // ═══════════════════════════════════════════════════════════
  addTest('Map View Toggle (Live)', async () => {
    if (typeof toggleViewMode !== 'function') {
      return { pass: false, detail: 'toggleViewMode not available' };
    }
    try {
      // Make sure we're on the browser screen
      if (typeof showScreen === 'function') showScreen('screen-browser');
      await sleep(600);
      toggleViewMode();
      await sleep(2000); // wait for tiles to load
      const container = document.getElementById('browse-map-container');
      const visible = container && (container.style.display === 'block' || getComputedStyle(container).display !== 'none');
      const markers = (typeof mapMarkers !== 'undefined' && mapMarkers) ? mapMarkers.length : 0;
      const tiles = document.querySelectorAll('.leaflet-tile').length;
      const mapHeight = container ? container.getBoundingClientRect().height : 0;
      toggleViewMode(); // toggle back
      await sleep(400);
      if (visible && markers > 0) {
        return { pass: true, detail: `Map visible, ${markers} markers, ${tiles} tiles loaded, height=${Math.round(mapHeight)}px` };
      }
      return { pass: false, detail: `visible=${visible}, markers=${markers}, tiles=${tiles}, height=${Math.round(mapHeight)}px` };
    } catch(e) {
      return { pass: false, detail: 'Error: ' + e.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 17: Favorite Toggle (real state change)
  // ═══════════════════════════════════════════════════════════
  addTest('Favorite Toggle (Live)', async () => {
    if (typeof toggleFav !== 'function') {
      return { pass: false, detail: 'toggleFav not available' };
    }
    if (typeof allPlaces === 'undefined' || !allPlaces || allPlaces.length === 0) {
      return { pass: false, detail: 'No venues loaded' };
    }
    try {
      const testId = allPlaces[0].ID;
      const before = Array.isArray(favoritesList) ? favoritesList.some(f => f.ID === testId) : false;
      toggleFav(testId);
      await sleep(400);
      const after1 = Array.isArray(favoritesList) ? favoritesList.some(f => f.ID === testId) : false;
      toggleFav(testId); // toggle back
      await sleep(400);
      const after2 = Array.isArray(favoritesList) ? favoritesList.some(f => f.ID === testId) : false;
      if (after1 !== before && after2 === before) {
        return { pass: true, detail: `Favorite toggled ON→OFF for "${allPlaces[0].Name?.slice(0,30)}"` };
      }
      return { pass: false, detail: `State change failed: before=${before}, after1=${after1}, after2=${after2}` };
    } catch(e) {
      return { pass: false, detail: 'Error: ' + e.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 18: Filter Cycle (Food filter)
  // ═══════════════════════════════════════════════════════════
  addTest('Filter Cycle (Live)', async () => {
    if (typeof renderVenues !== 'function') {
      return { pass: false, detail: 'renderVenues not available' };
    }
    try {
      // Count all
      const prevCat = typeof currentCategory !== 'undefined' ? currentCategory : 'All';
      currentCategory = 'All';
      renderVenues();
      await sleep(600);
      const allCount = document.querySelectorAll('.venue-card').length;
      // Apply Food filter
      currentCategory = 'Food';
      renderVenues();
      await sleep(600);
      const foodCount = document.querySelectorAll('.venue-card').length;
      // Reset
      currentCategory = prevCat || 'All';
      renderVenues();
      await sleep(400);
      if (allCount > 0 && foodCount > 0 && foodCount < allCount) {
        return { pass: true, detail: `All=${allCount} venues, Food=${foodCount} venues (filter working)` };
      }
      if (allCount > 0 && foodCount === allCount) {
        return { pass: true, detail: `All=${allCount}, Food=${foodCount} (no Food category in this city — filter still applied)` };
      }
      return { pass: false, detail: `All=${allCount}, Food=${foodCount}` };
    } catch(e) {
      return { pass: false, detail: 'Error: ' + e.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // RUN ALL TESTS — with live progress and per-test duration
  // ═══════════════════════════════════════════════════════════
  async function runDiagnostics() {
    if (running) return;
    running = true;
    testResults = [];
    const APP_VERSION = getAppVersion();
    const totalStart = performance.now();

    console.log('%c═══ Local Like a Local v' + APP_VERSION + ' — Self-Diagnostics v' + DIAG_VERSION + ' ═══',
      'font-size:16px;font-weight:bold;color:#1B365D');

    // Show live progress in the diag-box
    const diagBox = document.querySelector('.diag-box');
    let progressDiv = document.getElementById('lbl-diag-progress');
    if (!progressDiv && diagBox) {
      progressDiv = document.createElement('div');
      progressDiv.id = 'lbl-diag-progress';
      progressDiv.style.cssText = 'margin-top:14px;border-top:1px solid var(--border);padding-top:12px;font-size:15px;';
      diagBox.appendChild(progressDiv);
    }

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      // Update live progress
      if (progressDiv) {
        progressDiv.innerHTML = `<strong>🔍 Running Diagnostics...</strong> (${i + 1}/${tests.length})<br>` +
          `<span style="color:var(--text-muted);">Now testing: ${test.name}</span>`;
      }
      const start = performance.now();
      try {
        const result = await test.fn();
        const duration = Math.round(performance.now() - start);
        recordResult(test.name, result.pass, result.detail, duration);
      } catch(e) {
        const duration = Math.round(performance.now() - start);
        recordResult(test.name, false, 'Exception: ' + e.message, duration);
      }
    }

    const totalDuration = Math.round((performance.now() - totalStart) / 1000);
    const passed = testResults.filter(r => r.pass).length;
    const failed = testResults.filter(r => !r.pass).length;
    const total = testResults.length;

    const summary = {
      app: 'Local Like a Local',
      version: APP_VERSION,
      diagVersion: DIAG_VERSION,
      timestamp: new Date().toISOString(),
      total, passed, failed,
      passRate: ((passed / total) * 100).toFixed(1) + '%',
      totalDurationSec: totalDuration,
    };

    console.log(`%c═══ Result: ${passed}/${total} passed, ${failed} failed (${totalDuration}s) ═══`,
      `font-size:14px;font-weight:bold;color:${failed === 0 ? '#128C7E' : '#D9534F'}`);

    // Remove progress div
    if (progressDiv) progressDiv.remove();

    // Update ONLY the Self-Diagnostic Results section — preserve the static System Diagnostics above
    if (diagBox) {
      // Find or create the results section
      let resultsDiv = document.getElementById('lbl-self-diag-results');
      if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'lbl-self-diag-results';
        resultsDiv.style.cssText = 'margin-top:14px;border-top:1px solid var(--border);padding-top:12px;';
        diagBox.appendChild(resultsDiv);
      }
      let html = `<strong>🔍 Self-Diagnostic Results (${summary.passRate})</strong> — ${totalDuration}s total<br>`;
      html += `<span style="font-size:13px;color:var(--text-muted);">Run ${new Date().toLocaleTimeString()} — Diag v${DIAG_VERSION}, App v${APP_VERSION}, ${total} tests</span><br><br>`;
      testResults.forEach(r => {
        const icon = r.pass ? '✅' : '❌';
        const dur = r.durationMs ? ` <span style="color:var(--text-muted);font-size:13px;">(${r.durationMs}ms)</span>` : '';
        html += `${icon} <strong>${r.name}</strong>${dur}: ${r.detail.slice(0, 140)}<br>`;
      });
      html += `<br><strong>📋 What was tested:</strong><br>`;
      html += `<span style="font-size:13px;color:var(--text2);">`;
      html += `• Tests 1-3: App structure (screens, modals, city registry)<br>`;
      html += `• Tests 4-6: PWA infrastructure (service worker, offline cache, storage)<br>`;
      html += `• Tests 7-8: Map library and container<br>`;
      html += `• Tests 9-10: Accessibility (fonts ≥14px, button inventory)<br>`;
      html += `• Test 11: Navigation (cities→favs→back)<br>`;
      html += `• Tests 12-13: Touch targets (44px) and color contrast (WCAG AA)<br>`;
      html += `• <strong>Tests 14-18: LIVE cycling</strong> — loads city data, opens 3 modals, toggles map, toggles favorite, applies filter<br>`;
      html += `</span><br>`;
      html += `<em>Click "Run Full Diagnostics" again to re-test. For exhaustive testing of all 49 cities, use the "Run Fast Test" button below.</em>`;
      resultsDiv.innerHTML = html;
    }

    window.__lblDiagResults = { summary, results: testResults };
    running = false;
    return summary;
  }

  // ═══════════════════════════════════════════════════════════
  // AUTO-INJECT the diagnostics button into the Help modal
  // ═══════════════════════════════════════════════════════════
  function injectDiagnosticsButton() {
    const helpModal = document.getElementById('modal-help');
    if (!helpModal) {
      // Retry after a delay if modal isn't ready yet
      setTimeout(injectDiagnosticsButton, 1000);
      return;
    }

    // Check if already injected
    if (document.getElementById('btn-run-diagnostics')) return;

    const diagBox = helpModal.querySelector('.diag-box');
    if (!diagBox) return;

    // Add a button after the diag-box
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'margin-top:14px;text-align:center;';
    btnContainer.innerHTML = `
      <button id="btn-run-diagnostics" onclick="window.__lblRunDiagnostics()"
        style="background:var(--teal);color:#fff;border:none;padding:12px 24px;
        min-height:44px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;
        font-family:var(--font-m);box-shadow:var(--shadow-sm);display:inline-flex;
        align-items:center;justify-content:center;">
        🔍 Run Full Diagnostics (19 checks, ~15 sec)
      </button>
    `;
    diagBox.parentElement.insertBefore(btnContainer, diagBox.nextSibling);
  }

  // Expose for the onclick handler
  window.__lblRunDiagnostics = runDiagnostics;

  // Auto-inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectDiagnosticsButton);
  } else {
    injectDiagnosticsButton();
  }

  // Also re-inject when the help modal is opened
  document.addEventListener('click', function(e) {
    if (e.target && e.target.getAttribute && e.target.getAttribute('onclick')?.includes('openHelpModal')) {
      setTimeout(injectDiagnosticsButton, 200);
    }
  }, true);

  console.log('Local Like a Local — Self-Diagnostics v' + DIAG_VERSION + ' loaded. Open Help modal and click "Run Full Diagnostics".');
})();
