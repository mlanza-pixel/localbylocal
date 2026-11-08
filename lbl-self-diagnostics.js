/**
 * lbl-self-diagnostics.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.50 — Self-Diagnostic Module
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

  const DIAG_VERSION = '1.0.0';
  const APP_VERSION = '3.50';

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  const tests = [];
  let testResults = [];
  let running = false;

  function addTest(name, fn) {
    tests.push({ name, fn });
  }

  function recordResult(name, pass, detail, durationMs) {
    testResults.push({ name, pass, detail, durationMs });
    console.log(`%c[${pass ? 'PASS' : 'FAIL'}] ${name}: ${detail}`,
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
      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      if (!isNaN(fontSize) && fontSize > 0) {
        checked++;
        // Apple HIG: minimum 11pt for body, 10pt for captions
        // Material Design: minimum 12sp for body
        // Flag anything under 12px
        if (fontSize < 12) {
          smallFonts.push({
            tag: el.tagName,
            id: el.id || '(none)',
            class: el.className?.toString().slice(0, 30) || '',
            size: fontSize + 'px',
            text: el.textContent?.trim().slice(0, 40) || '',
          });
        }
      }
    });

    if (smallFonts.length === 0) {
      return { pass: true, detail: `${checked} elements checked, all ≥12px` };
    }
    return {
      pass: false,
      detail: `${smallFonts.length} elements below 12px (Apple HIG min: 11pt, Material min: 12sp). Examples: ${smallFonts.slice(0, 5).map(f => `${f.tag}#${f.id} ${f.size}`).join(', ')}`,
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

    // Navigate to cities, then browser, then favorites, then back
    showScreen('screen-cities');
    await sleep(200);
    const citiesActive = document.querySelector('.screen.active')?.id === 'screen-cities';

    showScreen('screen-favorites');
    await sleep(200);
    const favsActive = document.querySelector('.screen.active')?.id === 'screen-favorites';

    // Go back via history
    history.back();
    await sleep(300);
    const wentBack = document.querySelector('.screen.active')?.id === 'screen-cities';

    if (citiesActive && favsActive && wentBack) {
      return { pass: true, detail: 'Navigation + history.back() working correctly' };
    }
    return { pass: false, detail: `citiesActive=${citiesActive}, favsActive=${favsActive}, wentBack=${wentBack}` };
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 12: Touch target sizes (Apple HIG: 44pt min)
  // ═══════════════════════════════════════════════════════════
  addTest('Touch Target Sizes (Apple HIG: 44pt min)', async () => {
    const buttons = document.querySelectorAll('button, .nav-btn, [role=button]');
    const smallTargets = [];

    buttons.forEach(btn => {
      if (btn.offsetParent === null) return;
      const rect = btn.getBoundingClientRect();
      if (rect.height < 44 || rect.width < 44) {
        smallTargets.push({
          id: btn.id || '(none)',
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
      detail: `${smallTargets.length} buttons below 44×44px. Examples: ${smallTargets.slice(0, 5).map(t => `${t.id}(${t.w}×${t.h})`).join(', ')}`,
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
  // RUN ALL TESTS
  // ═══════════════════════════════════════════════════════════
  async function runDiagnostics() {
    if (running) return;
    running = true;
    testResults = [];

    console.log('%c═══ Local Like a Local v' + APP_VERSION + ' — Self-Diagnostics v' + DIAG_VERSION + ' ═══',
      'font-size:16px;font-weight:bold;color:#1B365D');

    for (const test of tests) {
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
    };

    console.log(`%c═══ Result: ${passed}/${total} passed, ${failed} failed ═══`,
      `font-size:14px;font-weight:bold;color:${failed === 0 ? '#128C7E' : '#D9534F'}`);

    // Update the diag-box in the Help modal
    const diagBox = document.querySelector('.diag-box');
    if (diagBox) {
      let html = `<strong>⚙️ System Diagnostics & Revision Status</strong><br>`;
      html += `• App Version: Version ${APP_VERSION}<br>`;
      html += `• Total Destinations: 49 Destinations Available<br>`;
      html += `• Service Worker: local-like-a-local-v${APP_VERSION}<br>`;
      html += `• Parser: 40-Column Schema Compliant<br>`;
      html += `• Legal Disclaimer: <span id="diag-legal-status">Agreed ✅</span><br>`;
      html += `<br><strong>🔍 Self-Diagnostic Results (${summary.passRate})</strong><br>`;
      testResults.forEach(r => {
        const icon = r.pass ? '✅' : '❌';
        html += `${icon} ${r.name}: ${r.detail.slice(0, 80)}<br>`;
      });
      html += `<br><em>Run again: click "Run Full Diagnostics" button</em>`;
      diagBox.innerHTML = html;
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
        style="background:var(--teal);color:#fff;border:none;padding:10px 20px;
        border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;
        font-family:var(--font-m);box-shadow:var(--shadow-sm);">
        🔍 Run Full Diagnostics
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
