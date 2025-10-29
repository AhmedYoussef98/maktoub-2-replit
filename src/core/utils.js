/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

const Utils = (() => {
  // ==================== DOM Utilities ====================

  /**
   * Safely get element by ID
   * @param {string} id - Element ID
   * @returns {HTMLElement|null}
   */
  const getElement = (id) => document.getElementById(id);

  /**
   * Safely get elements by selector
   * @param {string} selector - CSS selector
   * @param {HTMLElement} parent - Parent element (optional)
   * @returns {NodeList}
   */
  const getElements = (selector, parent = document) =>
    parent.querySelectorAll(selector);

  /**
   * Add class to element safely
   * @param {HTMLElement} element
   * @param {string} className
   */
  const addClass = (element, className) => {
    if (element && className) {
      element.classList.add(className);
    }
  };

  /**
   * Remove class from element safely
   * @param {HTMLElement} element
   * @param {string} className
   */
  const removeClass = (element, className) => {
    if (element && className) {
      element.classList.remove(className);
    }
  };

  /**
   * Toggle class on element safely
   * @param {HTMLElement} element
   * @param {string} className
   */
  const toggleClass = (element, className) => {
    if (element && className) {
      element.classList.toggle(className);
    }
  };

  /**
   * Check if element has class
   * @param {HTMLElement} element
   * @param {string} className
   * @returns {boolean}
   */
  const hasClass = (element, className) => {
    return element && className ? element.classList.contains(className) : false;
  };

  /**
   * Show element by removing 'hidden' class
   * @param {HTMLElement} element
   */
  const show = (element) => {
    if (element) {
      removeClass(element, 'hidden');
      element.style.display = '';
    }
  };

  /**
   * Hide element by adding 'hidden' class
   * @param {HTMLElement} element
   */
  const hide = (element) => {
    if (element) {
      addClass(element, 'hidden');
    }
  };

  // ==================== Validation Utilities ====================

  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  const isValidEmail = (email) => {
    return AppConstants.REGEX.EMAIL.test(email);
  };

  /**
   * Validate phone number format
   * @param {string} phone
   * @returns {boolean}
   */
  const isValidPhone = (phone) => {
    return AppConstants.REGEX.PHONE.test(phone);
  };

  /**
   * Check if string is empty or whitespace
   * @param {string} str
   * @returns {boolean}
   */
  const isEmpty = (str) => {
    return !str || str.trim() === '';
  };

  /**
   * Check if value is null or undefined
   * @param {*} value
   * @returns {boolean}
   */
  const isNullOrUndefined = (value) => {
    return value === null || value === undefined;
  };

  /**
   * Validate required field
   * @param {string} value
   * @param {string} fieldName
   * @returns {{valid: boolean, message: string}}
   */
  const validateRequired = (value, fieldName) => {
    if (isEmpty(value)) {
      return {
        valid: false,
        message: `${fieldName} ${AppConstants.ERROR_MESSAGES.REQUIRED_FIELD}`,
      };
    }
    return { valid: true, message: '' };
  };

  // ==================== String Utilities ====================

  /**
   * Capitalize first letter of string
   * @param {string} str
   * @returns {string}
   */
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  /**
   * Truncate string to specified length
   * @param {string} str
   * @param {number} maxLength
   * @param {string} suffix
   * @returns {string}
   */
  const truncate = (str, maxLength, suffix = '...') => {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  };

  /**
   * Escape HTML special characters
   * @param {string} str
   * @returns {string}
   */
  const escapeHtml = (str) => {
    if (str === null || str === undefined) {
      return '';
    }
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  };

  /**
   * Remove extra whitespace from string
   * @param {string} str
   * @returns {string}
   */
  const normalizeWhitespace = (str) => {
    return str ? str.replace(AppConstants.REGEX.WHITESPACE, ' ').trim() : '';
  };

  // ==================== Storage Utilities ====================

  /**
   * Get item from localStorage with JSON parsing
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  const getStorageItem = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  };

  /**
   * Set item in localStorage with JSON stringification
   * @param {string} key
   * @param {*} value
   * @returns {boolean} Success status
   */
  const setStorageItem = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  };

  /**
   * Remove item from localStorage
   * @param {string} key
   */
  const removeStorageItem = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  };

  /**
   * Clear all localStorage
   */
  const clearStorage = () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  /**
   * Get item from sessionStorage with JSON parsing
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  const getSessionItem = (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from sessionStorage (${key}):`, error);
      return defaultValue;
    }
  };

  /**
   * Set item in sessionStorage with JSON stringification
   * @param {string} key
   * @param {*} value
   * @returns {boolean} Success status
   */
  const setSessionItem = (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to sessionStorage (${key}):`, error);
      return false;
    }
  };

  /**
   * Remove item from sessionStorage
   * @param {string} key
   */
  const removeSessionItem = (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from sessionStorage (${key}):`, error);
    }
  };

  // ==================== Date Utilities ====================

  /**
   * Format date to Arabic format
   * @param {Date|string} date
   * @returns {string}
   */
  const formatDateArabic = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  /**
   * Format date to ISO format (YYYY-MM-DD)
   * @param {Date|string} date
   * @returns {string}
   */
  const formatDateISO = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  /**
   * Get current date in ISO format
   * @returns {string}
   */
  const getCurrentDateISO = () => {
    return formatDateISO(new Date());
  };

  /**
   * Check if date is valid
   * @param {*} date
   * @returns {boolean}
   */
  const isValidDate = (date) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  };

  // ==================== URL Utilities ====================

  /**
   * Convert Google Drive URL to direct image URL
   * @param {string} driveUrl
   * @returns {string}
   */
  const convertDriveUrlToDirectUrl = (driveUrl) => {
    if (!driveUrl || typeof driveUrl !== 'string') {
      return '';
    }

    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /open\?id=([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
    ];

    let fileId = null;
    for (const pattern of patterns) {
      const match = driveUrl.match(pattern);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }

    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`;
    }

    return driveUrl;
  };

  /**
   * Get query parameter from URL
   * @param {string} param
   * @returns {string|null}
   */
  const getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  /**
   * Build query string from object
   * @param {Object} params
   * @returns {string}
   */
  const buildQueryString = (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  };

  // ==================== Array Utilities ====================

  /**
   * Remove duplicates from array
   * @param {Array} arr
   * @returns {Array}
   */
  const uniqueArray = (arr) => {
    return [...new Set(arr)];
  };

  /**
   * Chunk array into smaller arrays
   * @param {Array} arr
   * @param {number} size
   * @returns {Array}
   */
  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  /**
   * Sort array of objects by key
   * @param {Array} arr
   * @param {string} key
   * @param {boolean} ascending
   * @returns {Array}
   */
  const sortByKey = (arr, key, ascending = true) => {
    return arr.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return ascending ? -1 : 1;
      if (aVal > bVal) return ascending ? 1 : -1;
      return 0;
    });
  };

  // ==================== Async Utilities ====================

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms
   * @returns {Promise}
   */
  const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  /**
   * Debounce function execution
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  /**
   * Throttle function execution
   * @param {Function} func
   * @param {number} limit
   * @returns {Function}
   */
  const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // ==================== Error Handling Utilities ====================

  /**
   * Safe JSON parse with fallback
   * @param {string} jsonString
   * @param {*} fallback
   * @returns {*}
   */
  const safeJsonParse = (jsonString, fallback = null) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parse error:', error);
      return fallback;
    }
  };

  /**
   * Safe JSON stringify with fallback
   * @param {*} obj
   * @param {string} fallback
   * @returns {string}
   */
  const safeJsonStringify = (obj, fallback = '{}') => {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.error('JSON stringify error:', error);
      return fallback;
    }
  };

  // Return public API
  return {
    // DOM
    getElement,
    getElements,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    show,
    hide,

    // Validation
    isValidEmail,
    isValidPhone,
    isEmpty,
    isNullOrUndefined,
    validateRequired,

    // String
    capitalize,
    truncate,
    escapeHtml,
    normalizeWhitespace,

    // Storage
    getStorageItem,
    setStorageItem,
    removeStorageItem,
    clearStorage,
    getSessionItem,
    setSessionItem,
    removeSessionItem,

    // Date
    formatDateArabic,
    formatDateISO,
    getCurrentDateISO,
    isValidDate,

    // URL
    convertDriveUrlToDirectUrl,
    getQueryParam,
    buildQueryString,

    // Array
    uniqueArray,
    chunkArray,
    sortByKey,

    // Async
    delay,
    debounce,
    throttle,

    // Error handling
    safeJsonParse,
    safeJsonStringify,
  };
})();

// Export for browser
if (typeof window !== 'undefined') {
  window.Utils = Utils;
}

// Export for Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
