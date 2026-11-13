/**
 * lbl-v3.56-fixes.js
 * Local Like a Local v3.57 — All Remaining Fixes (corrected)
 *
 * CRITICAL FIXES in this version:
 *  1. All font sizes bumped to 15px minimum (was 13px which FAILED Apple HIG 14px check)
 *  2. Navigation back/forward rewritten — lblGoBack now correctly restores previous screen
 *  3. Touch targets all set to min 44×44px
 *  4. Service Worker registration with cache-busting query param
 *  5. Duplicate venue detection
 *  6. Map sizing adapts to device
 *  7. Test buttons auto-injected into Help modal
 *
 * Everything auto-runs — no console pasting needed.
 */

(function() {
  'use strict';
  console.log('%c[LBL v3.57] Applying all fixes...', 'color:#CC5500;font-weight:bold');

  // ═══════════════════════════════════════════════════════════
  // FIX 1: Font sizes — ALL bumped to 15px minimum (Apple HIG: 11pt = 14.7px)
  // ═══════════════════════════════════════════════════════════
  function fixFonts() {
    const style = document.createElement('style');
    style.id = 'lbl-v357-font-fixes';
    style.textContent = `
      /* Filter buttons — by ID */
      #btn-filter-opennow, #btn-filter-hiddengems, #btn-view-toggle,
      #btn-browse-nearme, #btn-start, #btn-step-prev, #btn-step-next,
      #btn-pwa-install {
        font-size: 15px !important;
        min-height: 44px !important;
      }

      /* Nav button text */
      .nav-btn span:not(.nav-icon) { font-size: 15px !important; }
      .nav-btn { font-size: 15px !important; }

      /* Sort buttons */
      .sort-pill, .sort-pill.active,
      #city-sort-rating, #city-sort-alpha {
        font-size: 15px !important;
        min-height: 44px !important;
        min-width: 44px !important;
        padding: 10px 16px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      /* Venue card elements — all 15px */
      .venue-score { font-size: 15px !important; }
      .btn-card-action { font-size: 15px !important; min-height: 44px !important; }
      .btn-card-action.primary { font-size: 15px !important; min-height: 44px !important; }
      .app-badge { font-size: 15px !important; }
      .venue-meta-bar { font-size: 15px !important; }
      .venue-meta-bar span { font-size: 15px !important; }
      .venue-actions button { font-size: 15px !important; min-height: 44px !important; }
      .venue-cat { font-size: 15px !important; }
      .venue-sub { font-size: 15px !important; }
      .venue-neighborhood { font-size: 15px !important; }
      .venue-price { font-size: 15px !important; }
      .venue-whygo { font-size: 15px !important; }
      .venue-card .venue-title { font-size: 17px !important; }

      /* Modal */
      .modal-close-btn { min-width: 44px !important; min-height: 44px !important; font-size: 22px !important; }
      #detail-modal-body { font-size: 15px !important; }
      #detail-modal-body strong, #detail-modal-body b { font-size: 16px !important; }

      /* Other UI — all 15px (was 13px, below Apple HIG threshold) */
      .toggle-filter-btn { font-size: 15px !important; min-height: 44px !important; }
      .pref-label { font-size: 15px !important; }
      .diag-box { font-size: 15px !important; }
      .walkthrough-p { font-size: 15px !important; }
      .legal-note { font-size: 15px !important; }
      .style-select { font-size: 15px !important; }
      .search-input-box input { font-size: 15px !important; }
      .city-status-pill { font-size: 15px !important; }
      .count-badge { font-size: 15px !important; }
      .welcome-tag { font-size: 15px !important; }
      .splash-tap-hint { font-size: 15px !important; }
      .fav-nav-badge { font-size: 14px !important; }

      /* Header buttons — ensure 44px min */
      .btn-header-action { min-height: 44px !important; }
      .pwa-install-btn { min-height: 44px !important; }
      .pwa-dismiss-btn { min-width: 44px !important; min-height: 44px !important; }
      .icon-btn { width: 44px !important; height: 44px !important; min-width: 44px !important; min-height: 44px !important; }
      .venue-fav-btn { min-width: 44px !important; min-height: 44px !important; width: 44px !important; height: 44px !important; }
      .btn-step-nav { min-height: 44px !important; }
      .cat-pill { min-height: 44px !important; padding: 12px 16px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }
      .app-title { min-height: 44px !important; }
      input[type="checkbox"], input[type="radio"] { width: 22px !important; height: 22px !important; min-width: 22px !important; min-height: 22px !important; }
      #btn-run-diagnostics { min-height: 44px !important; font-size: 15px !important; padding: 12px 24px !important; }
    `;
    document.head.appendChild(style);

    // MutationObserver: force any dynamically-rendered element below 14px up to 15px
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          const els = node.querySelectorAll ? node.querySelectorAll('*') : [node];
          els.forEach(el => {
            if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
            try {
              const fs = parseFloat(getComputedStyle(el).fontSize);
              if (!isNaN(fs) && fs > 0 && fs < 14) el.style.fontSize = '15px';
            } catch(e) {}
          });
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('  [1] Font fixes injected (all 15px min, was 13px)');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 2: Service Worker registration with cache-busting
  // ═══════════════════════════════════════════════════════════
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('  [2] Service Worker not supported');
      return;
    }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.log('  [2] SW requires HTTPS (or localhost)');
      return;
    }
    navigator.serviceWorker.register('./sw.js?v3.60').then(function(reg) {
      console.log('  [2] Service Worker registered: ' + reg.scope);
      // Force update check
      reg.update().catch(function(){});
    }).catch(function(err) {
      console.warn('  [2] SW registration failed: ' + err.message);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 3: Duplicate venue detection
  // ═══════════════════════════════════════════════════════════
  function patchDuplicates() {
    if (typeof normalizeCityData !== 'function') return;
    if (window.__lblDupPatchApplied) return; // don't double-patch
    window.__lblDupPatchApplied = true;
    const orig = normalizeCityData;
    window.normalizeCityData = function(rawList) {
      let normalized = orig(rawList);
      const seenIds = new Set(), seenNames = new Set(), dupes = [], deduped = [];
      normalized.forEach(p => {
        const id = p.ID || '';
        const key = ((p.Name||'').toLowerCase().trim()) + '|' + ((p.Address_City||'').toLowerCase().trim());
        if (seenIds.has(id) || seenNames.has(key)) { dupes.push({name: p.Name, id}); }
        else { seenIds.add(id); seenNames.add(key); deduped.push(p); }
      });
      if (dupes.length > 0) console.warn('[v3.57] Removed ' + dupes.length + ' duplicate venues');
      window.__lblLastDedupInfo = { original: normalized.length, deduped: deduped.length, removed: dupes.length, samples: dupes.slice(0,10) };
      return deduped;
    };
    console.log('  [3] Duplicate detection patched');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 4: Navigation back/forward — REWRITTEN to fix wentBack=false bug
  // ═══════════════════════════════════════════════════════════
  function fixNavigation() {
    if (typeof showScreen !== 'function') {
      console.warn('  [4] showScreen not found, retrying...');
      setTimeout(fixNavigation, 1000);
      return;
    }
    if (window.__lblNavPatchApplied) {
      console.log('  [4] Navigation already patched');
      return;
    }
    window.__lblNavPatchApplied = true;

    // Initialize history stack
    window.__lblScreenHistory = window.__lblScreenHistory || [];

    const orig = showScreen;
    window.showScreen = function(id, pushHash) {
      const cur = document.querySelector('.screen.active')?.id;
      // Only push to OUR history if pushHash !== false (i.e., forward navigation)
      if (cur && cur !== id && pushHash !== false) {
        window.__lblScreenHistory.push(cur);
        if (window.__lblScreenHistory.length > 30) window.__lblScreenHistory.shift();
      }
      return orig.call(window, id, pushHash);
    };

    // lblGoBack: pop from our history and navigate WITHOUT pushing back
    window.lblGoBack = function() {
      if (window.__lblScreenHistory && window.__lblScreenHistory.length > 0) {
        const prev = window.__lblScreenHistory.pop();
        // Call with pushHash=false so we don't re-push the current screen
        window.showScreen(prev, false);
        return true;
      }
      // Fallback to browser history
      if (history.length > 1) {
        history.back();
        return true;
      }
      return false;
    };

    // Expose for testing
    window.__lblNavInfo = function() {
      return {
        historyLength: window.__lblScreenHistory.length,
        history: window.__lblScreenHistory.slice(),
        currentScreen: document.querySelector('.screen.active')?.id,
      };
    };
    console.log('  [4] Navigation fixed (lblGoBack + history stack)');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 5: Map container — adapt to device size
  // ═══════════════════════════════════════════════════════════
  function fixMapSizing() {
    const style = document.createElement('style');
    style.id = 'lbl-map-size-fix';
    style.textContent = `
      #browse-map-container {
        height: 60vh !important;
        max-height: 600px !important;
        min-height: 300px !important;
      }
      @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
        #browse-map-container { height: 70vh !important; }
      }
      @media (max-width: 767px) and (orientation: landscape) {
        #browse-map-container { height: 50vh !important; min-height: 250px !important; }
      }
    `;
    document.head.appendChild(style);
    console.log('  [5] Map sizing fixed (viewport-based)');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 6: Inject test buttons into Help modal
  // ═══════════════════════════════════════════════════════════
  function injectButtons() {
    const helpModal = document.getElementById('modal-help');
    if (!helpModal) { setTimeout(injectButtons, 1000); return; }
    if (document.getElementById('btn-fast-test')) return;

    const container = document.createElement('div');
    container.style.cssText = 'margin-top:14px;display:flex;flex-direction:column;gap:10px;';

    // Fast Test button (samples 10 venues in 1 city — quick smoke test)
    const fastBtn = document.createElement('button');
    fastBtn.id = 'btn-fast-test';
    fastBtn.textContent = '⚡ Run Quick Smoke Test (1 city, 10 venues, ~2 min)';
    fastBtn.style.cssText = 'background:var(--accent,#CC5500);color:#fff;border:none;padding:14px 20px;min-height:44px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font-m);';
    fastBtn.onclick = runFastTest;
    container.appendChild(fastBtn);

    // Dedup button
    const dedupBtn = document.createElement('button');
    dedupBtn.id = 'lbl-dedup-btn';
    dedupBtn.textContent = '🔍 Check for Duplicate Venues';
    dedupBtn.style.cssText = 'background:var(--teal,#128C7E);color:#fff;border:none;padding:14px 20px;min-height:44px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font-m);';
    dedupBtn.onclick = function() {
      const info = window.__lblLastDedupInfo;
      if (!info) { alert('Load a city first.'); return; }
      alert('Duplicate Check:\n\nOriginal: ' + info.original + '\nAfter dedup: ' + info.deduped + '\nRemoved: ' + info.removed + (info.removed > 0 ? '\n\nSamples:\n' + info.samples.map(s => '  • ' + s.name).join('\n') : '\n\n✅ No duplicates!'));
    };
    container.appendChild(dedupBtn);

    // Screen Capture button
    const captureBtn = document.createElement('button');
    captureBtn.id = 'btn-screen-capture';
    captureBtn.textContent = '📸 Capture Screenshots';
    captureBtn.style.cssText = 'background:var(--primary,#1B365D);color:#fff;border:none;padding:14px 20px;min-height:44px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font-m);';
    captureBtn.onclick = captureScreens;
    container.appendChild(captureBtn);

    // EXHAUSTIVE test button — cycles through ALL venues in ALL 49 cities
    const exhaustBtn = document.createElement('button');
    exhaustBtn.id = 'btn-exhaustive-test';
    exhaustBtn.textContent = '🔥 Run Exhaustive Test (ALL 49 cities / ~2,500 venues / 20-40 min)';
    exhaustBtn.style.cssText = 'background:#7B2D26;color:#fff;border:none;padding:14px 20px;min-height:44px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font-m);margin-top:6px;';
    exhaustBtn.onclick = runExhaustiveTest;
    container.appendChild(exhaustBtn);

    const diagBox = helpModal.querySelector('.diag-box');
    if (diagBox) diagBox.parentElement.insertBefore(container, diagBox.nextSibling);
    else helpModal.querySelector('.modal-dialog').appendChild(container);
    console.log('  [6] Test buttons injected (Fast + Exhaustive + Dedup + Screenshot)');
  }

  // ═══════════════════════════════════════════════════════════
  // EXHAUSTIVE TEST — cycles through EVERY venue in EVERY city
  // Opens detail modal, closes, toggles favorite on/off for each.
  // Estimated: 20-40 minutes for 2,544 venues across 49 cities.
  // ═══════════════════════════════════════════════════════════
  async function runExhaustiveTest() {
    const btn = document.getElementById('btn-exhaustive-test');
    if (btn) { btn.textContent = '⏳ Running Exhaustive Test... DO NOT CLOSE'; btn.disabled = true; }
    closeHelpModal();

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const errors = [];
    const origError = console.error;
    console.error = function(...a) { errors.push(a.join(' ').slice(0,200)); origError.apply(console, a); };
    window.addEventListener('error', e => errors.push('Uncaught: ' + e.message));
    window.confirm = () => true; window.alert = () => {};

    const startTime = Date.now();
    let totalVenues = 0, totalTested = 0, totalErrors = 0;
    const cityResults = [];

    // Progress overlay
    let overlay = document.createElement('div');
    overlay.id = 'lbl-exhaustive-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:var(--font-m);padding:20px;text-align:center;';
    document.body.appendChild(overlay);

    function updateProgress(cityName, cityIdx, venueIdx, venueTotal) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const pct = cityIdx > 0 ? Math.round((cityIdx / CITIES_REGISTRY.length) * 100) : 0;
      overlay.innerHTML = `
        <div style="font-size:24px;font-weight:700;margin-bottom:10px;">🔥 Exhaustive Test Running</div>
        <div style="font-size:16px;margin-bottom:6px;">City ${cityIdx}/${CITIES_REGISTRY.length}: ${cityName}</div>
        <div style="font-size:14px;margin-bottom:14px;">Venue ${venueIdx}/${venueTotal}</div>
        <div style="font-size:14px;margin-bottom:14px;">Total tested: ${totalTested} | Errors: ${totalErrors} | Elapsed: ${elapsed}s</div>
        <div style="width:80%;max-width:400px;height:20px;background:#333;border-radius:10px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:var(--accent,#CC5500);transition:width 0.3s;"></div>
        </div>
        <div style="font-size:13px;margin-top:14px;color:#aaa;">DO NOT close this tab. Test takes 20-40 minutes.</div>
      `;
    }

    try {
      for (let c = 0; c < CITIES_REGISTRY.length; c++) {
        const city = CITIES_REGISTRY[c];
        let cityErrors = 0;
        let cityVenues = 0;

        try {
          await loadCityData(city);
          await sleep(1500);
          if (typeof renderVenues === 'function') { renderVenues(); await sleep(600); }

          if (!allPlaces || allPlaces.length === 0) {
            cityResults.push({ city: city.name, venues: 0, errors: 0, note: 'No venues loaded' });
            updateProgress(city.name, c + 1, 0, 0);
            continue;
          }

          cityVenues = allPlaces.length;
          totalVenues += cityVenues;

          // Test EVERY venue: open modal, close, toggle favorite on/off
          for (let v = 0; v < allPlaces.length; v++) {
            const venue = allPlaces[v];
            try {
              // Open detail modal
              if (typeof openDetailModalByObj === 'function') {
                openDetailModalByObj(venue.ID);
                await sleep(300);
                if (typeof closeDetailModal === 'function') closeDetailModal();
                await sleep(150);
              }
              // Toggle favorite ON then OFF (leaves state clean)
              if (typeof toggleFav === 'function') {
                toggleFav(venue.ID);
                await sleep(100);
                toggleFav(venue.ID);
                await sleep(100);
              }
              totalTested++;
              if (v % 10 === 0) updateProgress(city.name, c + 1, v, cityVenues);
            } catch(e) {
              cityErrors++;
              totalErrors++;
            }
          }

          // Test map view for this city
          if (typeof toggleViewMode === 'function' && cityVenues > 0) {
            try {
              toggleViewMode();
              await sleep(1500);
              toggleViewMode();
              await sleep(300);
            } catch(e) { cityErrors++; totalErrors++; }
          }

          // Test filters for this city
          if (typeof renderVenues === 'function') {
            try {
              const prevCat = currentCategory;
              currentCategory = 'Food'; renderVenues(); await sleep(300);
              currentCategory = 'Nightlife'; renderVenues(); await sleep(300);
              currentCategory = 'Culture'; renderVenues(); await sleep(300);
              currentCategory = 'All'; renderVenues(); await sleep(300);
              currentCategory = prevCat || 'All';
            } catch(e) { cityErrors++; totalErrors++; }
          }
        } catch(e) {
          cityErrors++;
          totalErrors++;
        }

        cityResults.push({ city: city.name, venues: cityVenues, errors: cityErrors });
        updateProgress(city.name, c + 1, cityVenues, cityVenues);
      }
    } finally {
      console.error = origError;
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const elapsedMin = Math.floor(elapsed / 60);
    const elapsedSec = elapsed % 60;

    // Show final results
    overlay.remove();
    if (typeof showScreen === 'function') showScreen('screen-browser');
    await sleep(400);
    if (typeof openHelpModal === 'function') openHelpModal();
    await sleep(500);

    const passingCities = cityResults.filter(c => c.errors === 0).length;
    const failingCities = cityResults.filter(c => c.errors > 0);

    let html = '<div id="lbl-exhaustive-results" style="margin-top:14px;padding:16px;background:var(--card,#fff);border:1px solid var(--border);border-radius:8px;font-size:15px;line-height:1.8;max-height:400px;overflow-y:auto;">';
    html += '<strong style="font-size:18px;color:' + (totalErrors === 0 ? 'var(--green,#1E7E34)' : 'var(--red,#D9534F)') + ';">🔥 Exhaustive Test Complete</strong><br><br>';
    html += '<strong>Duration:</strong> ' + elapsedMin + 'm ' + elapsedSec + 's<br>';
    html += '<strong>Cities tested:</strong> ' + CITIES_REGISTRY.length + '<br>';
    html += '<strong>Total venues tested:</strong> ' + totalTested + '<br>';
    html += '<strong>Total errors:</strong> ' + totalErrors + '<br>';
    html += '<strong>Cities passing:</strong> ' + passingCities + '/' + CITIES_REGISTRY.length + '<br>';
    html += '<strong>Console errors captured:</strong> ' + errors.length + '<br><br>';

    html += '<strong>Per-city breakdown:</strong><br>';
    html += '<table style="width:100%;font-size:13px;border-collapse:collapse;">';
    html += '<tr style="border-bottom:1px solid var(--border);"><th style="text-align:left;padding:4px;">City</th><th style="text-align:right;padding:4px;">Venues</th><th style="text-align:right;padding:4px;">Errors</th></tr>';
    cityResults.forEach(c => {
      const color = c.errors === 0 ? 'var(--green,#1E7E34)' : 'var(--red,#D9534F)';
      const icon = c.errors === 0 ? '✅' : '❌';
      html += '<tr style="border-bottom:1px solid var(--bg-main);"><td style="padding:4px;">' + icon + ' ' + c.city + '</td><td style="text-align:right;padding:4px;">' + c.venues + '</td><td style="text-align:right;padding:4px;color:' + color + ';">' + c.errors + '</td></tr>';
    });
    html += '</table><br>';

    if (failingCities.length > 0) {
      html += '<strong style="color:var(--red);">Cities with errors:</strong><br>';
      failingCities.forEach(c => { html += '• ' + c.city + ': ' + c.errors + ' errors<br>'; });
      html += '<br>';
    }

    if (errors.length > 0) {
      html += '<strong style="color:var(--red);">First 10 console errors:</strong><br>';
      errors.slice(0, 10).forEach((e, i) => { html += '<span style="font-size:12px;color:var(--text-muted);">' + (i+1) + '. ' + e + '</span><br>'; });
      html += '<br>';
    }

    html += '<em>Test methodology: For each of 49 cities → load city → for each venue → open detail modal (300ms) → close (150ms) → toggle favorite ON (100ms) → toggle favorite OFF (100ms). Plus map toggle and 3 filter cycles per city.</em>';
    html += '</div>';

    const old = document.getElementById('lbl-exhaustive-results'); if (old) old.remove();
    document.getElementById('modal-help')?.querySelector('.modal-dialog')?.insertAdjacentHTML('beforeend', html);

    if (btn) { btn.textContent = '🔥 Run Exhaustive Test (ALL 49 cities / ~2,500 venues / 20-40 min)'; btn.disabled = false; }
    console.log('%c═══ Exhaustive Test: ' + totalTested + ' venues, ' + totalErrors + ' errors, ' + elapsedMin + 'm' + elapsedSec + 's ═══', 'font-size:14px;font-weight:bold;color:' + (totalErrors === 0 ? '#128C7E' : '#D9534F'));
    window.__lblExhaustiveResults = { cityResults, totalVenues, totalTested, totalErrors, elapsed, errors };
  }

  // ═══════════════════════════════════════════════════════════
  // FAST TEST
  // ═══════════════════════════════════════════════════════════
  async function runFastTest() {
    const btn = document.getElementById('btn-fast-test');
    if (btn) { btn.textContent = '⏳ Running...'; btn.disabled = true; }
    closeHelpModal();

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const results = [], errors = [];
    const origError = console.error;
    console.error = function(...a) { errors.push(a.join(' ').slice(0,200)); origError.apply(console, a); };
    window.addEventListener('error', e => errors.push('Uncaught: ' + e.message));
    window.confirm = () => true; window.alert = () => {};

    function rec(name, pass, detail) { results.push({name, pass, detail}); }
    const start = Date.now();

    // 1. App shell
    const screens = ['screen-splash','screen-welcome','screen-legal','screen-onboarding','screen-cities','screen-browser','screen-prefs','screen-itinerary','screen-favorites'];
    rec('App Shell', screens.every(id => document.getElementById(id)), screens.length + ' screens');

    // 2. City load + dedup
    try { await loadCityData(CITIES_REGISTRY[0]); await sleep(1500); renderVenues(); await sleep(800);
      const c = allPlaces?.length || 0; const di = window.__lblLastDedupInfo;
      rec('City + Dedup', c > 0, c + ' venues, ' + (di ? di.removed + ' dupes removed' : 'no dedup info'));
    } catch(e) { rec('City Load', false, e.message); }

    // 3. 10 detail modals
    let me = 0; const tc = Math.min(10, allPlaces?.length || 0);
    for (let i = 0; i < tc; i++) { try { openDetailModalByObj(allPlaces[i].ID); await sleep(500); closeDetailModal(); await sleep(200); } catch(e) { me++; } }
    rec('Detail Modals', me === 0, tc + ' tested, ' + me + ' errors');

    // 4. 10 favorites
    let fe = 0;
    for (let i = 0; i < tc; i++) { try { toggleFav(allPlaces[i].ID); await sleep(200); toggleFav(allPlaces[i].ID); await sleep(200); } catch(e) { fe++; } }
    rec('Favorites', fe === 0, tc + ' toggled, ' + fe + ' errors');

    // 5. Map
    try { toggleViewMode(); await sleep(2000);
      const v = document.getElementById('browse-map-container')?.style.display === 'block';
      const hi = !!mapInstance; const mc = mapMarkers?.length || 0;
      const ht = document.querySelectorAll('.leaflet-tile').length > 0;
      const mh = document.getElementById('browse-map-container')?.getBoundingClientRect().height || 0;
      toggleViewMode(); await sleep(500);
      rec('Map', v && hi && mc > 0, 'visible=' + v + ', markers=' + mc + ', tiles=' + ht + ', height=' + mh + 'px');
    } catch(e) { rec('Map', false, e.message); }

    // 6. Filter
    try { currentCategory = 'Food'; renderVenues(); await sleep(500); const fc = document.querySelectorAll('.venue-card').length; currentCategory = 'All'; renderVenues(); await sleep(500); rec('Filter', fc > 0, 'Food=' + fc + ', All=' + allPlaces.length); } catch(e) { rec('Filter', false, e.message); }

    // 7. Search
    try { handleSearch('restaurant'); await sleep(500); const sc = document.querySelectorAll('.venue-card').length; handleSearch(''); await sleep(500); rec('Search', sc > 0, sc + ' results'); } catch(e) { rec('Search', false, e.message); }

    // 8. Navigation back/forward
    try {
      if (window.__lblScreenHistory) window.__lblScreenHistory.length = 0;
      showScreen('screen-cities'); await sleep(600); const ca = document.querySelector('.screen.active')?.id === 'screen-cities';
      showScreen('screen-favorites'); await sleep(600); const fa = document.querySelector('.screen.active')?.id === 'screen-favorites';
      if (window.lblGoBack) { window.lblGoBack(); await sleep(800); } else { history.back(); await sleep(800); }
      const wb = document.querySelector('.screen.active')?.id === 'screen-cities';
      rec('Nav Back', ca && fa && wb, 'cities=' + ca + ', favs=' + fa + ', back=' + wb);
    } catch(e) { rec('Nav Back', false, e.message); }

    // 9. Filter chaos
    try { showScreen('screen-browser'); await sleep(500); const se = errors.length;
      for (let i = 0; i < 10; i++) { toggleOpenNow(); await sleep(200); toggleOpenNow(); await sleep(200); toggleHiddenGems(); await sleep(200); toggleHiddenGems(); await sleep(200); }
      resetAllFilters(); await sleep(500); rec('Filter Chaos', errors.length - se === 0, '40 toggles, ' + (errors.length-se) + ' errors');
    } catch(e) { rec('Filter Chaos', false, e.message); }

    // 10. Modal chaos
    try { const se = errors.length; for (let i = 0; i < 10; i++) { const v = allPlaces[Math.floor(Math.random()*allPlaces.length)]; openDetailModalByObj(v.ID); await sleep(200); closeDetailModal(); await sleep(200); } rec('Modal Chaos', errors.length-se === 0, '10 opens, ' + (errors.length-se) + ' errors'); } catch(e) { rec('Modal Chaos', false, e.message); }

    // 11. Fonts — 14px threshold (Apple HIG 11pt = 14.7px)
    try { let sc = 0; document.querySelectorAll('*').forEach(el => { if (el.offsetParent === null) return; if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return; const fs = parseFloat(getComputedStyle(el).fontSize); if (!isNaN(fs) && fs > 0 && fs < 14) sc++; }); rec('Fonts', sc === 0, sc === 0 ? 'All ≥14px (Apple HIG)' : sc + ' below 14px'); } catch(e) { rec('Fonts', false, e.message); }

    // 12. Touch targets — 44px threshold
    try { let st = 0; const failing = []; document.querySelectorAll('button, .sort-pill, .nav-btn, [role=button], .icon-btn, .venue-fav-btn').forEach(b => { if (b.offsetParent === null) return; const r = b.getBoundingClientRect(); if (r.height < 44 || r.width < 44) { st++; if (failing.length < 5) failing.push((b.id||b.className||b.textContent?.slice(0,15)) + '(' + Math.round(r.width) + '×' + Math.round(r.height) + ')'); } }); rec('Touch Targets', st === 0, st === 0 ? 'All ≥44px' : st + ' below 44px: ' + failing.join(', ')); } catch(e) { rec('Touch Targets', false, e.message); }

    // 13. SW
    try { const regs = await navigator.serviceWorker?.getRegistrations() || []; rec('Service Worker', regs.length > 0, regs.length > 0 ? 'Active: ' + regs[0].active?.scriptURL : 'Not registered'); } catch(e) { rec('SW', false, e.message); }

    // 14. Dedup
    try { const i = window.__lblLastDedupInfo; rec('Dedup', !!i, i ? 'Orig:' + i.original + ' Dedup:' + i.deduped + ' Removed:' + i.removed : 'No info'); } catch(e) { rec('Dedup', false, e.message); }

    // 15. Device info
    const dev = window.__lblDeviceInfo || {};
    rec('Device', true, (dev.type||'?') + '/' + (dev.os||'?') + ' ' + (dev.screenWidth||'?') + 'x' + (dev.screenHeight||'?'));

    console.error = origError;
    const elapsed = Math.round((Date.now() - start) / 1000);
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;

    // Show results
    showScreen('screen-browser'); await sleep(500); openHelpModal(); await sleep(600);
    let html = '<div id="lbl-fast-test-results" style="margin-top:14px;padding:16px;background:var(--card,#fff);border:1px solid var(--border);border-radius:8px;font-size:15px;line-height:2;">';
    html += '<strong style="font-size:18px;color:' + (failed === 0 ? 'var(--green,#1E7E34)' : 'var(--red,#D9534F)') + ';">⚡ Quick Smoke Test: ' + passed + '/' + results.length + ' passed (' + elapsed + 's)</strong><br><br>';
    results.forEach(r => { html += (r.pass ? '✅' : '❌') + ' <strong>' + r.name + '</strong>: ' + r.detail + '<br>'; });
    if (errors.length > 0) html += '<br><strong style="color:var(--red);">Console errors: ' + errors.length + '</strong><br>';
    html += '</div>';
    const old = document.getElementById('lbl-fast-test-results'); if (old) old.remove();
    document.getElementById('modal-help')?.querySelector('.modal-dialog')?.insertAdjacentHTML('beforeend', html);

    if (btn) { btn.textContent = '⚡ Run Quick Smoke Test (1 city, 10 venues, ~2 min)'; btn.disabled = false; }
    console.log('%c═══ Fast Test: ' + passed + '/' + results.length + ' (' + elapsed + 's) ═══', 'font-size:14px;font-weight:bold;color:' + (failed === 0 ? '#128C7E' : '#D9534F'));
    window.__lblFastTestResults = { results, passed, failed, elapsed, errors };
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN CAPTURE
  // ═══════════════════════════════════════════════════════════
  async function captureScreens() {
    const btn = document.getElementById('btn-screen-capture');
    if (btn) { btn.textContent = '📸 Capturing...'; btn.disabled = true; }
    closeHelpModal();
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const screens = [
      { name: 'Cities', id: 'screen-cities' },
      { name: 'Browse', id: 'screen-browser' },
      { name: 'Map', id: 'screen-browser', action: 'map' },
      { name: 'Itinerary', id: 'screen-prefs' },
      { name: 'Favorites', id: 'screen-favorites' },
      { name: 'Help', id: 'modal-help', isModal: true },
    ];

    const captures = [];

    for (const s of screens) {
      try {
        if (s.isModal) { showScreen('screen-browser'); await sleep(500); openHelpModal(); await sleep(500); }
        else { showScreen(s.id); await sleep(500); }

        if (s.action === 'map') {
          if (typeof allPlaces === 'undefined' || allPlaces.length === 0) { await loadCityData(CITIES_REGISTRY[0]); await sleep(800); renderVenues(); await sleep(800); }
          toggleViewMode(); await sleep(1500);
        }

        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#F8F9FA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1B365D';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(s.name + ' — ' + new Date().toLocaleTimeString(), 20, 40);
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#4A5568';
        ctx.fillText('Size: ' + window.innerWidth + 'x' + window.innerHeight, 20, 70);
        ctx.fillText('Device: ' + (window.__lblDeviceInfo?.type || 'Unknown') + '/' + (window.__lblDeviceInfo?.os || '?'), 20, 90);

        const venueCount = document.querySelectorAll('.venue-card').length;
        const cityCount = document.querySelectorAll('.city-card, .city-tile').length;
        ctx.fillText('Venues visible: ' + venueCount, 20, 120);
        ctx.fillText('Cities visible: ' + cityCount, 20, 140);

        const dataUrl = canvas.toDataURL('image/png');
        captures.push({ name: s.name, captured: true, size: Math.round(dataUrl.length / 1024) + 'KB' });

        if (s.action === 'map') { toggleViewMode(); await sleep(500); }
        if (s.isModal) { closeHelpModal(); await sleep(200); }
      } catch(e) {
        captures.push({ name: s.name, captured: false, error: e.message });
      }
    }

    showScreen('screen-browser'); await sleep(500); openHelpModal(); await sleep(600);
    let html = '<div id="lbl-capture-results" style="margin-top:14px;padding:16px;background:var(--card,#fff);border:1px solid var(--border);border-radius:8px;font-size:15px;line-height:2;">';
    html += '<strong style="font-size:18px;color:var(--primary,#1B365D);">📸 Screen Capture Results</strong><br><br>';
    captures.forEach(c => { html += (c.captured ? '✅' : '❌') + ' <strong>' + c.name + '</strong>: ' + (c.captured ? c.size : c.error) + '<br>'; });
    html += '<br><em>Note: Full DOM screenshots require the html2canvas library. These captures record screen dimensions, visible element counts, and device info for each screen.</em>';
    html += '</div>';
    const old = document.getElementById('lbl-capture-results'); if (old) old.remove();
    document.getElementById('modal-help')?.querySelector('.modal-dialog')?.insertAdjacentHTML('beforeend', html);

    if (btn) { btn.textContent = '📸 Capture Screenshots'; btn.disabled = false; }
    window.__lblCaptureResults = captures;
  }

  // Apply all fixes
  function applyAll() {
    fixFonts();
    registerServiceWorker();
    patchDuplicates();
    fixNavigation();
    fixMapSizing();
    injectButtons();
    console.log('%c[LBL v3.57] All fixes applied ✓', 'color:#128C7E;font-weight:bold');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll);
  else setTimeout(applyAll, 800);
})();
