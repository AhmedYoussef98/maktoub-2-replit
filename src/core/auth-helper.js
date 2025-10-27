/**
 * Authentication Helper
 * Centralized token management and validation utilities
 */

const AuthHelper = (() => {
  // ==================== Private Functions ====================

  /**
   * Parse JWT token payload (without verification)
   * @private
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded payload or null
   */
  function parseJwtPayload(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid JWT format');
        return null;
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired based on JWT exp claim
   * @private
   * @param {Object} payload - Decoded JWT payload
   * @returns {boolean} True if expired
   */
  function isTokenExpired(payload) {
    if (!payload || !payload.exp) {
      return true; // No expiration claim, consider expired
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  // ==================== Public Functions ====================

  /**
   * Get JWT token from sessionStorage
   * @returns {string|null} JWT token or null
   */
  function getToken() {
    try {
      const token = sessionStorage.getItem(AppConfig.AUTH.JWT_TOKEN_KEY);
      return token || null;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Store JWT token in sessionStorage
   * @param {string} token - JWT token to store
   */
  function setToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format');
      }
      sessionStorage.setItem(AppConfig.AUTH.JWT_TOKEN_KEY, token);
      console.log('✅ Token stored successfully');
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  /**
   * Remove JWT token from sessionStorage
   */
  function removeToken() {
    try {
      sessionStorage.removeItem(AppConfig.AUTH.JWT_TOKEN_KEY);
      console.log('🗑️ Token removed');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  /**
   * Check if JWT token exists
   * @returns {boolean} True if token exists
   */
  function hasToken() {
    const token = getToken();
    return token !== null && token !== '';
  }

  /**
   * Validate JWT token (check presence and expiration)
   * @param {boolean} checkExpiration - Whether to check token expiration (default: true)
   * @returns {{valid: boolean, token?: string, reason?: string, payload?: Object}}
   */
  function validateToken(checkExpiration = true) {
    const token = getToken();

    if (!token) {
      return {
        valid: false,
        reason: 'No token found in sessionStorage',
      };
    }

    // Basic format check
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        valid: false,
        reason: 'Invalid JWT format',
        token,
      };
    }

    // Parse payload
    const payload = parseJwtPayload(token);
    if (!payload) {
      return {
        valid: false,
        reason: 'Failed to parse token payload',
        token,
      };
    }

    // Check expiration if requested
    if (checkExpiration && isTokenExpired(payload)) {
      return {
        valid: false,
        reason: 'Token expired',
        token,
        payload,
      };
    }

    return {
      valid: true,
      token,
      payload,
    };
  }

  /**
   * Get token expiration time
   * @returns {{expired: boolean, expiresAt?: Date, expiresIn?: number}|null}
   */
  function getTokenExpiration() {
    const token = getToken();
    if (!token) return null;

    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) return null;

    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();
    const expiresIn = Math.floor((expiresAt - now) / 1000); // seconds

    return {
      expired: expiresIn <= 0,
      expiresAt,
      expiresIn: expiresIn > 0 ? expiresIn : 0,
    };
  }

  /**
   * Get current user data from sessionStorage
   * @returns {Object|null} User data or null
   */
  function getCurrentUser() {
    try {
      const userData = sessionStorage.getItem(AppConfig.AUTH.SESSION_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid token and user data)
   * @returns {boolean} True if authenticated
   */
  function isAuthenticated() {
    const tokenValidation = validateToken(true);
    const user = getCurrentUser();
    return tokenValidation.valid && user !== null;
  }

  /**
   * Clear all authentication data
   * @param {boolean} redirect - Whether to redirect to login (default: false)
   */
  function clearAuth(redirect = false) {
    try {
      // Remove token
      sessionStorage.removeItem(AppConfig.AUTH.JWT_TOKEN_KEY);

      // Remove user data
      sessionStorage.removeItem(AppConfig.AUTH.SESSION_STORAGE_KEY);

      console.log('🔓 Authentication data cleared');

      if (redirect) {
        window.location.href = AppConfig.ROUTES.LOGIN;
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Require authentication - throws error or redirects if not authenticated
   * @param {boolean} redirect - Whether to redirect to login (default: true)
   * @throws {Error} If not authenticated and redirect is false
   */
  function requireAuth(redirect = true) {
    const validation = validateToken(true);

    if (!validation.valid) {
      console.warn('🔒 Authentication required:', validation.reason);

      if (redirect) {
        clearAuth(true);
        return;
      }

      throw new Error(`Authentication required: ${validation.reason}`);
    }

    const user = getCurrentUser();
    if (!user) {
      console.warn('🔒 User data not found');

      if (redirect) {
        clearAuth(true);
        return;
      }

      throw new Error('User data not found');
    }

    return { token: validation.token, user, payload: validation.payload };
  }

  /**
   * Get Authorization header value
   * @returns {string|null} Bearer token header or null
   */
  function getAuthorizationHeader() {
    const token = getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Get headers object with Authorization
   * @param {Object} additionalHeaders - Additional headers to include
   * @returns {Object} Headers object
   */
  function getAuthHeaders(additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle 401 Unauthorized response
   * @param {string} message - Optional error message
   */
  function handle401(message = 'Session expired. Please login again.') {
    console.warn('⚠️ 401 Unauthorized:', message);

    // Show notification if available
    if (typeof notify !== 'undefined') {
      notify.warning(message);
    }

    // Clear auth and redirect
    clearAuth(true);
  }

  /**
   * Make authenticated API request
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   * @throws {Error} If authentication is missing or request fails
   */
  async function authenticatedFetch(url, options = {}) {
    // Require authentication
    requireAuth(false);

    // Merge headers with auth
    const headers = getAuthHeaders(options.headers || {});

    // Make request
    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401
      if (response.status === 401) {
        handle401('Your session has expired. Please login again.');
        throw new Error('Unauthorized - session expired');
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  }

  /**
   * Initialize auth helper (optional - for debugging)
   */
  function init() {
    // Log token status for debugging (only in dev)
    if (typeof DevMode !== 'undefined' && DevMode.isEnabled()) {
      const validation = validateToken();
      console.log('🔐 AuthHelper initialized');
      console.log('   Token present:', hasToken());
      console.log('   Token valid:', validation.valid);
      if (!validation.valid) {
        console.log('   Reason:', validation.reason);
      }
    }
  }

  // ==================== Public API ====================

  return {
    // Token management
    getToken,
    setToken,
    removeToken,
    hasToken,
    validateToken,
    getTokenExpiration,

    // User management
    getCurrentUser,
    isAuthenticated,

    // Auth actions
    clearAuth,
    requireAuth,

    // Headers
    getAuthorizationHeader,
    getAuthHeaders,

    // Request handling
    handle401,
    authenticatedFetch,

    // Initialization
    init,
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.AuthHelper = AuthHelper;
}

// Export for Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthHelper;
}

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AuthHelper.init);
} else {
  AuthHelper.init();
}
