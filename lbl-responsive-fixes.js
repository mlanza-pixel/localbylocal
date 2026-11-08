/**
 * lbl-responsive-fixes.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.51 — Responsive + Device Adaptation
 *
 * Adds full responsive behavior for:
 *   - iPhone (all sizes, notch/Dynamic Island safe areas)
 *   - iPad (portrait + landscape, multi-column layouts)
 *   - Android phones (Chrome, Samsung Internet)
 *   - Desktop browsers
 *
 * Fixes:
 *   1.  Removes maximum-scale=1.0 (allows pinch-to-zoom — WCAG 1.4.4)
 *   2.  Adds safe-area-inset padding (notch, Dynamic Island, home indicator)
 *   3.  Adds media queries for phone vs tablet vs desktop
 *   4.  iPad: 3-column city grid, 2-column venue list
 *   5.  Desktop: 4-column city grid, 3-column venue list
 *   6.  Landscape mode adjustments
 *   7.  Hover effects gated to hover-capable devices only
 *   8.  Touch-optimized spacing (larger gaps on touch devices)
 *   9.  Dark mode support (prefers-color-scheme)
 *   10. Reduced motion + print styles
 *
 * Installation:
 *   Add <script src="lbl-responsive-fixes.js"></script> before </body>
 *   AFTER lbl-v3.51-fixes.js
 */

