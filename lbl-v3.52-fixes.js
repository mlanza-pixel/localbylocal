/**
 * lbl-v3.52-fixes.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.52 — Remaining Issue Fixes
 *
 * Fixes the 4 issues found in v3.51 live testing:
 *   1. Font sizes on dynamically-rendered venue cards (11px → 13px)
 *   2. Touch targets on sort buttons (28px → 44px min)
 *   3. Duplicate venue detection in city data loader
 *   4. Navigation back/forward reliability
 *
 * This script EXTENDS lbl-v3.51-fixes.js (load both).
 * Add AFTER lbl-v3.51-fixes.js and lbl-responsive-fixes.js.
 */

(function() {
  'use strict';
  console.log('%c[LBL v3.52] Applying remaining fixes...', 'color:#CC5500;font-weight:bold');

  // ═══════════════════════════════════════════════════════════
  // FIX 1: Font sizes on dynamically-rendered elements
  // ═══════════════════════════════════════════════════════════
  function fixDynamicFonts() {
    const style = document.createElement('style');
    style.id = 'lbl-v352-font-fixes';
    style.textContent = `
      /* Venue card elements that are rendered dynamically */
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

      /* Sort buttons — fix touch targets */
      .sort-btn, .city-sort-rating, .city-sort-alpha {
        min-height: 44px !important;
        min-width: 44px !important;
        font-size: 13px !important;
        padding: 10px 16px !important;
      }

      /* Modal close button — fix touch target */
      .modal-close-btn {
        min-width: 44px !important;
        min-height: 44px !important;
        font-size: 20px !important;
      }

      /* Detail modal content */
      .detail-modal-body, #detail-modal-body {
        font-size: 14px !important;
      }
      #detail-modal-body * {
        font-size: inherit !important;
      }
      #detail-modal-body strong, #detail-modal-body b {
        font-size: 15px !important;
      }
      #detail-modal-body .venue-detail-section {
        font-size: 14px !important;
      }

      /* Catch-all: any element still below 12px after all overrides */
      .venue-card *, .city-card *, .modal-dialog *, .bottom-nav * {
        font-size: inherit;
      }
      .venue-card .venue-title { font-size: 16px !important; }
      .venue-card .venue-score { font-size: 13px !important; }
      .venue-card .btn-card-action { font-size: 13px !important; }
    `;
    document.head.appendChild(style);

    // Also use a MutationObserver to catch dynamically rendered elements
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          // Fix any sub-12px elements in the added node
          const small = node.querySelectorAll ? node.querySelectorAll('*') : [];
          small.forEach(el => {
            const fs = parseFloat(getComputedStyle(el).fontSize);
            if (!isNaN(fs) && fs > 0 && fs < 12) {
              el.style.fontSize = '12px';
            }
          });
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('  [v3.52-1] Dynamic font fixes + MutationObserver injected');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 2: Duplicate venue detection in city data loader
  // ═══════════════════════════════════════════════════════════
  function patchDuplicateDetection() {
    if (typeof normalizeCityData !== 'function') return;

    const origNormalize = normalizeCityData;
    window.normalizeCityData = function(rawList) {
      let normalized = origNormalize(rawList);

      // Deduplicate by ID
      const seenIds = new Set();
      const seenNames = new Set();
      const duplicates = [];
      const deduped = [];

      normalized.forEach(p => {
        const id = p.ID || '';
        const nameKey = (p.Name || '').toLowerCase().trim();
        const cityKey = (p.Address_City || '').toLowerCase().trim();
        const compositeKey = nameKey + '|' + cityKey;

        if (seenIds.has(id)) {
          duplicates.push({ id, name: p.Name, reason: 'duplicate ID' });
        } else if (seenNames.has(compositeKey)) {
          duplicates.push({ id, name: p.Name, reason: 'duplicate name+city' });
        } else {
          seenIds.add(id);
          seenNames.add(compositeKey);
          deduped.push(p);
        }
      });

      if (duplicates.length > 0) {
        console.warn(`[v3.52] Removed ${duplicates.length} duplicate venues from city data`);
        console.log('  Duplicates removed:', duplicates.slice(0, 5).map(d => `${d.name} (${d.reason})`));
      }

      // Store dedup count for diagnostics
      window.__lblLastDedupInfo = {
        originalCount: normalized.length,
        dedupedCount: deduped.length,
        duplicatesRemoved: duplicates.length,
        duplicateSamples: duplicates.slice(0, 10),
      };

      return deduped;
    };

    console.log('  [v3.52-2] Duplicate venue detection patched into normalizeCityData()');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 3: Navigation back/forward reliability
  // ═══════════════════════════════════════════════════════════
  function fixNavigation() {
    // Patch showScreen to store screen history more reliably
    if (typeof showScreen !== 'function') return;

    // Build a simple history stack the app can use
    window.__lblScreenHistory = window.__lblScreenHistory || [];

    const origShowScreen = showScreen;
    window.showScreen = function(id, pushHash) {
      // Track history
      const currentActive = document.querySelector('.screen.active')?.id;
      if (currentActive && currentActive !== id) {
        window.__lblScreenHistory.push(currentActive);
        // Keep history to last 20 entries
        if (window.__lblScreenHistory.length > 20) {
          window.__lblScreenHistory.shift();
        }
      }

      // Call original
      return origShowScreen.call(window, id, pushHash);
    };

    // Add a reliable back function
    window.lblGoBack = function() {
      const history = window.__lblScreenHistory;
      if (history && history.length > 0) {
        const prev = history.pop();
        showScreen(prev, false); // false = don't push another history entry
        return true;
      }
      // Fall back to browser history
      if (window.history.length > 1) {
        window.history.back();
        return true;
      }
      return false;
    };

    console.log('  [v3.52-3] Navigation history stack + lblGoBack() added');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 4: Update diagnostics to include dedup info
  // ═══════════════════════════════════════════════════════════
  function updateDiagnostics() {
    // Wait for the diagnostics module to be ready, then add a dedup test
    function addDedupTest() {
      if (!window.__lblRunDiagnostics || !window.__lblDiagResults) {
        setTimeout(addDedupTest, 1000);
        return;
      }

      // The diagnostics module doesn't support adding tests dynamically,
      // so we'll add a separate dedup report button
      const diagBox = document.querySelector('.diag-box');
      if (!diagBox || document.getElementById('lbl-dedup-report')) return;

      const btn = document.createElement('button');
      btn.id = 'lbl-dedup-report';
      btn.textContent = '🔍 Check for Duplicate Venues';
      btn.style.cssText = 'display:block;margin-top:8px;background:var(--teal,#128C7E);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;width:100%;';
      btn.onclick = function() {
        const info = window.__lblLastDedupInfo;
        if (!info) {
          alert('Load a city first, then check duplicates.');
          return;
        }
        const msg = `Duplicate Check Results:\n\n` +
          `Original venues: ${info.originalCount}\n` +
          `After dedup: ${info.dedupedCount}\n` +
          `Duplicates removed: ${info.duplicatesRemoved}\n`;
        if (info.duplicatesRemoved > 0) {
          const samples = info.duplicateSamples.map(d => `  • ${d.name} (${d.reason})`).join('\n');
          alert(msg + '\nSamples:\n' + samples);
        } else {
          alert(msg + '\n✅ No duplicates found!');
        }
      };

      diagBox.appendChild(document.createElement('br'));
      diagBox.appendChild(btn);
    }

    setTimeout(addDedupTest, 2000);
    console.log('  [v3.52-4] Duplicate check button added to diagnostics');
  }

  // ═══════════════════════════════════════════════════════════
  // APPLY ALL FIXES
  // ═══════════════════════════════════════════════════════════
  function applyAll() {
    fixDynamicFonts();
    patchDuplicateDetection();
    fixNavigation();
    updateDiagnostics();
    console.log('%c[LBL v3.52] All remaining fixes applied ✓', 'color:#CC5500;font-weight:bold');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    setTimeout(applyAll, 800); // After v3.51 fixes + app JS
  }
})();
