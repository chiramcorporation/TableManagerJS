/**
 * Chiram Table Manager — Version Configuration
 * ----------------------------------------------------------------------------
 * As per THEME.md checklist:
 * Bump "version" after any CSS/JS update to trigger browser cache busting.
 */

var APP_CONFIG = {
  version: "1.0.0",
  name: "Chiram Table Manager",
  theme: "Dark Premium Glassmorphism (Orange Brand)",
  updatedAt: "2026-10-11"
};

var APP_VERSION = APP_CONFIG.version;

// Expose globally for browsers
if (typeof window !== "undefined") {
  window.APP_CONFIG = APP_CONFIG;
  window.APP_VERSION = APP_VERSION;
}

// Support Node.js / module environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { APP_CONFIG, APP_VERSION };
}
