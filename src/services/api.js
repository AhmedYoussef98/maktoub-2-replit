/**
 * API Client Module
 * Handles all API communication with JWT authentication and proper error handling
 */

const ApiClient = (() => {
  // ==================== Private Helper Functions ====================

  /**
   * Get JWT token from session storage
   * @private
   * @returns {string|null} JWT token or null
   */
  function getJwtToken() {
    // Use AuthHelper if available, fallback to Utils
    if (typeof AuthHelper !== 'undefined') {
      return AuthHelper.getToken();
    }
    return Utils.getSessionItem(AppConfig.AUTH.JWT_TOKEN_KEY);
  }

  /**
   * Get authorization headers with JWT token
   * @private
   * @returns {Object} Headers object
   */
  function getAuthHeaders() {
    // Use AuthHelper if available for better token management
    if (typeof AuthHelper !== 'undefined') {
      return AuthHelper.getAuthHeaders();
    }

    // Fallback to manual header construction
    const token = getJwtToken();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Map frontend endpoints to proxy endpoint names
   * @private
   * @param {string} endpoint - Frontend endpoint (e.g., 'letter/generate')
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @returns {string} Proxy endpoint name (e.g., 'generate-letter')
   */
  function mapEndpointToProxy(endpoint, method = 'GET') {
    const endpointMap = {
      'letter/generate': 'generate-letter',
      'letter/validate': 'validate-letter',
      'letter/categories': 'letter-categories',
      'letter/templates': 'letter-template',
      'chat/sessions': method === 'GET' ? 'chat-sessions' : 'create-chat-session',
      'chat/edit': 'edit-letter',
      'chat/history': 'chat-history',
      'chat/status': 'chat-status',
      'chat/extend': 'extend-chat-session',
      'chat/cleanup': 'cleanup-chat',
      'chat/sessions/delete': 'delete-chat-session',
      'archive/letter': 'archive-letter',
      'archive/status': 'archive-status',
      'archive/update': 'update-archive',
      'submissions': 'submissions',
      'submissions/stats': 'submissions-stats',
      'submissions/single': 'submissions-single',
    };

    return endpointMap[endpoint] || endpoint;
  }

  /**
   * Generic HTTP request handler with error handling
   * @private
   */
  async function makeRequest(endpoint, method = 'GET', data = null, options = {}) {
    const proxyUrl = AppConfig.getApiUrl(endpoint);
    const proxyEndpoint = mapEndpointToProxy(endpoint, method);

    let config;
    let url = proxyUrl;

    if (method === 'GET' || method === 'DELETE') {
      // For GET/DELETE requests, use query parameters
      const params = new URLSearchParams({
        endpoint: proxyEndpoint,
        ...options.queryParams,
        ...(data || {}) // Include any additional params from data
      });
      url = `${proxyUrl}?${params.toString()}`;

      config = {
        method: method,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      };
    } else {
      // For POST/PUT, wrap data in proxy format
      config = {
        method: method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify({
          endpoint: proxyEndpoint,
          data: data || {}
        })
      };
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - redirect to login
      if (response.status === AppConstants.HTTP_STATUS.UNAUTHORIZED) {
        console.warn('⚠️ Unauthorized access - redirecting to login');

        // Use AuthHelper for centralized auth clearing if available
        if (typeof AuthHelper !== 'undefined') {
          AuthHelper.handle401('Your session has expired. Please login again.');
        } else {
          // Fallback to manual clearing
          Utils.removeSessionItem(AppConfig.AUTH.JWT_TOKEN_KEY);
          Utils.removeSessionItem(AppConfig.AUTH.SESSION_STORAGE_KEY);

          if (typeof notify !== 'undefined') {
            notify.warning('Your session has expired. Please login again.');
          }

          window.location.href = AppConfig.ROUTES.LOGIN;
        }

        return null;
      }

      // Handle 429 Rate Limit
      if (response.status === 429) {
        if (typeof notify !== 'undefined') {
          notify.error('تم تجاوز حد الاستخدام. الرجاء المحاولة لاحقاً.');
        }
        throw new Error('Rate limit exceeded');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Make GET request with query parameters
   * @private
   */
  async function makeGetRequest(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    return makeRequest(fullEndpoint, 'GET');
  }

  /**
   * Toggle loader visibility
   * @private
   */
  function toggleLoader(show) {
    const loader = Utils.getElement('loader');
    if (loader) {
      if (show) {
        Utils.addClass(loader, AppConstants.CSS_CLASSES.ACTIVE);
      } else {
        Utils.removeClass(loader, AppConstants.CSS_CLASSES.ACTIVE);
      }
    }
  }

  /**
   * Extract letter data from select element
   * @private
   */
  function getLetterDataFromSelect(selectId, letterId) {
    if (!letterId || Utils.isEmpty(letterId)) return null;

    const selectElement = Utils.getElement(selectId);
    if (!selectElement) return null;

    const option = selectElement.querySelector(`option[value="${letterId}"]`);
    return option?.dataset?.content || null;
  }

  /**
   * Get current user email from session
   * @private
   */
  function getCurrentUserEmail() {
    const user = Utils.getSessionItem(AppConfig.AUTH.SESSION_STORAGE_KEY);
    return user?.email || null;
  }

  /**
   * Determine final recipient title
   * @private
   */
  function getFinalRecipientTitle(formData) {
    let recipientTitle = formData.get('recipient_title');
    const otherTitle = formData.get('other_recipient_title');

    if (recipientTitle === AppConstants.DEFAULTS.OTHER_OPTION && otherTitle) {
      return otherTitle;
    }

    if (Utils.isEmpty(recipientTitle)) {
      return AppConstants.DEFAULTS.RECIPIENT_TITLE;
    }

    return recipientTitle;
  }

  // ==================== Public API Functions ====================

  /**
   * Generate a new letter
   * @param {FormData} formData - Form data containing letter parameters
   * @returns {Promise<Object|null>} Generated letter data or null on error
   */
  async function generateLetter(formData) {
    toggleLoader(true);

    try {
      // Build payload according to new API spec
      const payload = {
        letterType: formData.get('category') || formData.get('type'),
        prompt: formData.get('prompt'),
        recipient: Utils.isEmpty(formData.get('recipient'))
          ? AppConstants.DEFAULTS.RECIPIENT_NAME
          : formData.get('recipient'),
        isFirst: formData.get('is_first') === 'true',
        recipientJobTitle: formData.get('recipient_job_title') || getFinalRecipientTitle(formData),
      };

      // Add optional fields
      const organizationName = formData.get('organization_name');
      if (!Utils.isEmpty(organizationName)) {
        payload.organizationName = organizationName;
      }

      const memberName = formData.get('member_name');
      if (!Utils.isEmpty(memberName)) {
        payload.memberName = memberName;
      }

      // Handle previous letter for follow-ups
      const previousLetterId = formData.get('previous_letter_id');
      const previousContent = getLetterDataFromSelect('previousLetter', previousLetterId);
      if (previousContent) {
        payload.previousLetterContent = previousContent;
        payload.previousLetterId = previousLetterId;
      }

      // Handle received letter for replies
      const receivedLetterId = formData.get('received_letter_id');
      const receivedContent = getLetterDataFromSelect('receivedLetter', receivedLetterId);
      if (receivedContent) {
        payload.receivedLetterContent = receivedContent;
      }

      const data = await makeRequest(AppConstants.ENDPOINTS.LETTER_GENERATE, 'POST', payload);

      // API returns: { ID, Title, Letter, Date, token_usage, cost_usd }
      return data;
    } catch (error) {
      if (typeof notify !== 'undefined') {
        notify.error(AppConstants.ERROR_MESSAGES.LETTER_GENERATION_FAILED);
      }
      return null;
    } finally {
      toggleLoader(false);
    }
  }

  /**
   * Validate letter content
   * @param {string} letterContent - Letter content to validate
   * @returns {Promise<Object|null>} Validation results or null on error
   */
  async function validateLetter(letterContent) {
    try {
      const payload = { letter: letterContent };
      const data = await makeRequest(AppConstants.ENDPOINTS.LETTER_VALIDATE, 'POST', payload);
      return data;
    } catch (error) {
      if (typeof notify !== 'undefined') {
        notify.error(AppConstants.ERROR_MESSAGES.LETTER_VALIDATION_FAILED);
      }
      return null;
    }
  }

  /**
   * Get letter categories
   * @returns {Promise<Array|null>} List of categories or null on error
   */
  async function getLetterCategories() {
    try {
      const data = await makeRequest(AppConstants.ENDPOINTS.LETTER_CATEGORIES, 'GET');
      return data;
    } catch (error) {
      console.error('Failed to get letter categories:', error);
      return null;
    }
  }

  /**
   * Get letter templates for a category
   * @param {string} category - Letter category
   * @returns {Promise<Object|null>} Template data or null on error
   */
  async function getLetterTemplates(category) {
    try {
      const data = await makeRequest('letter/templates', 'GET', { category });
      return data;
    } catch (error) {
      console.error('Failed to get letter templates:', error);
      return null;
    }
  }

  /**
   * Create a new chat session
   * @param {string|null} initialLetter - Initial letter content
   * @param {Object|null} context - Additional context
   * @param {string|null} idempotencyKey - Idempotency key for request
   * @returns {Promise<Object|null>} Chat session data or null on error
   */
  async function createChatSession(initialLetter = null, context = null, idempotencyKey = null) {
    try {
      const payload = {};
      if (initialLetter) payload.initial_letter = initialLetter;
      if (context) payload.context = context;
      if (idempotencyKey) payload.idempotency_key = idempotencyKey;

      const data = await makeRequest(AppConstants.ENDPOINTS.CHAT_SESSIONS, 'POST', payload);
      // API returns: { session_id, expires_in }
      return data;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      return null;
    }
  }

  /**
   * Edit letter via chat session
   * @param {string} sessionId - Chat session ID
   * @param {string} userMessage - User editing instructions
   * @param {string|null} context - Additional context
   * @returns {Promise<Object|null>} Edited letter data or null on error
   */
  async function editLetter(sessionId, userMessage, context = null) {
    toggleLoader(true);

    try {
      if (!sessionId) {
        throw new Error('Session ID is required for editing');
      }

      const payload = {
        session_id: sessionId,
        user_message: userMessage,
      };

      if (context) {
        payload.context = context;
      }

      const data = await makeRequest('chat/edit', 'POST', payload);
      // API returns: { edited_letter, session_id }
      return data;
    } catch (error) {
      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء تعديل الخطاب. الرجاء المحاولة مرة أخرى.');
      }
      return null;
    } finally {
      toggleLoader(false);
    }
  }

  /**
   * Get chat session history
   * @param {string} sessionId - Session ID
   * @param {number} limit - Number of messages to retrieve
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object|null>} Chat history or null on error
   */
  async function getChatHistory(sessionId, limit = 10, offset = 0) {
    try {
      const data = await makeRequest('chat/history', 'GET', { session_id: sessionId, limit, offset });
      return data;
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return null;
    }
  }

  /**
   * Get chat session status
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session status or null on error
   */
  async function getChatStatus(sessionId) {
    try {
      const data = await makeRequest('chat/status', 'GET', { session_id: sessionId });
      return data;
    } catch (error) {
      console.error('Failed to get chat status:', error);
      return null;
    }
  }

  /**
   * Extend chat session duration
   * @param {string} sessionId - Session ID
   * @param {number} extendMinutes - Minutes to extend
   * @returns {Promise<Object|null>} Extended session data or null on error
   */
  async function extendChatSession(sessionId, extendMinutes = 30) {
    try {
      const payload = {
        session_id: sessionId,
        extend_minutes: extendMinutes
      };
      const data = await makeRequest('chat/extend', 'POST', payload);
      return data;
    } catch (error) {
      console.error('Failed to extend chat session:', error);
      return null;
    }
  }

  /**
   * Delete chat session
   * @param {string} sessionId - Session ID to delete
   * @returns {Promise<Object|null>} Delete result or null on error
   */
  async function deleteChatSession(sessionId) {
    try {
      if (!sessionId) {
        console.warn('No session ID provided for deletion');
        return true;
      }

      const data = await makeRequest('chat/sessions/delete', 'DELETE', { session_id: sessionId });
      console.log('Session deleted successfully:', data);
      return data;
    } catch (error) {
      console.error('Error deleting session:', error);
      return null;
    }
  }

  /**
   * List all chat sessions
   * @param {boolean} includeExpired - Include expired sessions
   * @returns {Promise<Array|null>} List of sessions or null on error
   */
  async function listChatSessions(includeExpired = false) {
    try {
      const data = await makeRequest('chat/sessions', 'GET', { include_expired: includeExpired });
      return data;
    } catch (error) {
      console.error('Failed to list chat sessions:', error);
      return null;
    }
  }

  /**
   * Archive a letter (generate PDF and save to Drive)
   * @param {Object} letterData - Letter data to archive
   * @returns {Promise<Object|null>} Archive result or null on error
   */
  async function archiveLetter(letterData) {
    try {
      const payload = {
        letter_content: letterData.letter_content || letterData.Letter,
        ID: letterData.ID || letterData.id,
        letter_type: letterData.letter_type || letterData.category,
        recipient: letterData.recipient,
        title: letterData.title || letterData.Title,
        is_first: letterData.is_first !== undefined ? letterData.is_first : true,
      };

      console.log('Sending archive request:', payload);
      const data = await makeRequest(AppConstants.ENDPOINTS.ARCHIVE_LETTER, 'POST', payload);
      // API returns: { status: "processing", message, processing: true }
      return data;
    } catch (error) {
      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء حفظ الخطاب. الرجاء المحاولة مرة أخرى.');
      }
      return null;
    }
  }

  /**
   * Get archive status for a letter
   * @param {string} letterId - Letter ID
   * @returns {Promise<Object|null>} Archive status or null on error
   */
  async function getArchiveStatus(letterId) {
    try {
      const data = await makeRequest('archive/status', 'GET', { letter_id: letterId });
      return data;
    } catch (error) {
      console.error('Failed to get archive status:', error);
      return null;
    }
  }

  /**
   * Update archived letter
   * @param {string} letterId - Letter ID to update
   * @param {string} content - Updated content
   * @returns {Promise<Object>} Update result
   */
  async function updateArchiveLetter(letterId, content) {
    toggleLoader(true);

    try {
      const payload = {
        letter_id: letterId,
        content: content,
      };

      console.log('Sending archive update:', payload);
      const data = await makeRequest(AppConstants.ENDPOINTS.ARCHIVE_UPDATE, 'PUT', payload);
      console.log('Archive updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating archive:', error);
      throw error;
    } finally {
      toggleLoader(false);
    }
  }

  /**
   * Get all submissions (paginated)
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order (asc/desc)
   * @returns {Promise<Object|null>} Submissions data or null on error
   */
  async function getSubmissions(page = 1, pageSize = 10, sortBy = 'ID', sortOrder = 'desc') {
    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      const data = await makeRequest('submissions', 'GET', params);
      // API returns: { status, data: [...], pagination: {...} }
      return data;
    } catch (error) {
      console.error('Failed to get submissions:', error);
      return null;
    }
  }

  /**
   * Get single submission
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object|null>} Submission data or null on error
   */
  async function getSubmission(submissionId) {
    try {
      const data = await makeRequest('submissions/single', 'GET', { submission_id: submissionId });
      return data;
    } catch (error) {
      console.error('Failed to get submission:', error);
      return null;
    }
  }

  /**
   * Get submissions statistics
   * @returns {Promise<Object|null>} Statistics data or null on error
   */
  async function getSubmissionsStats() {
    try {
      const data = await makeRequest(AppConstants.ENDPOINTS.SUBMISSIONS_STATS, 'GET');
      // API returns: { status, data: { total_submissions, by_review_status, by_letter_type } }
      return data;
    } catch (error) {
      console.error('Failed to get submissions stats:', error);
      return null;
    }
  }

  /**
   * Generate unique ID for letters
   * @returns {string} Unique letter ID
   */
  function generateUniqueId() {
    return 'L' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Validate recipient name has at least two words
   * @private
   */
  function validateRecipientName(recipientInput) {
    const recipientValue = recipientInput.value.trim();

    if (recipientValue.length > 0 && recipientValue.split(' ').length < 2) {
      alert('يرجى إدخال الاسم الأول والثاني للمرسل إليه.');
      recipientInput.focus();
      return false;
    }
    return true;
  }

  /**
   * Handle form submission for letter generation
   * @private
   */
  function initializeFormHandler() {
    const letterForm = Utils.getElement('letterForm');
    if (!letterForm) return;

    letterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate recipient name
      const recipientInput = Utils.getElement('recipient');
      if (recipientInput && !validateRecipientName(recipientInput)) {
        return;
      }

      // Generate letter
      const formData = new FormData(e.target);
      const result = await generateLetter(formData);

      if (result) {
        // Extract letter content from response
        const letterContent =
          result.Letter || result.letter || 'محتوى الخطاب المُنشأ سيظهر هنا...';
        const letterData = {
          Letter: letterContent,
          Title: result.Title || result.title || 'خطاب',
          ID: result.ID || result.id || generateUniqueId(),
          Date: result.Date || result.date,
        };

        // Display in preview
        const previewElement = Utils.getElement('letterPreview');
        if (previewElement) {
          previewElement.value = letterContent;
        }

        // Populate document template if available
        if (typeof populateDocumentTemplate === 'function') {
          populateDocumentTemplate(letterData, formData);
        }

        // Show preview section
        const previewSection = Utils.getElement('previewSection');
        if (previewSection) {
          Utils.show(previewSection);
        }

        // Store generated letter data globally
        window.generatedLetterData = letterData;

        // Auto-validate if function is available
        if (typeof validateAndDisplayResults === 'function') {
          await validateAndDisplayResults(letterContent);
        }
      }
    });
  }

  // Initialize form handler when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormHandler);
  } else {
    initializeFormHandler();
  }

  // ==================== Public API ====================

  return {
    generateLetter,
    validateLetter,
    getLetterCategories,
    getLetterTemplates,
    createChatSession,
    editLetter,
    getChatHistory,
    getChatStatus,
    extendChatSession,
    deleteChatSession,
    listChatSessions,
    archiveLetter,
    getArchiveStatus,
    updateArchiveLetter,
    getSubmissions,
    getSubmission,
    getSubmissionsStats,
    generateUniqueId,
  };
})();

// Export globally for backward compatibility
if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;

  // Export individual functions for backward compatibility
  window.generateLetter = ApiClient.generateLetter;
  window.validateLetter = ApiClient.validateLetter;
  window.getLetterCategories = ApiClient.getLetterCategories;
  window.getLetterTemplates = ApiClient.getLetterTemplates;
  window.createChatSession = ApiClient.createChatSession;
  window.editLetter = ApiClient.editLetter;
  window.getChatHistory = ApiClient.getChatHistory;
  window.getChatStatus = ApiClient.getChatStatus;
  window.extendChatSession = ApiClient.extendChatSession;
  window.deleteChatSession = ApiClient.deleteChatSession;
  window.listChatSessions = ApiClient.listChatSessions;
  window.archiveLetter = ApiClient.archiveLetter;
  window.getArchiveStatus = ApiClient.getArchiveStatus;
  window.updateArchiveLetter = ApiClient.updateArchiveLetter;
  window.getSubmissions = ApiClient.getSubmissions;
  window.getSubmission = ApiClient.getSubmission;
  window.getSubmissionsStats = ApiClient.getSubmissionsStats;
  window.generateUniqueId = ApiClient.generateUniqueId;
}
