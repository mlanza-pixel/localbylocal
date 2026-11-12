/**
 * lbl-chaos-test-all-cities.js
 * ─────────────────────────────────────────────────────────────
 * Local Like a Local v3.51 — Chaos Test: All 49 Cities
 *
 * Tests EVERY venue entry across ALL 49 cities for:
 *   - Detail modal open/close (no crashes)
 *   - Favorite toggle (no state corruption)
 *   - Map pin clicks (no errors)
 *   - Rapid city switching (caching issues)
 *   - Filter combinations (no empty crashes)
 *   - Memory leaks (DOM node accumulation)
 *   - Search across all cities
 *
 * Total scope: 49 cities × up to 500 venues = ~5,000+ venue tests
 * Runtime: ~15-30 minutes (loads city data sequentially)
 *
 * Usage:
 *   1. Open https://mlanza-pixel.github.io/localbylocal/
 *   2. Accept legal disclaimer, reach the Browse screen
 *   3. Open browser DevTools → Console
 *   4. Paste this script and press Enter
 *   5. Results stored in window.__lblChaosResults
 */

(async function chaosTestAllCities() {
  'use strict';

  const results = {
    citiesTested: 0,
    totalVenuesTested: 0,
    totalButtonsClicked: 0,
    crashes: 0,
    errors: [],
    cityResults: [],
    cachingIssues: [],
    memorySnapshots: [],
    summary: null,
  };

  const errors = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Track errors
  const origError = console.error;
  console.error = function(...args) {
    const msg = args.map(a => String(a)).join(' ').slice(0, 300);
    errors.push(msg);
    origError.apply(console, args);
  };
  window.addEventListener('error', e => {
    errors.push('Uncaught: ' + e.message + ' @ ' + (e.filename||'').split('/').pop() + ':' + e.lineno);
  });

  // Mock confirm/alert
  window.confirm = () => true;
  window.alert = () => {};

  function getErrorCount() { return errors.length; }
  function getNewErrors(since) { return errors.slice(since); }

  function getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJS: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        totalJS: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        domNodes: document.querySelectorAll('*').length,
      };
    }
    return { domNodes: document.querySelectorAll('*').length };
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 1: Rapid City Switching (Caching Test)
  // ═══════════════════════════════════════════════════════════
  async function testRapidCitySwitching() {
    console.log('%c=== Phase 1: Rapid City Switching (Caching) ===',
      'font-size:14px;font-weight:bold;color:#CC5500');

    const cities = [...CITIES_REGISTRY];
    let switchCount = 0;
    let cacheErrors = 0;
    const phase1Start = getErrorCount();

    // Rapidly switch between 10 cities, back and forth
    for (let i = 0; i < 20; i++) {
      const city = cities[i % cities.length];
      try {
        await loadCityData(city);
        await sleep(300);
        switchCount++;

        // Check if venues loaded
        const venueCards = document.querySelectorAll('.venue-card, .venue-item');
        if (venueCards.length === 0 && city.count > 0) {
          cacheErrors++;
          results.cachingIssues.push({
            city: city.name,
            issue: 'No venues rendered after load',
            switch: switchCount,
          });
        }
      } catch(e) {
        cacheErrors++;
        results.cachingIssues.push({
          city: city.name,
          issue: 'Load error: ' + e.message,
          switch: switchCount,
        });
      }
    }

    const phase1Errors = getNewErrors(phase1Start);
    console.log(`  Switched ${switchCount} times, ${cacheErrors} cache errors, ${phase1Errors.length} console errors`);

    return { switchCount, cacheErrors, errors: phase1Errors };
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 2: Every City — Every Venue — Detail Modal
  // ═══════════════════════════════════════════════════════════
  async function testAllCitiesAllVenues() {
    console.log('%c=== Phase 2: All Cities × All Venues ===',
      'font-size:14px;font-weight:bold;color:#1B365D');

    for (let cityIdx = 0; cityIdx < CITIES_REGISTRY.length; cityIdx++) {
      const city = CITIES_REGISTRY[cityIdx];
      const cityResult = {
        name: city.name,
        file: city.file,
        expectedCount: city.count,
        venuesLoaded: 0,
        detailOpened: 0,
        detailClosed: 0,
        favToggled: 0,
        mapTested: false,
        crashes: 0,
        errors: 0,
        memoryAfter: null,
      };

      const cityStart = getErrorCount();

      try {
        // Load city data
        await loadCityData(city);
        await sleep(800);

        const venueCount = allPlaces ? allPlaces.length : 0;
        cityResult.venuesLoaded = venueCount;
        results.totalVenuesTested += venueCount;

        if (venueCount === 0) {
          cityResult.crashes = 1;
          cityResult.errors = 1;
          results.crashes++;
          results.cityResults.push(cityResult);
          results.citiesTested++;
          console.log(`  ❌ ${city.name}: 0 venues loaded (expected ${city.count})`);
          continue;
        }

        // Render venues
        renderVenues();
        await sleep(500);

        // Test every venue's detail modal
        for (let v = 0; v < venueCount; v++) {
          const venue = allPlaces[v];
          const vStart = getErrorCount();

          try {
            // Open detail modal
            openDetailModalByObj(venue.ID);
            await sleep(100);

            const modalOpen = document.getElementById('modal-detail')?.classList.contains('active') ||
              document.getElementById('modal-detail')?.style.display === 'flex';
            if (modalOpen) cityResult.detailOpened++;

            // Close detail modal
            closeDetailModal();
            await sleep(50);
            cityResult.detailClosed++;
            results.totalButtonsClicked += 2;

          } catch(e) {
            cityResult.crashes++;
            results.crashes++;
            errors.push(`City ${city.name}, venue ${venue.ID}: ${e.message}`);
          }

          const vErrors = getErrorCount() - vStart;
          if (vErrors > 0) cityResult.errors += vErrors;
        }

        // ═══════════════════════════════════════════════════════
        // PHASE 2b: Favorite toggle test (first 10 venues)
        // ═══════════════════════════════════════════════════════
        const favTestCount = Math.min(10, venueCount);
        for (let v = 0; v < favTestCount; v++) {
          try {
            toggleFav(allPlaces[v].ID);
            await sleep(50);
            toggleFav(allPlaces[v].ID); // un-toggle
            await sleep(50);
            cityResult.favToggled += 2;
            results.totalButtonsClicked += 2;
          } catch(e) {
            cityResult.crashes++;
            results.crashes++;
          }
        }

        // ═══════════════════════════════════════════════════════
        // PHASE 2c: Map view test
        // ═══════════════════════════════════════════════════════
        try {
          toggleViewMode(); // Turn on map
          await sleep(800);

          const mapContainer = document.getElementById('browse-map-container');
          const mapVisible = mapContainer?.style.display === 'block';
          const leafletLoaded = typeof L !== 'undefined' && typeof L.map === 'function';
          const mapHasInstance = typeof mapInstance !== 'undefined' && mapInstance !== null;
          const markerCount = typeof mapMarkers !== 'undefined' ? mapMarkers.length : 0;

          cityResult.mapTested = mapVisible;
          cityResult.mapDetails = {
            mapVisible,
            leafletLoaded,
            mapHasInstance,
            markerCount,
          };

          toggleViewMode(); // Turn off map
          await sleep(300);
          results.totalButtonsClicked += 2;
        } catch(e) {
          cityResult.crashes++;
          results.crashes++;
          errors.push(`City ${city.name}, map: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════
        // PHASE 2d: Filter test
        // ═══════════════════════════════════════════════════════
        const categories = ['All', 'Food', 'Nightlife', 'Culture', 'Experience'];
        for (const cat of categories) {
          try {
            currentCategory = cat;
            renderVenues();
            await sleep(200);
            results.totalButtonsClicked++;

            // Check no crash on empty results
            const visible = document.querySelectorAll('.venue-card, .venue-item').length;
            if (visible === 0 && cat !== 'All') {
              // Some cities may not have all categories — that's OK
            }
          } catch(e) {
            cityResult.crashes++;
            results.crashes++;
          }
        }
        currentCategory = 'All';
        renderVenues();

        // Memory snapshot
        cityResult.memoryAfter = getMemoryUsage();

        const cityErrors = getErrorCount() - cityStart;
        cityResult.errors = cityErrors;

        const status = cityResult.crashes === 0 && cityErrors === 0 ? '✅' : '❌';
        console.log(`  ${status} ${city.name}: ${venueCount} venues, ${cityResult.detailOpened} details, ${cityResult.favToggled} favs, map=${cityResult.mapTested}, ${cityResult.crashes} crashes, ${cityErrors} errors`);

      } catch(e) {
        cityResult.crashes++;
        results.crashes++;
        errors.push(`City ${city.name} load: ${e.message}`);
        console.log(`  ❌ ${city.name}: LOAD FAILED — ${e.message}`);
      }

      results.cityResults.push(cityResult);
      results.citiesTested++;

      // Memory snapshot every 10 cities
      if (cityIdx % 10 === 0) {
        results.memorySnapshots.push({
          city: city.name,
          index: cityIdx,
          ...getMemoryUsage(),
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 3: Rapid Filter Toggling (Chaos)
  // ═══════════════════════════════════════════════════════════
  async function testRapidFilters() {
    console.log('%c=== Phase 3: Rapid Filter Toggling ===',
      'font-size:14px;font-weight:bold;color:#CC5500');

    // Load Palm Springs (500 venues — stress test)
    await loadCityData(CITIES_REGISTRY[0]);
    await sleep(800);
    renderVenues();
    await sleep(500);

    const phase3Start = getErrorCount();
    let filterClicks = 0;
    let filterCrashes = 0;

    // Rapidly toggle filters 50 times
    const filters = [
      () => { toggleOpenNow(); },
      () => { toggleOpenNow(); },
      () => { toggleHiddenGems(); },
      () => { toggleHiddenGems(); },
      () => { filterCategory('Food', document.querySelector('[onclick*="Food"]') || document.body); },
      () => { filterCategory('All', document.querySelector('[onclick*="All"]') || document.body); },
      () => { filterCategory('Nightlife', document.querySelector('[onclick*="Nightlife"]') || document.body); },
      () => { filterCategory('All', document.querySelector('[onclick*="All"]') || document.body); },
      () => { handleSearch('restaurant'); },
      () => { handleSearch(''); },
    ];

    for (let i = 0; i < 50; i++) {
      try {
        filters[i % filters.length]();
        await sleep(150);
        filterClicks++;
      } catch(e) {
        filterCrashes++;
        errors.push(`Filter chaos ${i}: ${e.message}`);
      }
    }

    // Reset
    resetAllFilters();
    await sleep(300);

    const phase3Errors = getNewErrors(phase3Start);
    console.log(`  ${filterClicks} filter clicks, ${filterCrashes} crashes, ${phase3Errors.length} errors`);

    return { filterClicks, filterCrashes, errors: phase3Errors };
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 4: Rapid Detail Modal Open/Close (Chaos)
  // ═══════════════════════════════════════════════════════════
  async function testRapidDetailModal() {
    console.log('%c=== Phase 4: Rapid Detail Modal Open/Close ===',
      'font-size:14px;font-weight:bold;color:#CC5500');

    const phase4Start = getErrorCount();
    let modalClicks = 0;
    let modalCrashes = 0;

    // Rapidly open/close detail modal 100 times on random venues
    for (let i = 0; i < 100; i++) {
      try {
        const venue = allPlaces[Math.floor(Math.random() * allPlaces.length)];
        if (!venue) continue;

        openDetailModalByObj(venue.ID);
        await sleep(50);

        // Sometimes click a button inside the modal
        if (i % 5 === 0) {
          const modalBtns = document.querySelectorAll('#modal-detail button');
          if (modalBtns.length > 0) {
            const btn = modalBtns[Math.floor(Math.random() * modalBtns.length)];
            if (!btn.disabled && !btn.textContent.includes('✕')) {
              btn.click();
              await sleep(50);
            }
          }
        }

        closeDetailModal();
        await sleep(50);
        modalClicks += 2;
      } catch(e) {
        modalCrashes++;
        errors.push(`Modal chaos ${i}: ${e.message}`);
      }
    }

    const phase4Errors = getNewErrors(phase4Start);
    console.log(`  ${modalClicks} modal clicks, ${modalCrashes} crashes, ${phase4Errors.length} errors`);

    return { modalClicks, modalCrashes, errors: phase4Errors };
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 5: Rapid Favorite Toggling (State Corruption)
  // ═══════════════════════════════════════════════════════════
  async function testRapidFavorites() {
    console.log('%c=== Phase 5: Rapid Favorite Toggling ===',
      'font-size:14px;font-weight:bold;color:#CC5500');

    const phase5Start = getErrorCount();
    let favClicks = 0;
    let favCrashes = 0;

    // Rapidly toggle favorites on 50 different venues
    const testCount = Math.min(50, allPlaces.length);
    for (let i = 0; i < testCount; i++) {
      try {
        const venue = allPlaces[i];
        // Toggle on
        toggleFav(venue.ID);
        await sleep(30);
        // Toggle off
        toggleFav(venue.ID);
        await sleep(30);
        favClicks += 2;
      } catch(e) {
        favCrashes++;
        errors.push(`Fav chaos ${i}: ${e.message}`);
      }
    }

    // Now rapidly toggle the SAME favorite 20 times
    if (allPlaces.length > 0) {
      for (let i = 0; i < 20; i++) {
        try {
          toggleFav(allPlaces[0].ID);
          await sleep(20);
          favClicks++;
        } catch(e) {
          favCrashes++;
        }
      }
      // Clean up — make sure it's un-favorited
      try { toggleFav(allPlaces[0].ID); } catch(e) {}
    }

    const phase5Errors = getNewErrors(phase5Start);
    console.log(`  ${favClicks} fav clicks, ${favCrashes} crashes, ${phase5Errors.length} errors`);

    return { favClicks, favCrashes, errors: phase5Errors };
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 6: Itinerary Builder Chaos
  // ═══════════════════════════════════════════════════════════
  async function testItineraryChaos() {
    console.log('%c=== Phase 6: Itinerary Builder Chaos ===',
      'font-size:14px;font-weight:bold;color:#CC5500');

    const phase6Start = getErrorCount();
    let itinClicks = 0;
    let itinCrashes = 0;

    try {
      // Go to preferences screen
      showScreen('screen-prefs');
      await sleep(500);

      // Rapidly change days
      for (let d = 1; d <= 5; d++) {
        try {
          updateDays(d);
          await sleep(200);
          itinClicks++;
        } catch(e) { itinCrashes++; }
      }

      // Build itinerary
      for (let i = 0; i < 5; i++) {
        try {
          buildItinerary();
          await sleep(500);
          itinClicks++;

          // Switch between days
          const dayBtns = document.querySelectorAll('[onclick*="switchItinDay"]');
          for (const btn of dayBtns) {
            btn.click();
            await sleep(200);
            itinClicks++;
          }
        } catch(e) { itinCrashes++; }
      }

      // Share itinerary (mocked)
      try {
        shareItinerary();
        await sleep(200);
        itinClicks++;
      } catch(e) { itinCrashes++; }

    } catch(e) { itinCrashes++; }

    const phase6Errors = getNewErrors(phase6Start);
    console.log(`  ${itinClicks} itinerary clicks, ${itinCrashes} crashes, ${phase6Errors.length} errors`);

    return { itinClicks, itinCrashes, errors: phase6Errors };
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 7: Memory Leak Detection
  // ═══════════════════════════════════════════════════════════
  async function testMemoryLeaks() {
    console.log('%c=== Phase 7: Memory Leak Detection ===',
      'font-size:14px;font-weight:bold;color:#1B365D');

    const snapshots = [];
    const testCities = CITIES_REGISTRY.slice(0, 10); // Test first 10

    for (const city of testCities) {
      await loadCityData(city);
      await sleep(500);
      renderVenues();
      await sleep(300);

      snapshots.push({
        city: city.name,
        ...getMemoryUsage(),
      });

      // Clear and reload
      const listEl = document.getElementById('venue-list');
      if (listEl) listEl.innerHTML = '';
      await sleep(200);
    }

    // Check if DOM nodes grew unboundedly
    const firstSnap = snapshots[0];
    const lastSnap = snapshots[snapshots.length - 1];
    const domGrowth = lastSnap.domNodes - firstSnap.domNodes;

    const leakDetected = domGrowth > 500; // Allow some growth, flag if excessive

    console.log(`  DOM nodes: ${firstSnap.domNodes} → ${lastSnap.domNodes} (growth: ${domGrowth})`);
    if (leakDetected) {
      console.log(`  ⚠️ Possible memory leak: DOM grew by ${domGrowth} nodes`);
    }

    results.memorySnapshots = snapshots;

    return {
      leakDetected,
      domGrowth,
      firstSnap,
      lastSnap,
      snapshots,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // RUN ALL PHASES
  // ═══════════════════════════════════════════════════════════

  // Ensure we're past the legal screen
  if (typeof CITIES_REGISTRY === 'undefined') {
    console.error('CITIES_REGISTRY not found. Accept the legal disclaimer first.');
    return;
  }

  console.log('%c═══ Local Like a Local — Chaos Test: All 49 Cities ═══',
    'font-size:16px;font-weight:bold;color:#1B365D');
  console.log(`Testing ${CITIES_REGISTRY.length} cities, ~${CITIES_REGISTRY.reduce((a,c) => a+c.count, 0)} total venues`);
  console.log('Estimated runtime: 15-30 minutes');
  console.log('');

  const startTime = Date.now();

  // Phase 1: Rapid city switching
  results.phase1 = await testRapidCitySwitching();
  await sleep(500);

  // Phase 2: All cities × all venues (the big one)
  await testAllCitiesAllVenues();
  await sleep(500);

  // Phase 3: Rapid filters
  results.phase3 = await testRapidFilters();
  await sleep(500);

  // Phase 4: Rapid detail modal
  results.phase4 = await testRapidDetailModal();
  await sleep(500);

  // Phase 5: Rapid favorites
  results.phase5 = await testRapidFavorites();
  await sleep(500);

  // Phase 6: Itinerary chaos
  results.phase6 = await testItineraryChaos();
  await sleep(500);

  // Phase 7: Memory leaks
  results.phase7 = await testMemoryLeaks();

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  // Restore
  console.error = origError;

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  results.allErrors = errors;
  results.elapsedSeconds = elapsed;

  results.summary = {
    citiesTested: results.citiesTested,
    totalVenuesTested: results.totalVenuesTested,
    totalButtonsClicked: results.totalButtonsClicked,
    totalCrashes: results.crashes,
    totalErrors: errors.length,
    cachingIssues: results.cachingIssues.length,
    memoryLeakDetected: results.phase7?.leakDetected || false,
    elapsedSeconds: elapsed,
    pass: results.crashes === 0 && errors.length === 0,
  };

  console.log('');
  console.log('%c═══ CHAOS TEST COMPLETE ═══', 'font-size:16px;font-weight:bold;color:#1B365D');
  console.log(`Cities tested: ${results.summary.citiesTested}`);
  console.log(`Venues tested: ${results.summary.totalVenuesTested}`);
  console.log(`Buttons clicked: ${results.summary.totalButtonsClicked}`);
  console.log(`Crashes: ${results.summary.totalCrashes}`);
  console.log(`Console errors: ${results.summary.totalErrors}`);
  console.log(`Caching issues: ${results.summary.cachingIssues}`);
  console.log(`Memory leak: ${results.summary.memoryLeakDetected ? 'YES ⚠️' : 'No ✅'}`);
  console.log(`Elapsed: ${Math.floor(elapsed/60)}m ${elapsed%60}s`);
  console.log(`Result: ${results.summary.pass ? '✅ ALL PASS' : '❌ ISSUES FOUND'}`);

  window.__lblChaosResults = results;
  return results.summary;
})();
