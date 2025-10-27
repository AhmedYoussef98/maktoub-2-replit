/**
 * Authentication Guard
 * Protects pages from unauthorized access and manages user profile UI
 */

(function () {
  'use strict';

  /**
   * Check if current page is login or signup page
   * @returns {boolean} True if on auth page
   */
  function isAuthPage() {
    const pathname = window.location.pathname;
    return pathname.endsWith('login.html') || pathname.endsWith('signup.html');
  }

  /**
   * Get current logged-in user from session
   * @returns {Object|null} User data or null
   */
  function getCurrentUser() {
    try {
      const userData = sessionStorage.getItem('loggedInUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Redirect to login page
   */
  function redirectToLogin() {
    window.location.href = 'login.html';
  }

  /**
   * Handle user logout
   */
  function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    redirectToLogin();
  }

  /**
   * Create and inject profile UI
   * @param {Object} user - User data
   */
  function initializeProfileUI(user) {
    const profileContainer = document.getElementById('profile-container');
    if (!profileContainer) return;

    const safeUsername = Utils.escapeHtml(user.username || user.name || 'User');

    // Default avatar SVG data URI (simple user icon)
    const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23047857'/%3E%3Cpath d='M20 20c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z' fill='white'/%3E%3C/svg%3E";

    // Use default avatar if no imageUrl or if it's empty
    const imageUrl = user.imageUrl && user.imageUrl.trim() !== '' ? user.imageUrl : defaultAvatar;

    // Check if this is the new dashboard design or old design
    const isDashboardDesign = profileContainer.classList.contains('navbar-profile');

    if (isDashboardDesign) {
      // New dashboard design with dropdown
      const safeEmail = Utils.escapeHtml(user.email || '');

      profileContainer.innerHTML = `
        <div class="avatar">
          ${imageUrl === defaultAvatar ?
            '<div class="avatar-circle"></div>' :
            `<img src="${Utils.escapeHtml(imageUrl)}" alt="Profile" class="avatar-image" id="user-image">`
          }
        </div>
        <span class="profile-name">${safeUsername}</span>
        <svg class="chevron-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z" fill="#A0ECDC"/>
        </svg>

        <!-- Dropdown Menu -->
        <div class="profile-dropdown">
          <div class="profile-dropdown-header">
            <div class="avatar">
              ${imageUrl === defaultAvatar ?
                '<div class="avatar-circle"></div>' :
                `<img src="${Utils.escapeHtml(imageUrl)}" alt="Profile" class="avatar-image">`
              }
            </div>
            <div class="profile-dropdown-info">
              <div class="profile-dropdown-name">${safeUsername}</div>
              <div class="profile-dropdown-email">${safeEmail}</div>
            </div>
          </div>
          <div class="profile-dropdown-menu">
            <div class="profile-dropdown-item" id="theme-toggle">
              <div class="profile-dropdown-item-content">
                <svg class="profile-dropdown-item-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2.5V4.16667M10 15.8333V17.5M4.16667 10H2.5M6.16667 6.16667L5 5M13.8333 6.16667L15 5M6.16667 13.8333L5 15M13.8333 13.8333L15 15M17.5 10H15.8333M13.3333 10C13.3333 11.8409 11.8409 13.3333 10 13.3333C8.15905 13.3333 6.66667 11.8409 6.66667 10C6.66667 8.15905 8.15905 6.66667 10 6.66667C11.8409 6.66667 13.3333 8.15905 13.3333 10Z" stroke="#A0ECDC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="profile-dropdown-item-text">الوضع الفاتح</span>
              </div>
            </div>
            <div class="profile-dropdown-item" id="admin-panel">
              <div class="profile-dropdown-item-content">
                <svg class="profile-dropdown-item-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 1.66666L3.33333 4.16666V9.16666C3.33333 13.0833 6.08333 16.75 10 17.5C13.9167 16.75 16.6667 13.0833 16.6667 9.16666V4.16666L10 1.66666Z" stroke="#A0ECDC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="profile-dropdown-item-text">لوحة الإدارة</span>
              </div>
            </div>
            <div class="profile-dropdown-item logout" id="dropdown-logout">
              <div class="profile-dropdown-item-content">
                <svg class="profile-dropdown-item-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3333 14.1667L17.5 10M17.5 10L13.3333 5.83333M17.5 10H7.5M7.5 2.5H6.5C4.84315 2.5 3.5 3.84315 3.5 5.5V14.5C3.5 16.1569 4.84315 17.5 6.5 17.5H7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="profile-dropdown-item-text">تسجيل الخروج</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add click handler to toggle dropdown
      profileContainer.addEventListener('click', function(e) {
        e.stopPropagation();
        profileContainer.classList.toggle('active');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!profileContainer.contains(e.target)) {
          profileContainer.classList.remove('active');
        }
      });

      // Handle logout
      const logoutBtn = document.getElementById('dropdown-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          handleLogout();
        });
      }

      // Handle admin panel navigation
      const adminPanel = document.getElementById('admin-panel');
      if (adminPanel) {
        adminPanel.addEventListener('click', function(e) {
          e.stopPropagation();
          // Navigate to admin panel page
          window.location.href = '/admin-panel.html';
        });
      }

      // Handle theme toggle
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
          e.stopPropagation();
          // Toggle between light and dark mode (placeholder for future implementation)
          const currentTheme = document.body.getAttribute('data-theme') || 'dark';
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          document.body.setAttribute('data-theme', newTheme);

          // Update button text
          const themeText = this.querySelector('.profile-dropdown-item-text');
          if (themeText) {
            themeText.textContent = newTheme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن';
          }

          console.log('Theme switched to:', newTheme);
          // TODO: Implement full theme switching with CSS variables
        });
      }
    } else {
      // Old design (for other pages)
      profileContainer.innerHTML = `
        <div class="profile-info">
          <span id="username">${safeUsername}</span>
          <img id="user-image" src="${Utils.escapeHtml(imageUrl)}" alt="Profile">
        </div>
        <button id="logoutButton" class="logout-button">
          <i class="fas ${AppConstants.ICONS.LOGOUT}"></i>
          خروج
        </button>
      `;

      const logoutButton = document.getElementById('logoutButton');
      if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
      }
    }

    // Add error handler for avatar image if needed
    const userImage = document.getElementById('user-image');
    if (userImage && imageUrl !== defaultAvatar) {
      userImage.addEventListener('error', function() {
        // Replace with gradient avatar circle
        const avatar = this.parentElement;
        avatar.innerHTML = '<div class="avatar-circle"></div>';
      }, { once: true });
    }
  }

  /**
   * Initialize auth guard
   */
  function init() {
    // Skip auth check if on login/signup pages
    if (isAuthPage()) {
      return;
    }

    // Check for dev mode bypass
    if (typeof DevMode !== 'undefined' && DevMode.shouldBypassAuth()) {
      console.log('🔓 Auth guard bypassed (Dev Mode)');
      const testUser = DevMode.getTestUser();

      // Initialize profile UI with test user
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initializeProfileUI(testUser);
        });
      } else {
        initializeProfileUI(testUser);
      }
      return;
    }

    // Enhanced token validation using AuthHelper
    if (typeof AuthHelper !== 'undefined') {
      const validation = AuthHelper.validateToken(true);

      if (!validation.valid) {
        console.log('🔒 Token validation failed:', validation.reason);

        if (typeof notify !== 'undefined') {
          notify.warning('يرجى تسجيل الدخول للمتابعة');
        }

        // Clear invalid auth data and redirect
        AuthHelper.clearAuth(true);
        return;
      }

      // Check if user data exists
      const user = AuthHelper.getCurrentUser();
      if (!user) {
        console.log('🔒 No user data found, redirecting to login');

        if (typeof notify !== 'undefined') {
          notify.warning('يرجى تسجيل الدخول للمتابعة');
        }

        AuthHelper.clearAuth(true);
        return;
      }

      console.log('✅ User authenticated:', user.email || user.username);

      // Initialize profile UI when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initializeProfileUI(user);
        });
      } else {
        initializeProfileUI(user);
      }
    } else {
      // Fallback to basic user check if AuthHelper not available
      const user = getCurrentUser();

      // Redirect to login if no user found
      if (!user) {
        console.log('🔒 No user found, redirecting to login');
        redirectToLogin();
        return;
      }

      // Initialize profile UI when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initializeProfileUI(user);
        });
      } else {
        initializeProfileUI(user);
      }
    }
  }

  // Run auth guard immediately
  init();
})();
