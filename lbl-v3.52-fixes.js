/**
 * lbl-v3.52-fixes.js
 * Local Like a Local v3.52 — Remaining Issue Fixes + Auto-Test
 *
 * Includes:
 *   1. Font sizes on dynamically-rendered venue cards
 *   2. Touch targets on sort buttons
 *   3. Duplicate venue detection in city data loader
 *   4. Navigation back/forward reliability
 *   5. Auto-inject "Run Fast Test" button into Help modal
 */

(function() {
  'use strict';
  console.log('%c[LBL v3.52] Applying remaining fixes...', 'color:#CC5500;font-weight:bold');

  // FIX 1: Font sizes on dynamically-rendered elements
  function fixDynamicFonts() {
    const style = document.createElement('style');
    style.id = 'lbl-v352-font-fixes';
    style.textContent = `
      .venue-score { font-size: 13px !important; }
      .btn-card-action { font-size: 13px !important; min-height: 44px !important; }
      .btn-card-action.primary { font-size: 13px !important; min-height: 44px !important; }
      .app-badge { font-size: 12px !important; }
      .venue-meta-bar { font-size: 13px !important; }
      .venue-meta-bar span { font-size: 13px !important; }
      .venue-actions button { font-size: 13px !important; min-height: 44px !important; }
      .venue-cat { font-size: 13px !important; }
      .venue-sub { font-size: 13px !important; }
      .venue-neighborhood { font-size: 13px !important; }
      .venue-price { font-size: 13px !important; }
      .sort-btn, .city-sort-rating, .city-sort-alpha { min-height: 44px !important; min-width: 44px !important; font-size: 13px !important; padding: 10px 16px !important; }
      .modal-close-btn { min-width: 44px !important; min-height: 44px !important; font-size: 20px !important; }
      #detail-modal-body { font-size: 14px !important; }
      #detail-modal-body strong, #detail-modal-body b { font-size: 15px !important; }
      .venue-card .venue-title { font-size: 16px !important; }
    `;
    document.head.appendChild(style);

    // MutationObserver to catch dynamically rendered elements
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          const els = node.querySelectorAll ? node.querySelectorAll('*') : [];
          els.forEach(el => {
            const fs = parseFloat(getComputedStyle(el).fontSize);
            if (!isNaN(fs) && fs > 0 && fs < 12) el.style.fontSize = '12px';
          });
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('  [v3.52-1] Dynamic font fixes + MutationObserver injected');
  }

  // FIX 2: Duplicate venue detection
  function patchDuplicateDetection() {
    if (typeof normalizeCityData !== 'function') return;
    const origNormalize = normalizeCityData;
    window.normalizeCityData = function(rawList) {
      let normalized = origNormalize(rawList);
      const seenIds = new Set();
      const seenNames = new Set();
      const duplicates = [];
      const deduped = [];
      normalized.forEach(p => {
        const id = p.ID || '';
        const nameKey = (p.Name || '').toLowerCase().trim();
        const cityKey = (p.Address_City || '').toLowerCase().trim();
        const compositeKey = nameKey + '|' + cityKey;
        if (seenIds.has(id)) { duplicates.push({ id, name: p.Name, reason: 'duplicate ID' }); }
        else if (seenNames.has(compositeKey)) { duplicates.push({ id, name: p.Name, reason: 'duplicate name+city' }); }
        else { seenIds.add(id); seenNames.add(compositeKey); deduped.push(p); }
      });
      if (duplicates.length > 0) console.warn(`[v3.52] Removed ${duplicates.length} duplicate venues`);
      window.__lblLastDedupInfo = { originalCount: normalized.length, dedupedCount: deduped.length, duplicatesRemoved: duplicates.length, duplicateSamples: duplicates.slice(0, 10) };
      return deduped;
    };
    console.log('  [v3.52-2] Duplicate venue detection patched');
  }

  // FIX 3: Navigation back/forward
  function fixNavigation() {
    if (typeof showScreen !== 'function') return;
    window.__lblScreenHistory = [];
    const origShowScreen = showScreen;
    window.showScreen = function(id, pushHash) {
      const currentActive = document.querySelector('.screen.active')?.id;
      if (currentActive && currentActive !== id) {
        window.__lblScreenHistory.push(currentActive);
        if (window.__lblScreenHistory.length > 20) window.__lblScreenHistory.shift();
      }
      return origShowScreen.call(window, id, pushHash);
    };
    window.lblGoBack = function() {
      const history = window.__lblScreenHistory;
      if (history && history.length > 0) { const prev = history.pop(); showScreen(prev, false); return true; }
      if (window.history.length > 1) { window.history.back(); return true; }
      return false;
    };
    console.log('  [v3.52-3] Navigation history stack + lblGoBack() added');
  }

  // FIX 4: Auto-inject Fast Test button into Help modal
  function injectFastTestButton() {
    const helpModal = document.getElementById('modal-help');
    if (!helpModal) { setTimeout(injectFastTestButton, 1000); return; }
    if (document.getElementById('btn-fast-test')) return;

    const btn = document.createElement('button');
    btn.id = 'btn-fast-test';
    btn.textContent = '⚡ Run Fast Test (60 sec)';
    btn.style.cssText = 'display:block;margin-top:10px;background:var(--accent,#CC5500);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;width:100%;font-family:var(--font-m);';
    btn.onclick = runFastTest;

    // Also add dedup button
    const dedupBtn = document.createElement('button');
    dedupBtn.id = 'lbl-dedup-report';
    dedupBtn.textContent = '🔍 Check for Duplicate Venues';
    dedupBtn.style.cssText = 'display:block;margin-top:8px;background:var(--teal,#128C7E);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;width:100%;font-family:var(--font-m);';
    dedupBtn.onclick = function() {
      const info = window.__lblLastDedupInfo;
      if (!info) { alert('Load a city first, then check duplicates.'); return; }
      const msg = `Duplicate Check Results:\n\nOriginal: ${info.originalCount}\nAfter dedup: ${info.dedupedCount}\nRemoved: ${info.duplicatesRemoved}\n` + (info.duplicatesRemoved > 0 ? '\nSamples:\n' + info.duplicateSamples.map(d => '  • ' + d.name + ' (' + d.reason + ')').join('\n') : '\n✅ No duplicates!');
      alert(msg);
    };

    const container = document.createElement('div');
    container.style.cssText = 'margin-top:14px;';
    container.appendChild(btn);
    container.appendChild(document.createElement('br'));
    container.appendChild(dedupBtn);

    const diagBox = helpModal.querySelector('.diag-box');
    if (diagBox) { diagBox.parentElement.insertBefore(container, diagBox.nextSibling); }
    else { helpModal.querySelector('.modal-dialog').appendChild(container); }
    console.log('  [v3.52-4] Fast Test + Dedup buttons injected into Help modal');
  }

  // FAST TEST — runs in under 60 seconds, shows results on screen
  async function runFastTest() {
    const btn = document.getElementById('btn-fast-test');
    if (btn) { btn.textContent = '⏳ Running tests...'; btn.disabled = true; }

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const results = [];
    const errors = [];
    const origError = console.error;
    console.error = function(...args) { errors.push(args.join(' ').slice(0,200)); origError.apply(console, args); };
    window.addEventListener('error', e => errors.push('Uncaught: ' + e.message));
    window.confirm = () => true; window.alert = () => {};

    function record(name, pass, detail) { results.push({ name, pass, detail }); }

    console.log('%c═══ Fast Test Started ═══', 'font-size:14px;font-weight:bold;color:#1B365D');
    const start = Date.now();

    // 1. App shell
    const screens = ['screen-splash','screen-welcome','screen-legal','screen-onboarding','screen-cities','screen-browser','screen-prefs','screen-itinerary','screen-favorites'];
    const missing = screens.filter(id => !document.getElementById(id));
    record('App Shell', missing.length === 0, missing.length === 0 ? '9 screens' : 'Missing: ' + missing.join(','));

    // 2. City load + dedup
    try {
      await loadCityData(CITIES_REGISTRY[0]); await sleep(500);
      renderVenues(); await sleep(300);
      const count = allPlaces ? allPlaces.length : 0;
      const di = window.__lblLastDedupInfo;
      record('City Load + Dedup', count > 0, count + ' venues' + (di ? ', ' + di.duplicatesRemoved + ' dupes removed' : ''));
    } catch(e) { record('City Load', false, e.message); }

    // 3. 10 detail modals
    let me = 0; const tc = Math.min(10, allPlaces.length);
    for (let i = 0; i < tc; i++) { try { openDetailModalByObj(allPlaces[i].ID); await sleep(100); closeDetailModal(); await sleep(50); } catch(e) { me++; } }
    record('Detail Modals (10)', me === 0, tc + ' opened, ' + me + ' errors');

    // 4. 10 favorites
    let fe = 0;
    for (let i = 0; i < tc; i++) { try { toggleFav(allPlaces[i].ID); await sleep(30); toggleFav(allPlaces[i].ID); await sleep(30); } catch(e) { fe++; } }
    record('Favorites (10)', fe === 0, tc + ' toggled, ' + fe + ' errors');

    // 5. Map
    try {
      toggleViewMode(); await sleep(1000);
      const v = document.getElementById('browse-map-container')?.style.display === 'block';
      const hi = !!mapInstance; const mc = mapMarkers ? mapMarkers.length : 0;
      const ht = document.querySelectorAll('.leaflet-tile').length > 0;
      toggleViewMode(); await sleep(200);
      record('Map View', v && hi && mc > 0, 'visible=' + v + ', markers=' + mc + ', tiles=' + ht);
    } catch(e) { record('Map View', false, e.message); }

    // 6. Filter
    try { currentCategory = 'Food'; renderVenues(); await sleep(200); const fc = document.querySelectorAll('.venue-card').length; currentCategory = 'All'; renderVenues(); await sleep(200); record('Filter', fc > 0, 'Food=' + fc + ', All=' + allPlaces.length); } catch(e) { record('Filter', false, e.message); }

    // 7. Search
    try { handleSearch('restaurant'); await sleep(200); const sc = document.querySelectorAll('.venue-card').length; handleSearch(''); await sleep(200); record('Search', sc > 0, sc + ' results'); } catch(e) { record('Search', false, e.message); }

    // 8. Navigation
    try {
      showScreen('screen-cities'); await sleep(200); const ca = document.querySelector('.screen.active')?.id === 'screen-cities';
      showScreen('screen-favorites'); await sleep(200); const fa = document.querySelector('.screen.active')?.id === 'screen-favorites';
      if (window.lblGoBack) { window.lblGoBack(); await sleep(300); } else { history.back(); await sleep(300); }
      const wb = document.querySelector('.screen.active')?.id === 'screen-cities';
      record('Nav Back', ca && fa && wb, 'cities=' + ca + ', favs=' + fa + ', back=' + wb);
    } catch(e) { record('Nav Back', false, e.message); }

    // 9. Filter chaos
    try { showScreen('screen-browser'); await sleep(200); const se = errors.length; for (let i = 0; i < 10; i++) { toggleOpenNow(); await sleep(80); toggleOpenNow(); await sleep(80); toggleHiddenGems(); await sleep(80); toggleHiddenGems(); await sleep(80); } resetAllFilters(); await sleep(200); record('Filter Chaos (10x)', errors.length - se === 0, '40 toggles, ' + (errors.length - se) + ' errors'); } catch(e) { record('Filter Chaos', false, e.message); }

    // 10. Modal chaos
    try { const se = errors.length; for (let i = 0; i < 10; i++) { const v = allPlaces[Math.floor(Math.random() * allPlaces.length)]; openDetailModalByObj(v.ID); await sleep(80); closeDetailModal(); await sleep(50); } record('Modal Chaos (10x)', errors.length - se === 0, '10 opens, ' + (errors.length - se) + ' errors'); } catch(e) { record('Modal Chaos', false, e.message); }

    // 11. Fonts
    try { let sc = 0; document.querySelectorAll('.venue-card *').forEach(el => { if (el.offsetParent === null) return; const fs = parseFloat(getComputedStyle(el).fontSize); if (!isNaN(fs) && fs > 0 && fs < 12) sc++; }); record('Fonts', sc === 0, sc === 0 ? 'All ≥12px' : sc + ' below 12px'); } catch(e) { record('Fonts', false, e.message); }

    // 12. Touch targets
    try { const btns = document.querySelectorAll('.sort-btn, .city-sort-rating, .city-sort-alpha, .modal-close-btn, .btn-card-action'); let st = 0; btns.forEach(b => { if (b.offsetParent === null) return; const r = b.getBoundingClientRect(); if (r.height < 44 || r.width < 44) st++; }); record('Touch Targets', st === 0, st === 0 ? 'All ≥44px' : st + ' below 44px'); } catch(e) { record('Touch Targets', false, e.message); }

    // 13. Duplicates
    try { const info = window.__lblLastDedupInfo; if (info) { record('Dedup', info.duplicatesRemoved >= 0, 'Original: ' + info.originalCount + ', Deduped: ' + info.dedupedCount + ', Removed: ' + info.duplicatesRemoved); } else { record('Dedup', false, 'No info'); } } catch(e) { record('Dedup', false, e.message); }

    // 14. Diagnostics button
    record('Diagnostics UI', !!document.getElementById('btn-run-diagnostics'), 'Button present: ' + !!document.getElementById('btn-run-diagnostics'));

    console.error = origError;
    const elapsed = Math.round((Date.now() - start) / 1000);
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;

    // Show results on screen in the Help modal
    const resultDiv = document.createElement('div');
    resultDiv.id = 'lbl-fast-test-results';
    resultDiv.style.cssText = 'margin-top:14px;padding:14px;background:var(--card,#fff);border:1px solid var(--border,#E2E8F0);border-radius:8px;font-size:13px;line-height:1.8;';
    let html = '<strong style="font-size:15px;color:' + (failed === 0 ? 'var(--green,#1E7E34)' : 'var(--red,#D9534F)') + ';">⚡ Fast Test: ' + passed + '/' + results.length + ' passed (' + elapsed + 's)</strong><br><br>';
    results.forEach(r => { html += (r.pass ? '✅' : '❌') + ' <strong>' + r.name + '</strong>: ' + r.detail + '<br>'; });
    if (errors.length > 0) html += '<br><strong style="color:var(--red,#D9534F);">Console errors: ' + errors.length + '</strong><br>';
    resultDiv.innerHTML = html;

    const oldResults = document.getElementById('lbl-fast-test-results');
    if (oldResults) oldResults.remove();
    const helpModal = document.getElementById('modal-help');
    helpModal?.querySelector('.modal-dialog')?.appendChild(resultDiv);

    if (btn) { btn.textContent = '⚡ Run Fast Test (60 sec)'; btn.disabled = false; }

    console.log('%c═══ Fast Test: ' + passed + '/' + results.length + ' passed, ' + failed + ' failed, ' + elapsed + 's ═══', 'font-size:14px;font-weight:bold;color:' + (failed === 0 ? '#128C7E' : '#D9534F'));
    window.__lblFastTestResults = { results, passed, failed, elapsed, errors };
    return { passed, failed, elapsed };
  }

  // Apply all fixes
  function applyAll() {
    fixDynamicFonts();
    patchDuplicateDetection();
    fixNavigation();
    injectFastTestButton();
    console.log('%c[LBL v3.52] All fixes applied ✓', 'color:#CC5500;font-weight:bold');
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', applyAll); }
  else { setTimeout(applyAll, 800); }
})();
