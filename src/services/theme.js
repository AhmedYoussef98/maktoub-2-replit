/**
 * Theme Service
 * Handles light/dark mode theming throughout the application
 */

const ThemeService = (() => {
  // ==================== Constants ====================

  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
  };

  const STORAGE_KEY = AppConfig?.THEME?.STORAGE_KEY || 'theme';
  const DEFAULT_THEME = AppConfig?.THEME?.DEFAULT || THEMES.DARK;

  // ==================== Private State ====================

  let currentTheme = null;

  // ==================== Private Functions ====================

  /**
   * Get system theme preference
   * @private
   * @returns {string} 'light' or 'dark'
   */
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEMES.DARK;
    }
    return THEMES.LIGHT;
  }

  /**
   * Apply theme to document
   * @private
   * @param {string} theme - 'light' or 'dark'
   */
  function applyTheme(theme) {
    // Set data attribute on html element
    document.documentElement.setAttribute('data-theme', theme);

    // Also set on body for legacy support
    document.body.setAttribute('data-theme', theme);

    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(theme);

    console.log(`✅ Theme applied: ${theme}`);
  }

  /**
   * Update meta theme-color for mobile browsers
   * @private
   * @param {string} theme - 'light' or 'dark'
   */
  function updateMetaThemeColor(theme) {
    let metaTheme = document.querySelector('meta[name="theme-color"]');

    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }

    // Set theme color based on mode
    const themeColor = theme === THEMES.DARK ? '#102320' : '#FFFFFF';
    metaTheme.setAttribute('content', themeColor);
  }

  /**
   * Save theme to localStorage
   * @private
   * @param {string} theme - 'light' or 'dark'
   */
  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
      console.log(`💾 Theme saved to localStorage: ${theme}`);
    } catch (error) {
      console.error('❌ Failed to save theme to localStorage:', error);
    }
  }

  /**
   * Load theme from localStorage
   * @private
   * @returns {string|null} Saved theme or null
   */
  function loadTheme() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      console.log(`📖 Theme loaded from localStorage: ${savedTheme || 'none'}`);
      return savedTheme;
    } catch (error) {
      console.error('❌ Failed to load theme from localStorage:', error);
      return null;
    }
  }

  /**
   * Emit custom theme change event
   * @private
   * @param {string} theme - New theme
   */
  function emitThemeChangeEvent(theme) {
    const event = new CustomEvent('themechange', {
      detail: { theme },
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(event);
    console.log(`📢 Theme change event emitted: ${theme}`);
  }

  // ==================== Public Functions ====================

  /**
   * Initialize theme service
   * Loads saved theme or defaults to system/config preference
   */
  function init() {
    console.log('🎨 Initializing ThemeService...');

    // Priority: localStorage > system preference > default
    const savedTheme = loadTheme();
    const systemTheme = getSystemTheme();
    const initialTheme = savedTheme || systemTheme || DEFAULT_THEME;

    currentTheme = initialTheme;
    applyTheme(currentTheme);

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!loadTheme()) {
          // Only auto-switch if user hasn't manually set a theme
          const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
          setTheme(newTheme);
          console.log(`🌓 System theme changed to: ${newTheme}`);
        }
      });
    }

    console.log(`✅ ThemeService initialized with theme: ${currentTheme}`);
  }

  /**
   * Get current theme
   * @returns {string} Current theme ('light' or 'dark')
   */
  function getTheme() {
    return currentTheme || DEFAULT_THEME;
  }

  /**
   * Set theme
   * @param {string} theme - 'light' or 'dark'
   */
  function setTheme(theme) {
    if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
      console.error(`❌ Invalid theme: ${theme}. Must be 'light' or 'dark'.`);
      return;
    }

    currentTheme = theme;
    applyTheme(theme);
    saveTheme(theme);
    emitThemeChangeEvent(theme);
  }

  /**
   * Toggle between light and dark theme
   * @returns {string} New theme
   */
  function toggleTheme() {
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
    console.log(`🔄 Theme toggled to: ${newTheme}`);
    return newTheme;
  }

  /**
   * Check if current theme is dark
   * @returns {boolean} True if dark theme
   */
  function isDark() {
    return currentTheme === THEMES.DARK;
  }

  /**
   * Check if current theme is light
   * @returns {boolean} True if light theme
   */
  function isLight() {
    return currentTheme === THEMES.LIGHT;
  }

  // ==================== Public API ====================

  return {
    THEMES,
    init,
    getTheme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.ThemeService = ThemeService;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ThemeService.init();
  });
} else {
  ThemeService.init();
}
