/**
 * Chiram Asset Loader & Cache Buster
 * ----------------------------------------------------------------------------
 * 1. Fetches version.js with a timestamp query (?t=...) to avoid browser caching
 * 2. Reads the active version string from window.APP_CONFIG.version
 * 3. Injects styles.css and script.js with ?v={version} for deterministic cache busting
 */

(function () {
  'use strict';

  var cacheBustTimestamp = Date.now();
  var defaultVersion = '1.0.0';

  var status = {
    version: defaultVersion,
    cssLoaded: false,
    jsLoaded: false,
    startTime: performance.now()
  };

  function updateVersionBadges(ver) {
    var badges = document.querySelectorAll('.app-version, #app-version-badge');
    badges.forEach(function (badge) {
      badge.textContent = 'v' + ver;
    });
  }

  function loadStylesheet(href, callback) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = function () {
      status.cssLoaded = true;
      if (typeof callback === 'function') callback(null, link);
    };
    link.onerror = function (err) {
      console.error('[Loader] Failed to load stylesheet:', href, err);
      if (typeof callback === 'function') callback(err, link);
    };
    document.head.appendChild(link);
    return link;
  }

  function loadScript(src, callback) {
    var script = document.createElement('script');
    script.src = src;
    script.async = false; // Maintain execution order
    script.onload = function () {
      if (typeof callback === 'function') callback(null, script);
    };
    script.onerror = function (err) {
      console.error('[Loader] Failed to load script:', src, err);
      if (typeof callback === 'function') callback(err, script);
    };
    document.head.appendChild(script);
    return script;
  }

  function initAppAssets(version) {
    status.version = version;
    console.log('[Loader] Loading assets for version:', version);

    // 1. Inject cache-busted stylesheet
    loadStylesheet('styles.css?v=' + encodeURIComponent(version), function () {
      console.log('[Loader] Stylesheet loaded (styles.css?v=' + version + ')');
    });

    // 2. Inject cache-busted application script
    loadScript('script.js?v=' + encodeURIComponent(version), function () {
      status.jsLoaded = true;
      var loadDuration = Math.round(performance.now() - status.startTime);
      console.log('[Loader] Application script loaded in ' + loadDuration + 'ms');

      // Update any DOM elements showing version
      updateVersionBadges(version);

      // Notify document that application is ready
      var event = new CustomEvent('app:loaded', {
        detail: {
          version: version,
          durationMs: loadDuration
        }
      });
      document.dispatchEvent(event);
    });
  }

  // Step 1: Load version.js with timestamp to bypass HTTP cache
  loadScript('version.js?t=' + cacheBustTimestamp, function (err) {
    if (err) {
      console.warn('[Loader] Could not load version.js. Using fallback version:', defaultVersion);
      initAppAssets(defaultVersion);
      return;
    }

    var resolvedVersion = defaultVersion;
    if (window.APP_CONFIG && window.APP_CONFIG.version) {
      resolvedVersion = window.APP_CONFIG.version;
    } else if (window.APP_VERSION) {
      resolvedVersion = window.APP_VERSION;
    }

    initAppAssets(resolvedVersion);
  });

  // Expose loader info globally for inspection/debugging
  window.APP_LOADER = {
    getStatus: function () {
      return status;
    },
    getVersion: function () {
      return status.version;
    }
  };
})();
