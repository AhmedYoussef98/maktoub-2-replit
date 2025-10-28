/**
 * Application Constants
 * Centralized constants for magic strings, numbers, and enums
 */

const AppConstants = (() => {
  // Letter Status Constants
  const LETTER_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    DRAFT: 'draft',
    IN_REVIEW: 'in_review',
  };

  // Letter Types
  const LETTER_TYPES = {
    FIRST: 'first',
    FOLLOW_UP: 'follow_up',
    REPLY: 'reply',
  };

  // HTTP Status Codes
  const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  };

  // Notification Types
  const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    LOADING: 'loading',
  };

  // Font Awesome Icons
  const ICONS = {
    SUCCESS: 'fa-check-circle',
    ERROR: 'fa-exclamation-circle',
    WARNING: 'fa-exclamation-triangle',
    INFO: 'fa-info-circle',
    MOON: 'fa-moon',
    SUN: 'fa-sun',
    LOADING: 'fa-spinner fa-spin',
    LOGOUT: 'fa-sign-out-alt',
    USER: 'fa-user',
    EDIT: 'fa-edit',
    DELETE: 'fa-trash',
    DOWNLOAD: 'fa-download',
    PRINT: 'fa-print',
    CLOSE: 'fa-times',
    CHECK: 'fa-check',
    QUESTION: 'fa-question-circle',
  };

  // Default Values
  const DEFAULTS = {
    RECIPIENT_TITLE: 'لا يوجد لقب',
    RECIPIENT_NAME: 'لا يوجد',
    EMPTY_VALUE: '',
    OTHER_OPTION: 'أخرى',
  };

  // Date Formats
  const DATE_FORMATS = {
    ISO: 'YYYY-MM-DD',
    ARABIC: 'DD/MM/YYYY',
    HIJRI: 'iDD/iMM/iYYYY',
  };

  // Regular Expressions
  const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\d\s+()-]+$/,
    GOOGLE_DRIVE_FILE_ID: /\/file\/d\/([a-zA-Z0-9-_]+)|open\?id=([a-zA-Z0-9-_]+)|id=([a-zA-Z0-9-_]+)/,
    WHITESPACE: /\s+/g,
  };

  // API Endpoints
  const ENDPOINTS = {
    // Authentication endpoints
    USER_VALIDATE: 'user/validate',
    USER_CREATE: 'user/create-user',
    USER_CLIENT: 'user/client',
    USER_CLIENTS: 'user/clients',

    // Letter endpoints
    LETTER_GENERATE: 'letter/generate',
    LETTER_VALIDATE: 'letter/validate',
    LETTER_CATEGORIES: 'letter/categories',
    LETTER_TEMPLATES: 'letter/templates',
    LETTER_HEALTH: 'letter/health',

    // Chat endpoints
    CHAT_SESSIONS: 'chat/sessions',
    CHAT_EDIT: 'chat/sessions',  // + /:session_id/edit
    CHAT_HISTORY: 'chat/sessions',  // + /:session_id/history
    CHAT_STATUS: 'chat/sessions',  // + /:session_id/status
    CHAT_EXTEND: 'chat/sessions',  // + /:session_id/extend
    CHAT_DELETE: 'chat/sessions',  // + /:session_id (DELETE)
    CHAT_HEALTH: 'chat/health',

    // Archive endpoints
    ARCHIVE_LETTER: 'archive/letter',
    ARCHIVE_STATUS: 'archive/status',  // + /:letter_id
    ARCHIVE_UPDATE: 'archive/update',
    ARCHIVE_HEALTH: 'archive/health',

    // Submissions endpoints
    SUBMISSIONS: 'submissions',
    SUBMISSIONS_SINGLE: 'submissions',  // + /:submission_id
    SUBMISSIONS_STATS: 'submissions/stats',

    // Admin user management endpoints
    ADMIN_USERS: 'user/admin/users',
    ADMIN_CREATE_USER: 'user/admin/users/create',
    ADMIN_UPDATE_USER: 'user/admin/users/update',
    ADMIN_DELETE_USER: 'user/admin/users/delete',

    // Health checks
    USER_HEALTH: 'user/health',
  };

  // CSS Classes
  const CSS_CLASSES = {
    DARK_MODE: 'dark-mode',
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    DISABLED: 'disabled',
    NOTIFICATION_SHOW: 'notification-show',
    NOTIFICATION_HIDE: 'notification-hide',
  };

  // Error Messages (Arabic)
  const ERROR_MESSAGES = {
    NETWORK_ERROR: 'حدث خطأ في الاتصال بالخادم',
    INVALID_EMAIL: 'البريد الإلكتروني غير صحيح',
    INVALID_PASSWORD: 'كلمة المرور غير صحيحة',
    LOGIN_FAILED: 'فشل تسجيل الدخول',
    SIGNUP_FAILED: 'فشل إنشاء الحساب',
    LETTER_GENERATION_FAILED: 'فشل إنشاء الخطاب',
    LETTER_VALIDATION_FAILED: 'فشل التحقق من الخطاب',
    UNAUTHORIZED: 'غير مصرح لك بالوصول',
    SESSION_EXPIRED: 'انتهت الجلسة، الرجاء تسجيل الدخول مرة أخرى',
    UNKNOWN_ERROR: 'حدث خطأ غير معروف',
    REQUIRED_FIELD: 'هذا الحقل مطلوب',
    DOMAIN_NOT_ALLOWED: 'النطاق غير مسموح به',
  };

  // Success Messages (Arabic)
  const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
    SIGNUP_SUCCESS: 'تم إنشاء الحساب بنجاح',
    LETTER_GENERATED: 'تم إنشاء الخطاب بنجاح',
    LETTER_SAVED: 'تم حفظ الخطاب بنجاح',
    LETTER_UPDATED: 'تم تحديث الخطاب بنجاح',
    LETTER_DELETED: 'تم حذف الخطاب بنجاح',
    LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
  };

  // Loading Messages (Arabic)
  const LOADING_MESSAGES = {
    LOADING: 'جاري التحميل...',
    GENERATING_LETTER: 'جاري إنشاء الخطاب...',
    VALIDATING_LETTER: 'جاري التحقق من الخطاب...',
    SAVING: 'جاري الحفظ...',
    LOGGING_IN: 'جاري تسجيل الدخول...',
    PROCESSING: 'جاري المعالجة...',
  };

  // Return public constants object
  return {
    LETTER_STATUS,
    LETTER_TYPES,
    HTTP_STATUS,
    NOTIFICATION_TYPES,
    ICONS,
    DEFAULTS,
    DATE_FORMATS,
    REGEX,
    ENDPOINTS,
    CSS_CLASSES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LOADING_MESSAGES,
  };
})();

// Export for browser
if (typeof window !== 'undefined') {
  window.AppConstants = AppConstants;
}

// Export for Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConstants;
}
