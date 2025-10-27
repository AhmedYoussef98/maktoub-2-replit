/**
 * Authentication Module
 * Handles user authentication with JWT tokens
 */

const AuthService = (() => {
  // ==================== Private Functions ====================

  /**
   * Hash password using SHA-256
   * @private
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async function hashPassword(password) {
    // Check if crypto.subtle is available (requires secure context - HTTPS)
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('crypto.subtle is not available. Ensure the application is served over HTTPS.');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest(
      AppConfig.AUTH.PASSWORD_HASH_ALGORITHM,
      data
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate email domain against allowed domains
   * @private
   * @param {string} email - Email address to validate
   * @returns {{allowed: boolean, message?: string}} Validation result
   */
  function isEmailDomainAllowed(email) {
    const allowedDomains = AppConfig.AUTH.ALLOWED_DOMAINS;

    // If no domains specified, allow all
    if (allowedDomains.length === 0) {
      return { allowed: true };
    }

    if (!Utils.isValidEmail(email)) {
      return {
        allowed: false,
        message: AppConstants.ERROR_MESSAGES.INVALID_EMAIL,
      };
    }

    const domain = email.split('@')[1].toLowerCase();

    if (allowedDomains.map((d) => d.toLowerCase()).includes(domain)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: `يُسمح فقط بالبريد الإلكتروني من النطاقات: ${allowedDomains.join(', ')}`,
    };
  }

  /**
   * Parse JWT token
   * @private
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      throw error;
    }
  }

  /**
   * Make authentication request to proxy
   * @private
   * @param {string} endpoint - Proxy endpoint (login or signup)
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>} Response data
   */
  async function makeAuthRequest(endpoint, payload) {
    try {
      const url = `/api/auth/${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Auth request error:', error);
      throw error;
    }
  }

  /**
   * Store user session data with JWT token
   * @private
   * @param {Object} authData - Authentication data from API
   */
  function storeUserSession(authData) {
    if (!authData) {
      console.error('❌ Cannot store user session: authData is null or undefined');
      throw new Error('Invalid auth data');
    }

    // Store JWT token
    if (authData.token) {
      Utils.setSessionItem(AppConfig.AUTH.JWT_TOKEN_KEY, authData.token);
    }

    // Parse JWT to get user info
    let userData = {};
    if (authData.token) {
      try {
        const tokenPayload = parseJwt(authData.token);
        userData = {
          email: tokenPayload.email || tokenPayload.sub,
          name: tokenPayload.name || tokenPayload.email,
          ...tokenPayload,
        };
      } catch (error) {
        console.warn('Could not parse JWT token:', error);
      }
    }

    // Merge with additional user data if provided
    if (authData.user) {
      userData = { ...userData, ...authData.user };
    }

    Utils.setSessionItem(AppConfig.AUTH.SESSION_STORAGE_KEY, userData);
  }

  /**
   * Redirect to index page
   * @private
   */
  function redirectToIndex() {
    window.location.href = AppConfig.ROUTES.INDEX;
  }

  /**
   * Redirect to login page
   * @private
   */
  function redirectToLogin() {
    window.location.href = AppConfig.ROUTES.LOGIN;
  }

  /**
   * Handle authentication errors with appropriate messages
   * @private
   * @param {Error|Object} error - Error object
   */
  function handleAuthError(error) {
    const errorMessage = error.message || AppConstants.ERROR_MESSAGES.UNKNOWN_ERROR;

    // Map common error messages
    const errorMap = {
      'Invalid credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'User not found': 'المستخدم غير موجود',
      'Email already exists': 'البريد الإلكتروني مستخدم بالفعل',
      'Unauthorized': AppConstants.ERROR_MESSAGES.UNAUTHORIZED,
      'Forbidden': 'الوصول مرفوض',
    };

    const mappedMessage = errorMap[errorMessage] || errorMessage;

    if (typeof notify !== 'undefined') {
      notify.error(mappedMessage);
    }
  }

  /**
   * Toggle submit button state
   * @private
   */
  function toggleSubmitButton(button, isLoading, loadingText) {
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  // ==================== Public Functions ====================

  /**
   * Handle email/password login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<boolean>} Success status
   */
  async function login(email, password) {
    try {
      // Validate email format
      if (!Utils.isValidEmail(email)) {
        if (typeof notify !== 'undefined') {
          notify.error(AppConstants.ERROR_MESSAGES.INVALID_EMAIL);
        }
        return false;
      }

      // Check domain if restrictions are in place
      const domainCheck = isEmailDomainAllowed(email);
      if (!domainCheck.allowed) {
        if (typeof notify !== 'undefined') {
          notify.error(domainCheck.message);
        }
        return false;
      }

      // Make API request
      const payload = {
        email: email,
        password: password,
      };

      const result = await makeAuthRequest('login', payload);

      // API returns: { token, sheet_id, google_drive_id }
      if (result && result.token) {
        console.log('✅ Login successful');
        storeUserSession(result);

        if (typeof notify !== 'undefined') {
          notify.success(AppConstants.SUCCESS_MESSAGES.LOGIN_SUCCESS);
        }

        redirectToIndex();
        return true;
      } else {
        console.error('❌ Login failed: No token received');
        if (typeof notify !== 'undefined') {
          notify.error(AppConstants.ERROR_MESSAGES.LOGIN_FAILED);
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      handleAuthError(error);
      return false;
    }
  }

  /**
   * Handle user signup
   * @param {string} fullName - User full name
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} confirmPassword - Password confirmation
   * @param {string} phoneNumber - User phone number (optional)
   * @returns {Promise<boolean>} Success status
   */
  async function signup(fullName, email, password, confirmPassword, phoneNumber = '') {
    try {
      // Validate password match
      if (password !== confirmPassword) {
        if (typeof notify !== 'undefined') {
          notify.error('كلمات المرور غير متطابقة!');
        }
        return false;
      }

      // Validate email format
      if (!Utils.isValidEmail(email)) {
        if (typeof notify !== 'undefined') {
          notify.error(AppConstants.ERROR_MESSAGES.INVALID_EMAIL);
        }
        return false;
      }

      // Check domain if restrictions are in place
      const domainCheck = isEmailDomainAllowed(email);
      if (!domainCheck.allowed) {
        if (typeof notify !== 'undefined') {
          notify.error(domainCheck.message);
        }
        return false;
      }

      // Make API request
      const payload = {
        email: email,
        password: password,
        full_name: fullName,
        phone_number: phoneNumber || '',
      };

      const result = await makeAuthRequest('signup', payload);

      // API returns 201 on success
      if (result) {
        if (typeof notify !== 'undefined') {
          notify.success(AppConstants.SUCCESS_MESSAGES.SIGNUP_SUCCESS);
        }
        redirectToLogin();
        return true;
      } else {
        if (typeof notify !== 'undefined') {
          notify.error(AppConstants.ERROR_MESSAGES.SIGNUP_FAILED);
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      handleAuthError(error);
      return false;
    }
  }

  /**
   * Handle forgot password - send reset email
   * @param {string} email - User email
   * @returns {Promise<boolean>} Success status
   */
  async function forgotPassword(email) {
    try {
      // Validate email format
      if (!Utils.isValidEmail(email)) {
        if (typeof notify !== 'undefined') {
          notify.error(AppConstants.ERROR_MESSAGES.INVALID_EMAIL);
        }
        return false;
      }

      // NOTE: Forgot password endpoint not documented in API_ENDPOINTS.md
      // This is a placeholder implementation
      if (typeof notify !== 'undefined') {
        notify.warning('وظيفة إعادة تعيين كلمة المرور غير متاحة حالياً. يرجى التواصل مع الدعم الفني.');
      }

      return false;
    } catch (error) {
      console.error('Forgot password error:', error);
      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء إرسال رابط إعادة التعيين');
      }
      return false;
    }
  }


  /**
   * Logout current user
   */
  function logout() {
    // Remove JWT token and session data
    Utils.removeSessionItem(AppConfig.AUTH.JWT_TOKEN_KEY);
    Utils.removeSessionItem(AppConfig.AUTH.SESSION_STORAGE_KEY);

    if (typeof notify !== 'undefined') {
      notify.success(AppConstants.SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    }

    redirectToLogin();
  }

  /**
   * Get current logged-in user
   * @returns {Object|null} User data or null
   */
  function getCurrentUser() {
    return Utils.getSessionItem(AppConfig.AUTH.SESSION_STORAGE_KEY);
  }

  /**
   * Check if user is logged in
   * @returns {boolean} Login status
   */
  function isLoggedIn() {
    const token = Utils.getSessionItem(AppConfig.AUTH.JWT_TOKEN_KEY);
    const user = getCurrentUser();
    return token !== null && user !== null;
  }

  /**
   * Get JWT token
   * @returns {string|null} JWT token or null
   */
  function getToken() {
    return Utils.getSessionItem(AppConfig.AUTH.JWT_TOKEN_KEY);
  }


  /**
   * Initialize form handlers
   * @private
   */
  function initializeFormHandlers() {
    const loginForm = Utils.getElement('loginForm');
    const signupForm = Utils.getElement('signupForm');

    // Login form handler
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = Utils.getElement('email')?.value;
        const password = Utils.getElement('password')?.value;

        if (email && password) {
          const submitButton = loginForm.querySelector('button[type="submit"]');
          if (submitButton) {
            toggleSubmitButton(submitButton, true, AppConstants.LOADING_MESSAGES.LOGGING_IN);
          }

          try {
            await login(email, password);
          } finally {
            if (submitButton) {
              toggleSubmitButton(submitButton, false);
            }
          }
        }
      });
    }

    // Signup form handler
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = signupForm.querySelector('button[type="submit"]');

        const fullName = Utils.getElement('name')?.value || Utils.getElement('fullName')?.value;
        const email = Utils.getElement('signupEmail')?.value || Utils.getElement('email')?.value;
        const password = Utils.getElement('signupPassword')?.value || Utils.getElement('password')?.value;
        const confirmPassword = Utils.getElement('confirmPassword')?.value;
        const phoneNumber = Utils.getElement('phoneNumber')?.value || Utils.getElement('phone')?.value || '';

        if (fullName && email && password && confirmPassword) {
          toggleSubmitButton(submitButton, true, AppConstants.LOADING_MESSAGES.PROCESSING);

          try {
            await signup(fullName, email, password, confirmPassword, phoneNumber);
          } finally {
            toggleSubmitButton(submitButton, false);
          }
        }
      });
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormHandlers);
  } else {
    initializeFormHandlers();
  }

  // ==================== Public API ====================

  return {
    login,
    signup,
    forgotPassword,
    logout,
    getCurrentUser,
    isLoggedIn,
    getToken,
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}