(function() {
  'use strict';

  console.log('%c[LBL] Applying responsive device fixes...', 'color:#128C7E;font-weight:bold');

  // FIX 1: Remove maximum-scale (WCAG 1.4.4 — allow pinch-to-zoom)
  function fixViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
      console.log('  [R1] Viewport fixed — pinch-to-zoom enabled');
    }
  }

  // FIX 2-10: Inject all responsive CSS
  function injectResponsiveCSS() {
    const style = document.createElement('style');
    style.id = 'lbl-responsive-fixes';
    style.textContent = `
      /* Safe Area Insets (notch, Dynamic Island, home bar) */
      body {
        padding-top: env(safe-area-inset-top, 0px);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        padding-left: env(safe-area-inset-left, 0px);
        padding-right: env(safe-area-inset-right, 0px);
      }
      .bottom-nav { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)) !important; }
      .modal-dialog {
        padding-top: calc(20px + env(safe-area-inset-top, 0px)) !important;
        padding-left: calc(20px + env(safe-area-inset-left, 0px)) !important;
        padding-right: calc(20px + env(safe-area-inset-right, 0px)) !important;
      }
      #offline-status-bar { padding-top: env(safe-area-inset-top, 0px) !important; }

      /* Phone Layout (< 768px) */
      @media (max-width: 767px) {
        .cities-grid { grid-template-columns: 1fr !important; }
        .venue-card { margin-bottom: 12px !important; }
        .nav-btn { padding: 10px 4px !important; }
        .nav-btn span:not(.nav-icon) { font-size: 15px !important; }
        .category-tabs-row { gap: 4px !important; }
        .toggle-filter-btn { padding: 8px 12px !important; font-size: 15px !important; white-space: nowrap !important; }
        .splash-title { font-size: 1.8rem !important; }
        .modal-dialog { width: 100% !important; max-width: 100% !important; min-height: 100% !important; border-radius: 0 !important; margin: 0 !important; }
        .modal-overlay { padding: 0 !important; }
        .search-input-box input { min-height: 48px !important; }
      }

      /* iPad / Tablet (768px–1024px) */
      @media (min-width: 768px) and (max-width: 1024px) {
        .cities-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; }
        #venue-list { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
        .city-card { min-height: 140px !important; }
        .screen-heading { font-size: 26px !important; }
        .venue-title { font-size: 17px !important; }
        #browse-map-container { height: 500px !important; }
        .nav-btn { padding: 12px 16px !important; }
      }

      /* iPad Landscape (1024px–1366px) */
      @media (min-width: 1024px) and (max-width: 1366px) and (orientation: landscape) {
        .cities-grid { grid-template-columns: repeat(4, 1fr) !important; }
        #venue-list { grid-template-columns: repeat(3, 1fr) !important; }
        #screen-browser .screen-content { max-width: 1200px !important; margin: 0 auto !important; }
      }

      /* Desktop (> 1024px) */
      @media (min-width: 1025px) {
        .cities-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 20px !important; }
        #venue-list { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; }
        .screen-content, .screen { max-width: 1200px !important; margin-left: auto !important; margin-right: auto !important; }
        .screen-heading { font-size: 28px !important; }
        #browse-map-container { height: 550px !important; }
        .bottom-nav { max-width: 1200px !important; margin-left: auto !important; margin-right: auto !important; }
      }

      /* Landscape Phone */
      @media (max-width: 767px) and (orientation: landscape) {
        .splash-icon { font-size: 2.5rem !important; }
        .splash-title { font-size: 1.4rem !important; }
        .modal-dialog { min-height: auto !important; max-height: 90% !important; border-radius: 12px !important; margin: 5% auto !important; }
        .bottom-nav { height: 50px !important; }
      }

      /* Hover effects — only on hover-capable devices */
      @media (hover: hover) and (pointer: fine) {
        .venue-card:hover { transform: translateY(-3px) !important; box-shadow: 0 6px 12px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.05) !important; }
        .city-card:hover { transform: scale(1.03) !important; }
        .nav-btn:hover { background-color: rgba(0,0,0,0.05) !important; }
      }

      /* Touch devices — active states instead of hover */
      @media (hover: none) {
        .venue-card:active { transform: scale(0.98) !important; background-color: var(--bg-main, #F8F9FA) !important; }
        .city-card:active { transform: scale(0.97) !important; }
        .nav-btn:active { background-color: rgba(0,0,0,0.08) !important; }
      }

      /* Touch-optimized spacing */
      @media (pointer: coarse) {
        .category-tabs-row { gap: 8px !important; }
        .filter-row { gap: 10px !important; padding: 10px !important; }
        .modal-close-btn { min-width: 48px !important; min-height: 48px !important; font-size: 20px !important; }
        .nav-btn, .toggle-filter-btn, .sort-btn { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
      }

      /* Dark Mode */
      @media (prefers-color-scheme: dark) {
        :root {
          --primary: #4A7AB5; --primary-light: #5B8BCB; --accent: #FF7722; --accent-light: #FF9944;
          --teal: #2BAE9E; --teal-light: #1A332E; --teal-dark: #4AD0BE;
          --bg-main: #0D1117; --card: #161B22; --border: #30363D;
          --text-dark: #E6EDF3; --text2: #8B949E; --text-muted: #6E7681;
          --shadow-sm: 0 2px 4px rgba(0,0,0,0.3); --shadow-md: 0 4px 12px rgba(0,0,0,0.4); --shadow-lg: 0 10px 25px rgba(0,0,0,0.5);
        }
        body { background: var(--bg-main) !important; color: var(--text-dark) !important; }
        .venue-card, .city-card, .modal-dialog { background: var(--card) !important; color: var(--text-dark) !important; }
        .search-input-box input { background: var(--card) !important; color: var(--text-dark) !important; border-color: var(--border) !important; }
        .bottom-nav { background: var(--card) !important; border-top-color: var(--border) !important; }
        .diag-box { background: var(--card) !important; color: var(--text2) !important; }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      }

      /* Print styles */
      @media print {
        .bottom-nav, .modal-overlay, #pwa-install-banner, .filter-row, .category-tabs-row, .search-input-box { display: none !important; }
        body { padding: 0 !important; }
        .screen { display: block !important; max-width: 100% !important; }
        #screen-itinerary, #screen-favorites { display: block !important; }
      }
    `;
    document.head.appendChild(style);
    console.log('  [R2-R10] Responsive CSS injected');
  }

  // Device detection
  function detectDevice() {
    const ua = navigator.userAgent;
    const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iPhone/.test(ua);
    const isIOS = isIPad || isIPhone;
    const isAndroid = /Android/.test(ua);
    const isTablet = isIPad || (isAndroid && /Tablet|SM-T/.test(ua));
    const isDesktop = !isIOS && !isAndroid && !isTablet;
    const device = {
      type: isDesktop ? 'Desktop' : isTablet ? 'Tablet' : 'Phone',
      os: isIPhone ? 'iPhone' : isIPad ? 'iPad' : isAndroid ? 'Android' : 'Other',
      isIOS, isAndroid, isTablet, isDesktop,
      hasNotch: isIOS && (window.screen.height >= 812 || window.screen.width >= 812),
      screenWidth: window.screen.width, screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio,
      orientation: window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape',
      prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    };
    window.__lblDeviceInfo = device;
    console.log(`  [R11] Device: ${device.type}/${device.os}/${device.screenWidth}x${device.screenHeight}/${device.orientation}`);
    return device;
  }

  // Orientation change handler
  function handleOrientationChange() {
    window.addEventListener('resize', () => {
      if (typeof renderVenues === 'function' && typeof allPlaces !== 'undefined' && allPlaces.length > 0) {
        setTimeout(renderVenues, 300);
      }
      if (typeof mapInstance !== 'undefined' && mapInstance) {
        setTimeout(() => { try { mapInstance.invalidateSize(); } catch(e) {} }, 300);
      }
    });
    window.addEventListener('orientationchange', () => {
      if (typeof mapInstance !== 'undefined' && mapInstance) {
        setTimeout(() => { try { mapInstance.invalidateSize(); } catch(e) {} }, 500);
      }
    });
  }

  function applyAll() {
    fixViewport();
    injectResponsiveCSS();
    detectDevice();
    handleOrientationChange();
    console.log('%c[LBL] Responsive device fixes applied', 'color:#128C7E;font-weight:bold');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    setTimeout(applyAll, 500);
  }
})();
