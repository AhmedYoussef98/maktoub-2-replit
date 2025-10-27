/**
 * Development Mode Configuration
 * Only use this for LOCAL DEVELOPMENT - NEVER in production!
 */

const DevMode = (() => {
  // ==================== Configuration ====================

  const DEV_CONFIG = {
    // Set to true to enable development mode
    // ⚠️ PRODUCTION: Set to FALSE before deploying!
    ENABLED: false,

    // Set to true to bypass authentication (auto-login)
    // Set to false to test real login flow with test credentials
    BYPASS_AUTH: false,

    // Test user data
    TEST_USER: {
      username: '',
      name: '',
      email: '',
      imageUrl: '',
      role: 'user',
      whitelisted: false,
      active: false,
    },

    // Test credentials for login
    TEST_CREDENTIALS: {
      email: '',
      password: '',
      passwordHash: '',
    },
  };

  // ==================== Functions ====================

  /**
   * Check if dev mode is enabled
   */
  function isEnabled() {
    return DEV_CONFIG.ENABLED;
  }

  /**
   * Check if auth bypass is enabled
   */
  function shouldBypassAuth() {
    return DEV_CONFIG.ENABLED && DEV_CONFIG.BYPASS_AUTH;
  }

  /**
   * Get test user data
   */
  function getTestUser() {
    return { ...DEV_CONFIG.TEST_USER };
  }

  /**
   * Setup development user in sessionStorage
   */
  function setupTestUser() {
    if (!shouldBypassAuth()) {
      console.log('⚠️ Dev mode auth bypass is disabled');
      return false;
    }

    try {
      const testUser = getTestUser();
      sessionStorage.setItem('loggedInUser', JSON.stringify(testUser));
      console.log('✅ Development user created:', testUser.email);
      console.log('👤 Role:', testUser.role);
      console.log('🔓 Auth bypass enabled');
      return true;
    } catch (error) {
      console.error('❌ Failed to setup test user:', error);
      return false;
    }
  }

  /**
   * Clear test user from sessionStorage
   */
  function clearTestUser() {
    sessionStorage.removeItem('loggedInUser');
    console.log('🗑️ Test user cleared');
  }

  /**
   * Get test credentials
   */
  function getTestCredentials() {
    return { ...DEV_CONFIG.TEST_CREDENTIALS };
  }

  /**
   * Log current dev mode status
   */
  function logStatus() {
    console.log('='.repeat(50));
    console.log('🔧 DEVELOPMENT MODE STATUS');
    console.log('='.repeat(50));
    console.log('Enabled:', DEV_CONFIG.ENABLED);
    console.log('Bypass Auth:', DEV_CONFIG.BYPASS_AUTH);

    if (DEV_CONFIG.BYPASS_AUTH) {
      console.log('Test User:', DEV_CONFIG.TEST_USER.email);
      console.log('Role:', DEV_CONFIG.TEST_USER.role);
    } else {
      console.log('📧 Test Login Credentials:');
      console.log('   Email:', DEV_CONFIG.TEST_CREDENTIALS.email);
      console.log('   Password:', DEV_CONFIG.TEST_CREDENTIALS.password);
    }

    console.log('='.repeat(50));

    if (DEV_CONFIG.ENABLED) {
      console.log('⚠️ WARNING: Development mode is ENABLED');
      console.log('⚠️ Make sure to DISABLE before production!');
      console.log('='.repeat(50));
    }
  }

  /**
   * Initialize dev mode if enabled
   */
  function init() {
    if (!isEnabled()) {
      return;
    }

    logStatus();

    // Auto-setup test user if bypass is enabled
    if (shouldBypassAuth()) {
      setupTestUser();
    }
  }

  // ==================== Public API ====================

  return {
    isEnabled,
    shouldBypassAuth,
    getTestUser,
    getTestCredentials,
    setupTestUser,
    clearTestUser,
    logStatus,
    init,
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.DevMode = DevMode;
}

// Auto-initialize
DevMode.init();
