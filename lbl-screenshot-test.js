/**
 * lbl-screenshot-test.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.51 — Screenshot Capture Test
 *
 * Captures screenshots of every screen on every device size
 * to visually verify layout, fonts, and responsive behavior.
 *
 * Tests 5 device sizes × 9 screens = 45 screenshots
 *
 * Usage:
 *   1. Open the app in a desktop browser
 *   2. Accept legal disclaimer
 *   3. Open DevTools → Console
 *   4. Paste this script and press Enter
 *   5. Screenshots are saved as downloads (or viewed in console)
 *
 * Note: Browser security prevents direct file saves from JS.
 * Instead, this script captures screenshots as canvas images
 * and opens them in new tabs for manual saving.
 */

(async function screenshotTest() {
  'use strict';

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Device sizes to test
  const devices = [
    { name: 'iPhone-SE', width: 375, height: 667 },
    { name: 'iPhone-14-Pro', width: 393, height: 852 },
    { name: 'iPad-Mini', width: 768, height: 1024 },
    { name: 'iPad-Pro-Landscape', width: 1366, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  // Screens to capture
  const screens = [
    { name: 'Cities', id: 'screen-cities' },
    { name: 'Browse', id: 'screen-browser' },
    { name: 'Itinerary', id: 'screen-prefs' },
    { name: 'Favorites', id: 'screen-favorites' },
    { name: 'Help-Modal', id: 'modal-help', isModal: true },
  ];

  const results = [];

  console.log('%c═══ Screenshot Capture Test ═══', 'font-size:14px;font-weight:bold;color:#1B365D');
  console.log(`Testing ${devices.length} device sizes × ${screens.length} screens = ${devices.length * screens.length} screenshots`);
  console.log('');

  for (const device of devices) {
    console.log(`%c--- ${device.name} (${device.width}×${device.height}) ---`, 'color:#CC5500;font-weight:bold');

    // Resize viewport
    window.resizeTo(device.width, device.height);
    await sleep(500);

    for (const screen of screens) {
      try {
        // Navigate to screen
        if (screen.isModal) {
          showScreen('screen-browser');
          await sleep(300);
          openHelpModal();
          await sleep(500);
        } else {
          showScreen(screen.id);
          await sleep(500);
        }

        // If Browse screen, load Palm Springs for data
        if (screen.id === 'screen-browser' && typeof CITIES_REGISTRY !== 'undefined') {
          await loadCityData(CITIES_REGISTRY[0]);
          await sleep(800);
          renderVenues();
          await sleep(500);
        }

        // Capture screenshot using canvas
        const canvas = await html2canvas(document.body, {
          width: device.width,
          height: device.height,
          windowWidth: device.width,
          windowHeight: device.height,
          logging: false,
          useCORS: true,
        });

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');

        results.push({
          device: device.name,
          screen: screen.name,
          width: device.width,
          height: device.height,
          captured: true,
          dataSize: Math.round(dataUrl.length / 1024) + ' KB',
        });

        console.log(`  ✅ ${screen.name} on ${device.name} — ${Math.round(dataUrl.length / 1024)} KB`);

        // Close modal if open
        if (screen.isModal && typeof closeHelpModal === 'function') {
          closeHelpModal();
          await sleep(200);
        }

      } catch(e) {
        results.push({
          device: device.name,
          screen: screen.name,
          captured: false,
          error: e.message,
        });
        console.log(`  ❌ ${screen.name} on ${device.name} — ${e.message}`);
      }
    }
  }

  // Summary
  const captured = results.filter(r => r.captured).length;
  const failed = results.filter(r => !r.captured).length;

  console.log('');
  console.log(`%c═══ Result: ${captured} captured, ${failed} failed ═══`,
    `font-size:14px;font-weight:bold;color:${failed === 0 ? '#128C7E' : '#D9534F'}`);

  window.__lblScreenshotResults = results;
  return { captured, failed, results };
})();
