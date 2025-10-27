/**
 * Application Configuration
 * Centralized configuration for all API endpoints, URLs, and app settings
 */

const AppConfig = (() => {
  // API Configuration
  const API = {
    // Use proxy route for production (Replit/deployed environments)
    // This avoids CORS issues by routing through the Express proxy
    BASE_URL: '/api/proxy',
    TIMEOUT: 30000, // 30 seconds
    VERSION: 'v1',
  };

  // Authentication Configuration
  const AUTH = {
    ALLOWED_DOMAINS: [], // Empty array = allow all domains (public access)
    SESSION_STORAGE_KEY: 'loggedInUser',
    JWT_TOKEN_KEY: 'jwt_token',
    PASSWORD_HASH_ALGORITHM: 'SHA-256',
  };

  // Cache Configuration
  const CACHE = {
    DURATION: 5 * 60 * 1000, // 5 minutes
    KEY: 'letterHistoryCache',
    VERSION_KEY: 'letterCacheVersion',
  };

  // Pagination Configuration
  const PAGINATION = {
    ITEMS_PER_PAGE: 20,
    DEFAULT_PAGE: 1,
  };

  // Theme Configuration
  const THEME = {
    STORAGE_KEY: 'theme',
    DEFAULT: 'light',
    DARK: 'dark',
    LIGHT: 'light',
  };

  // Notification Configuration
  const NOTIFICATION = {
    DURATION: {
      SUCCESS: 4000,
      ERROR: 6000,
      WARNING: 5000,
      INFO: 4000,
      DEFAULT: 5000,
    },
    ANIMATION_DURATION: 300,
  };

  // Routes Configuration
  const ROUTES = {
    LOGIN: 'login.html',
    SIGNUP: 'signup.html',
    INDEX: 'index.html',
    CREATE_LETTER: 'create-letter.html',
    LETTER_HISTORY: 'letter-history.html',
    REVIEW_LETTER: 'review-letter.html',
    ADMIN_PANEL: 'admin-panel.html',
  };

  // Return public configuration object
  return {
    API,
    AUTH,
    CACHE,
    PAGINATION,
    THEME,
    NOTIFICATION,
    ROUTES,

    // Helper methods
    // Returns the proxy URL - the proxy handles routing to backend endpoints
    getApiUrl: (endpoint) => API.BASE_URL,
  };
})();

// Export for browser
if (typeof window !== 'undefined') {
  window.AppConfig = AppConfig;
}

// Export for Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConfig;
}
