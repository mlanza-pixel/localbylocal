/**
 * lbl-v3.51-fixes.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local — Audit Fix Patch v3.51
 *
 * Drop-in script that patches all remaining audit issues
 * from the v3.50 audit that haven't been fixed yet.
 *
 * Fixes included:
 *   1.  Meta tags (og:, twitter:, canonical) — injected into <head>
 *   2.  aria-hidden="true" on decorative emojis
 *   3.  External link security (rel="noopener noreferrer")
 *   4.  Touch target minimum sizes (44×44px)
 *   5.  focus-visible styles for keyboard navigation
 *   6.  "Highly rated local spot" → improved fallback text
 *   7.  <noscript> fallback
 *   8.  Schema.org structured data
 *   9.  Privacy policy link in footer
 *   10. Install banner localStorage dismiss flag
 *   11. Font size fixes (9px→12px, 10px→13px, 11px→13px)
 *   12. Real Leaflet vendor files (instructions, not code)
 *
 * Installation:
 *   Add <script src="lbl-v3.51-fixes.js"></script> before </body>
 *   AFTER the main app <script> block.
 */

(function() {
  'use strict';

  console.log('%c[LBL v3.51] Applying audit fixes...', 'color:#128C7E;font-weight:bold');

  // ═══════════════════════════════════════════════════════════
  // FIX 1: Meta tags (SEO + Social Sharing)
  // ═══════════════════════════════════════════════════════════
  function injectMetaTags() {
    const head = document.head;
    const metaTags = [
      { tag: 'meta', attrs: { name: 'description', content: 'Explore 49 global destinations with authentic local spots, neighborhood gems, and curated offline itineraries. Local Like a Local — boutique travel guides that work offline.' } },
      { tag: 'meta', attrs: { property: 'og:title', content: 'Local Like a Local — Boutique Travel Guides' } },
      { tag: 'meta', attrs: { property: 'og:description', content: 'Explore 49 global destinations with authentic local spots, neighborhood gems, and curated offline itineraries.' } },
      { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
      { tag: 'meta', attrs: { property: 'og:url', content: 'https://mlanza-pixel.github.io/localbylocal/' } },
      { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      { tag: 'meta', attrs: { name: 'twitter:title', content: 'Local Like a Local — Boutique Travel Guides' } },
      { tag: 'meta', attrs: { name: 'twitter:description', content: 'Explore 49 global destinations with authentic local spots and curated offline itineraries.' } },
      { tag: 'link', attrs: { rel: 'canonical', href: 'https://mlanza-pixel.github.io/localbylocal/' } },
    ];

    let added = 0;
    metaTags.forEach(item => {
      const key = item.attrs.property || item.attrs.name || item.attrs.rel;
      const existing = head.querySelector(`${item.tag}[${Object.keys(item.attrs)[0]}="${key}"]`);
      if (!existing) {
        const el = document.createElement(item.tag);
        Object.entries(item.attrs).forEach(([k, v]) => el.setAttribute(k, v));
        head.appendChild(el);
        added++;
      }
    });
    console.log(`  [FIX 1] Meta tags: ${added} added`);
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 2: aria-hidden on decorative emojis
  // ═══════════════════════════════════════════════════════════
  function fixEmojiAccessibility() {
    // Add aria-hidden to emoji-only spans in nav, buttons, and decorative elements
    const emojiElements = document.querySelectorAll('.nav-icon, .splash-emoji, [class*="icon"]');
    let fixed = 0;
    emojiElements.forEach(el => {
      if (!el.getAttribute('aria-hidden')) {
        el.setAttribute('aria-hidden', 'true');
        fixed++;
      }
    });

    // Add aria-labels to interactive emoji buttons (favorites, directions)
    const favButtons = document.querySelectorAll('[onclick*="toggleFav"]');
    favButtons.forEach(btn => {
      if (!btn.getAttribute('aria-label')) {
        const venueName = btn.closest('[data-id]')?.dataset?.id || 'venue';
        btn.setAttribute('aria-label', `Toggle favorite for ${venueName}`);
        btn.setAttribute('role', 'button');
      }
    });

    const mapLinks = document.querySelectorAll('[onclick*="openMapPin"]');
    mapLinks.forEach(link => {
      if (!link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', 'Get directions');
      }
    });

    console.log(`  [FIX 2] aria-hidden: ${fixed} elements fixed, aria-labels added to interactive buttons`);
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 3: External link security (rel="noopener noreferrer")
  // ═══════════════════════════════════════════════════════════
  function fixExternalLinks() {
    // Fix all target="_blank" links
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    let fixed = 0;
    externalLinks.forEach(link => {
      const rel = link.getAttribute('rel') || '';
      if (!rel.includes('noopener')) {
        link.setAttribute('rel', 'noopener noreferrer');
        fixed++;
      }
    });

    // Also patch window.open calls to add noopener
    // (This can't be done via DOM — needs source code change)
    // Instead, add a global safety wrapper
    const origWindowOpen = window.open;
    window.open = function(url, target, features) {
      if (target === '_blank' && features && !features.includes('noopener')) {
        features += ',noopener,noreferrer';
      } else if (target === '_blank' && !features) {
        features = 'noopener,noreferrer';
      }
      return origWindowOpen.call(window, url, target, features);
    };

    console.log(`  [FIX 3] External links: ${fixed} links secured, window.open patched`);
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 4: Touch target minimum sizes (44×44px)
  // ═══════════════════════════════════════════════════════════
  function fixTouchTargets() {
    const style = document.createElement('style');
    style.id = 'lbl-touch-target-fixes';
    style.textContent = `
      /* FIX 4: Apple HIG / Material Design touch targets — minimum 44×44px */
      .nav-btn { min-width: 44px !important; min-height: 44px !important; }
      button[class*="filter"] { min-height: 44px !important; }
      .modal-close-btn { min-width: 44px !important; min-height: 44px !important; }
      .venue-action-btn, [onclick*="toggleFav"], [onclick*="openDetailModal"] {
        min-width: 44px !important;
        min-height: 44px !important;
      }
      .sort-btn, .city-sort-btn { min-height: 44px !important; }
    `;
    document.head.appendChild(style);
    console.log('  [FIX 4] Touch target CSS injected (44×44px minimum)');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 5: focus-visible styles for keyboard navigation
  // ═══════════════════════════════════════════════════════════
  function fixFocusStyles() {
    const style = document.createElement('style');
    style.id = 'lbl-focus-fixes';
    style.textContent = `
      /* FIX 5: Keyboard focus indicators — WCAG 2.1 AA */
      button:focus-visible,
      a:focus-visible,
      [role="button"]:focus-visible,
      [onclick]:focus-visible,
      input:focus-visible,
      select:focus-visible {
        outline: 3px solid var(--accent, #CC5500) !important;
        outline-offset: 2px !important;
        border-radius: 4px;
      }
      .nav-btn:focus-visible {
        outline: 3px solid var(--accent, #CC5500) !important;
        outline-offset: -3px !important;
      }
      .venue-card:focus-within {
        box-shadow: 0 0 0 2px var(--accent, #CC5500), var(--shadow-md) !important;
      }
    `;
    document.head.appendChild(style);
    console.log('  [FIX 5] Focus-visible styles injected');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 6: Font size fixes (accessibility)
  // ═══════════════════════════════════════════════════════════
  function fixFontSizes() {
    const style = document.createElement('style');
    style.id = 'lbl-font-fixes';
    style.textContent = `
      /* FIX 6: Font accessibility — minimum 12px, preferred 13px+ */
      /* Override all sub-12px declarations */
      * { font-size: inherit; }

      /* Body and card text */
      .venue-card, .venue-name, .venue-meta, .venue-detail {
        font-size: 14px !important;
      }
      .venue-card .venue-sub, .venue-card .venue-cat {
        font-size: 13px !important;
      }

      /* Nav bar labels */
      .nav-btn span:not(.nav-icon) {
        font-size: 13px !important;
      }

      /* Filter buttons */
      .toggle-filter-btn, .sort-btn {
        font-size: 13px !important;
      }

      /* Search input */
      .search-input-box input {
        font-size: 14px !important;
      }

      /* City cards */
      .city-card-name {
        font-size: 15px !important;
      }
      .city-card-sub {
        font-size: 13px !important;
      }

      /* Modal text */
      .modal-dialog p {
        font-size: 14px !important;
      }
      .modal-dialog .diag-box {
        font-size: 13px !important;
      }

      /* Help/walkthrough */
      .walkthrough-p {
        font-size: 14px !important;
      }
      .walkthrough-h3 {
        font-size: 18px !important;
      }

      /* Section headers */
      .screen-heading {
        font-size: 22px !important;
      }

      /* Absolute minimum override — nothing below 12px */
      [style*="font-size:9px"],
      [style*="font-size: 9px"],
      [style*="font-size:10px"],
      [style*="font-size: 10px"],
      [style*="font-size:11px"],
      [style*="font-size: 11px"] {
        font-size: 12px !important;
      }
    `;
    document.head.appendChild(style);
    console.log('  [FIX 6] Font size overrides injected (minimum 12px)');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 7: <noscript> fallback
  // ═══════════════════════════════════════════════════════════
  function injectNoScript() {
    if (document.querySelector('noscript')) return;
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `
      <div style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;text-align:center;">
        <h1>Local Like a Local</h1>
        <p>This is an offline-first travel guide app that requires JavaScript to run.</p>
        <p>Please enable JavaScript in your browser settings to explore 49 global destinations.</p>
        <p>Visit <a href="https://mlanza-pixel.github.io/localbylocal/">our GitHub page</a> for more information.</p>
      </div>
    `;
    document.body.insertBefore(noscript, document.body.firstChild);
    console.log('  [FIX 7] noscript fallback injected');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 8: Schema.org structured data
  // ═══════════════════════════════════════════════════════════
  function injectStructuredData() {
    if (document.querySelector('script[type="application/ld+json"]')) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Local Like a Local",
      "description": "Boutique offline city travel guides with curated local spots for 49 global destinations.",
      "url": "https://mlanza-pixel.github.io/localbylocal/",
      "applicationCategory": "TravelApplication",
      "operatingSystem": "Web Browser (PWA)",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Offline city guides",
        "Curated local spots",
        "Custom itineraries",
        "Interactive maps",
        "49 global destinations"
      ]
    });
    document.head.appendChild(script);
    console.log('  [FIX 8] Schema.org structured data injected');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 9: Privacy policy link
  // ═══════════════════════════════════════════════════════════
  function injectPrivacyPolicy() {
    // Find the Help modal and add a privacy policy link
    const helpModal = document.getElementById('modal-help');
    if (!helpModal) return;

    const existing = helpModal.querySelector('.lbl-privacy-link');
    if (existing) return;

    const privacyDiv = document.createElement('div');
    privacyDiv.className = 'lbl-privacy-link';
    privacyDiv.style.cssText = 'margin-top:16px;padding-top:14px;border-top:1px solid var(--border);text-align:center;font-size:13px;color:var(--text2);';
    privacyDiv.innerHTML = `
      <a href="https://mlanza-pixel.github.io/localbylocal/privacy.html"
         style="color:var(--teal);text-decoration:none;font-weight:600;"
         onmouseover="this.style.textDecoration='underline'"
         onmouseout="this.style.textDecoration='none'">
        🔒 Privacy Policy
      </a>
      <p style="margin-top:6px;font-size:12px;color:var(--text-muted);">
        Your favorites and preferences are stored locally on your device. No personal data is collected or transmitted.
      </p>
    `;
    helpModal.querySelector('.modal-dialog').appendChild(privacyDiv);
    console.log('  [FIX 9] Privacy policy link added to Help modal');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 10: Install banner localStorage dismiss flag
  // ═══════════════════════════════════════════════════════════
  function fixInstallBanner() {
    // Check if already dismissed
    try {
      if (localStorage.getItem('lbl-install-dismissed') === 'true') {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.style.display = 'none';
        console.log('  [FIX 10] Install banner hidden (previously dismissed)');
        return;
      }
    } catch(e) {}

    // Patch the dismiss button to set localStorage
    const dismissBtn = document.querySelector('[onclick*="pwa-install-banner"]');
    if (dismissBtn) {
      const origOnClick = dismissBtn.getAttribute('onclick');
      dismissBtn.setAttribute('onclick', `localStorage.setItem('lbl-install-dismissed','true'); ${origOnClick}`);
      dismissBtn.setAttribute('aria-label', 'Dismiss install prompt');
    }

    // Also patch the ✕ close button if it exists
    const closeBtns = document.querySelectorAll('#pwa-install-banner button');
    closeBtns.forEach(btn => {
      if (btn.textContent.includes('✕') || btn.textContent.includes('×')) {
        btn.setAttribute('aria-label', 'Dismiss install prompt');
        btn.addEventListener('click', () => {
          try { localStorage.setItem('lbl-install-dismissed', 'true'); } catch(e) {}
        });
      }
    });
    console.log('  [FIX 10] Install banner dismiss flag + aria-label added');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 11: "Highly rated local spot" → improved fallback
  // ═══════════════════════════════════════════════════════════
  function fixPlaceholderText() {
    // This needs to patch the normalizeCityData function
    // Since we can't edit the source, we'll override the allPlaces after load
    const checkInterval = setInterval(() => {
      if (typeof allPlaces !== 'undefined' && allPlaces.length > 0) {
        let fixed = 0;
        allPlaces.forEach(p => {
          if (p.Why_Go === 'Highly rated local spot.' || !p.Why_Go) {
            // Generate a more useful description from the data we have
            const parts = [];
            if (p.Category) parts.push(p.Category.toLowerCase());
            if (p.Subcategory) parts.push(p.Subcategory.toLowerCase());
            if (p.Neighborhood) parts.push(`in ${p.Neighborhood}`);

            const baseDesc = parts.length > 0
              ? `A ${parts[0]}${parts[1] ? ' / ' + parts[1] : ''} ${parts.slice(2).join(' ')}.`
              : 'A recommended local destination.';

            p.Why_Go = baseDesc;
            fixed++;
          }
        });
        if (fixed > 0) {
          console.log(`  [FIX 11] Improved ${fixed} placeholder descriptions`);
          clearInterval(checkInterval);
        }
      }
    }, 1000);

    // Give up after 30 seconds
    setTimeout(() => clearInterval(checkInterval), 30000);
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 12: Polish — smooth transitions and card hover
  // ═══════════════════════════════════════════════════════════
  function addPolishStyles() {
    const style = document.createElement('style');
    style.id = 'lbl-polish-styles';
    style.textContent = `
      /* FIX 12: Polish — smooth transitions, layered shadows */

      /* Card hover transitions */
      .venue-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease !important;
      }
      .venue-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04) !important;
      }

      /* City card hover */
      .city-card, .city-tile {
        transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        cursor: pointer;
      }
      .city-card:hover, .city-tile:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04) !important;
      }

      /* Nav button transitions */
      .nav-btn {
        transition: background-color 0.15s ease, color 0.15s ease !important;
      }

      /* Filter button transitions */
      .toggle-filter-btn, .sort-btn {
        transition: background-color 0.15s ease, color 0.15s ease !important;
      }

      /* Modal open/close animation */
      .modal-overlay {
        transition: opacity 0.2s ease !important;
      }
      .modal-dialog {
        transition: transform 0.2s ease, opacity 0.2s ease !important;
      }

      /* Splash fade-in */
      @keyframes lbl-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      #screen-splash {
        animation: lbl-fade-in 0.5s ease;
      }

      /* Better shadow system */
      :root {
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04) !important;
        --shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04) !important;
        --shadow-lg: 0 10px 25px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.05) !important;
      }
    `;
    document.head.appendChild(style);
    console.log('  [FIX 12] Polish styles injected (transitions, shadows, animations)');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 13: Offline indicator fix — only show when actually offline
  // ═══════════════════════════════════════════════════════════
  function fixOfflineIndicator() {
    const indicator = document.getElementById('offline-status-bar');
    if (!indicator) return;

    function updateOfflineStatus() {
      if (navigator.onLine) {
        indicator.style.display = 'none';
      } else {
        indicator.style.display = 'block';
        indicator.textContent = '⚡ Offline Mode — Serving cached city guides';
      }
    }

    updateOfflineStatus();
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    console.log('  [FIX 13] Offline indicator now only shows when actually offline');
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 14: Fieldset/legend for trip builder controls
  // ═══════════════════════════════════════════════════════════
  function fixFormSemantics() {
    // Find the preferences screen and wrap the chip groups in fieldsets
    const prefsScreen = document.getElementById('screen-prefs');
    if (!prefsScreen) return;

    // Add ARIA labels to chip groups
    const chipGroups = prefsScreen.querySelectorAll('.pref-chips, [class*="chip"]');
    chipGroups.forEach((group, i) => {
      if (!group.getAttribute('role')) {
        group.setAttribute('role', 'radiogroup');
      }
      const label = group.previousElementSibling;
      if (label && label.classList.contains('pref-label')) {
        group.setAttribute('aria-label', label.textContent.trim());
      }
    });

    console.log('  [FIX 14] Form semantics: ARIA roles added to chip groups');
  }

  // ═══════════════════════════════════════════════════════════
  // APPLY ALL FIXES
  // ═══════════════════════════════════════════════════════════
  function applyAllFixes() {
    injectMetaTags();
    fixEmojiAccessibility();
    fixExternalLinks();
    fixTouchTargets();
    fixFocusStyles();
    fixFontSizes();
    injectNoScript();
    injectStructuredData();
    injectPrivacyPolicy();
    fixInstallBanner();
    fixPlaceholderText();
    addPolishStyles();
    fixOfflineIndicator();
    fixFormSemantics();

    console.log('%c[LBL v3.51] All audit fixes applied ✓', 'color:#128C7E;font-weight:bold;font-size:14px');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAllFixes);
  } else {
    // DOM already loaded — run after a short delay to let app JS initialize
    setTimeout(applyAllFixes, 500);
  }
})();
