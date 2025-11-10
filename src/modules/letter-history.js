/**
 * Letter History Module
 * Manages the letter history page functionality
 *
 * Integrated with real API endpoints:
 * - GET /api/v1/submissions (paginated letter list)
 * - GET /api/v1/submissions/stats (statistics)
 * - GET /api/v1/submissions/<id> (single letter details)
 */

const LetterHistory = (() => {
  'use strict';

  // State
  let currentPage = 1;
  let itemsPerPage = 10;
  let filters = {
    sortBy: 'newest',
    letterType: 'all',
    reviewStatus: 'all',
    search: ''
  };
  let currentLetters = []; // Store current letters data for modal access

  // Dropdown options from the image
  const sortOptions = [
    { value: 'newest', label: 'التاريخ الأحدث أولاً' },
    { value: 'oldest', label: 'التاريخ الأقدم أولاً' },
    { value: 'recipient-asc', label: 'المستلم: أ - ي' },
    { value: 'recipient-desc', label: 'المستلم: ي - أ' },
    { value: 'subject-asc', label: 'الموضوع: أ - ي' },
    { value: 'subject-desc', label: 'الموضوع: ي - أ' },
    { value: 'type-asc', label: 'النوع: أ - ي' },
    { value: 'review-status', label: 'حالة المراجعة' },
    { value: 'writer-asc', label: 'الكاتب: أ - ي' }
  ];

  const letterTypeOptions = [
    { value: 'all', label: 'جميع أنواع الخطابات' },
    { value: 'خطاب جديد', label: 'خطاب جديد' },
    { value: 'رد على خطاب من الجهة', label: 'رد على خطاب من الجهة' },
    { value: 'خطاب إلحاقي', label: 'خطاب إلحاقي' },
    { value: 'طلب', label: 'طلب' },
    { value: 'جدولة اجتماع', label: 'جدولة اجتماع' },
    { value: 'دعوة حضور', label: 'دعوة حضور' },
    { value: 'تهنئة', label: 'تهنئة' }
  ];

  const reviewStatusOptions = [
    { value: 'all', label: 'جميع حالات المراجعة' },
    { value: 'جاهز للإرسال', label: 'جاهز للإرسال' },
    { value: 'في الانتظار', label: 'في الانتظار' },
    { value: 'يحتاج إلى تحسين', label: 'يحتاج إلى تحسين' }
  ];

  /**
   * Convert Google Drive view URL to download URL
   * @param {string} url - Google Drive URL
   * @returns {string} Download URL or original URL if conversion fails
   */
  function convertDriveUrlToDownload(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }

    // Extract file ID from various Google Drive URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /open\?id=([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/
    ];

    let fileId = null;
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }

    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    return url; // Return original if we can't extract file ID
  }

  /**
   * Initialize the letter history module
   */
  function init() {
    console.log('📄 Letter History module initialized');

    try {
      // Check if ApiClient is available
      if (typeof ApiClient === 'undefined') {
        console.error('❌ ApiClient is not defined! Make sure api.js is loaded before letter-history.js');
        alert('خطأ: لم يتم تحميل خدمة API بشكل صحيح. الرجاء تحديث الصفحة.');
        return;
      }

      console.log('✅ ApiClient is available');
      console.log('🔄 Loading statistics and letters...');

      loadStats();
      setupDropdowns();
      loadLetters();
      setupEventListeners();

      console.log('✅ Letter History initialization complete');
    } catch (error) {
      console.error('❌ Fatal error in Letter History init:', error);
      alert('حدث خطأ في تحميل صفحة سجل الخطابات: ' + error.message);
    }
  }

  /**
   * Load and display statistics
   */
  async function loadStats() {
    console.log('📊 Loading statistics...');

    try {
      // Get statistics from API
      const response = await ApiClient.getSubmissionsStats();

      console.log('📊 Raw statistics response:', response);
      console.log('📊 Response status:', response?.status);
      console.log('📊 Response data:', response?.data);

      if (response && response.status === 'success' && response.data) {
        const stats = response.data;

        console.log('📊 Stats object:', stats);
        console.log('📊 Total submissions:', stats.total_submissions);
        console.log('📊 By review status:', stats.by_review_status);

        // Update stats cards from API
        const totalLetters = stats.total_submissions || 0;
        const pendingReview = (stats.by_review_status && stats.by_review_status['Pending']) ||
                             (stats.by_review_status && stats.by_review_status['في الانتظار']) || 0;
        const readyToSend = (stats.by_review_status && stats.by_review_status['Approved']) ||
                           (stats.by_review_status && stats.by_review_status['جاهز للإرسال']) || 0;

        document.getElementById('total-letters').textContent = totalLetters;
        document.getElementById('pending-review').textContent = pendingReview;
        document.getElementById('ready-to-send').textContent = readyToSend;

        // Calculate THIS MONTH count from actual letter dates (more accurate)
        await calculateThisMonthCount();

        console.log('📊 Setting statistics:');
        console.log('  - Total letters:', totalLetters);
        console.log('  - Pending review:', pendingReview);
        console.log('  - Ready to send:', readyToSend);

        console.log('✅ Statistics updated successfully');
      } else {
        console.warn('⚠️ No stats data available or invalid response structure');
        console.warn('Response:', response);
        setDefaultStats();
      }
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
      console.error('Error details:', error.message, error.stack);
      setDefaultStats();
    }
  }

  /**
   * Calculate and display count of letters created this month from actual dates
   */
  async function calculateThisMonthCount() {
    try {
      console.log('📅 Calculating this month count from letter dates...');

      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11
      const currentYear = now.getFullYear();

      console.log('📅 Current month:', currentMonth, 'Current year:', currentYear);

      // Fetch all submissions (with large page size to get all letters)
      const response = await ApiClient.getSubmissions(1, 1000, 'Timestamp', 'desc');

      if (response && response.status === 'success' && response.data) {
        const letters = response.data;

        console.log('📅 Total letters fetched:', letters.length);

        // Count letters from this month by checking Timestamp field
        const thisMonthLetters = letters.filter(letter => {
          if (!letter.Timestamp) {
            return false;
          }

          // Parse the timestamp - format: "2025-10-29 12:04:16" or ISO format
          const letterDate = new Date(letter.Timestamp);

          // Check if valid date
          if (isNaN(letterDate.getTime())) {
            console.warn('⚠️ Invalid date for letter:', letter.ID, letter.Timestamp);
            return false;
          }

          const letterMonth = letterDate.getMonth();
          const letterYear = letterDate.getFullYear();

          return letterMonth === currentMonth && letterYear === currentYear;
        });

        const thisMonthCount = thisMonthLetters.length;

        console.log('📅 Letters this month:', thisMonthCount);
        console.log('📅 Sample dates:', thisMonthLetters.slice(0, 3).map(l => ({
          id: l.ID,
          timestamp: l.Timestamp
        })));

        // Update the card
        document.getElementById('this-month').textContent = thisMonthCount;

        console.log('✅ This month count updated:', thisMonthCount);
      } else {
        console.warn('⚠️ Could not fetch letters for this month calculation');
        document.getElementById('this-month').textContent = '0';
      }
    } catch (error) {
      console.error('❌ Failed to calculate this month count:', error);
      document.getElementById('this-month').textContent = '0';
    }
  }

  /**
   * Set default stats when API fails
   */
  function setDefaultStats() {
    document.getElementById('total-letters').textContent = '0';
    document.getElementById('pending-review').textContent = '0';
    document.getElementById('ready-to-send').textContent = '0';
    document.getElementById('this-month').textContent = '0';
  }

  /**
   * Setup dropdown menus
   */
  function setupDropdowns() {
    setupDropdown('sort-dropdown', sortOptions, filters.sortBy, (value) => {
      filters.sortBy = value;
      applyFilters();
    });

    setupDropdown('type-dropdown', letterTypeOptions, filters.letterType, (value) => {
      filters.letterType = value;
      applyFilters();
    });

    setupDropdown('status-dropdown', reviewStatusOptions, filters.reviewStatus, (value) => {
      filters.reviewStatus = value;
      applyFilters();
    });
  }

  /**
   * Setup a single dropdown
   */
  function setupDropdown(dropdownId, options, currentValue, onChange) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const button = dropdown.querySelector('.dropdown-btn');
    const buttonText = button.querySelector('span');

    // Create dropdown menu
    let menu = dropdown.querySelector('.dropdown-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'dropdown-menu';
      dropdown.appendChild(menu);
    }

    // Populate menu items
    menu.innerHTML = options.map(option => `
      <div class="dropdown-menu-item ${option.value === currentValue ? 'active' : ''}"
           data-value="${option.value}">
        ${option.label}
      </div>
    `).join('');

    // Toggle dropdown on button click
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      dropdown.classList.toggle('active');
    });

    // Handle menu item clicks
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-menu-item');
      if (!item) return;

      const value = item.dataset.value;

      // Update active state
      menu.querySelectorAll('.dropdown-menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update button text
      buttonText.textContent = item.textContent.trim();

      // Close dropdown
      dropdown.classList.remove('active');

      // Trigger onChange callback
      onChange(value);
    });
  }

  /**
   * Close all dropdowns
   */
  function closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }

  /**
   * Load and display letters
   */
  async function loadLetters() {
    try {
      // Convert frontend sort values to backend format
      // Backend uses capital case field names (ID, Timestamp, Letter_type, etc.)
      const sortMapping = {
        'newest': { field: 'Timestamp', order: 'desc' },
        'oldest': { field: 'Timestamp', order: 'asc' },
        'recipient-asc': { field: 'Recipient_name', order: 'asc' },
        'recipient-desc': { field: 'Recipient_name', order: 'desc' },
        'subject-asc': { field: 'Subject', order: 'asc' },
        'subject-desc': { field: 'Subject', order: 'desc' },
        'type-asc': { field: 'Letter_type', order: 'asc' },
        'review-status': { field: 'Review_status', order: 'asc' },
        'writer-asc': { field: 'Created_by', order: 'asc' }
      };

      const sortConfig = sortMapping[filters.sortBy] || { field: 'ID', order: 'desc' };

      const response = await ApiClient.getSubmissions(
        currentPage,
        itemsPerPage,
        sortConfig.field,
        sortConfig.order
      );

      if (response && response.status === 'success') {
        // Filter data on client side (until backend supports filtering)
        // Backend returns capital case field names (Letter_type, Review_status, etc.)
        let filteredData = response.data || [];

        // Apply letter type filter
        if (filters.letterType && filters.letterType !== 'all') {
          filteredData = filteredData.filter(l => l.Letter_type === filters.letterType);
        }

        // Apply review status filter
        if (filters.reviewStatus && filters.reviewStatus !== 'all') {
          filteredData = filteredData.filter(l => l.Review_status === filters.reviewStatus);
        }

        // Apply search filter
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim().toLowerCase();
          filteredData = filteredData.filter(l =>
            (l.Recipient_name && l.Recipient_name.toLowerCase().includes(searchTerm)) ||
            (l.ID && l.ID.toLowerCase().includes(searchTerm)) ||
            (l.Created_by && l.Created_by.toLowerCase().includes(searchTerm)) ||
            (l.Subject && l.Subject.toLowerCase().includes(searchTerm))
          );
        }

        renderTable(filteredData);
        renderPagination(response.pagination || {
          page: currentPage,
          page_size: itemsPerPage,
          total_items: filteredData.length,
          total_pages: Math.ceil(filteredData.length / itemsPerPage)
        });
      } else {
        console.warn('⚠️ No submissions data available');
        renderTable([]);
        renderPagination({ page: 1, page_size: itemsPerPage, total_items: 0, total_pages: 0 });
      }
    } catch (error) {
      console.error('❌ Failed to load letters:', error);
      renderTable([]);
      renderPagination({ page: 1, page_size: itemsPerPage, total_items: 0, total_pages: 0 });
    }
  }

  /**
   * Sort letters based on selected option
   * NOTE: Sorting is now handled by the API in loadLetters()
   * This function is kept for backward compatibility but is no longer used
   */
  function sortLetters(letters, sortBy) {
    // Sorting is now handled by the API
    return letters;
  }

  /**
   * Render letters table
   */
  function renderTable(letters) {
    const tbody = document.getElementById('letters-tbody');

    // Store letters for modal access
    currentLetters = letters;

    if (letters.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 40px;">
            <div style="color: var(--Maktoub-Light); font-size: 16px;">
              لا توجد خطابات مطابقة للبحث
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Backend returns capital case field names (ID, Timestamp, Created_by, etc.)
    tbody.innerHTML = letters.map(letter => `
      <tr data-letter-id="${letter.ID}">
        <td>${Utils.escapeHtml(letter.ID || '-')}</td>
        <td>${formatDate(letter.Timestamp)}</td>
        <td>
          <div style="display: flex; align-items: center; justify-content: flex-start; gap: 6px;">
            ${getLetterTypeIcon(letter.Letter_type)}
            <span>${Utils.escapeHtml(letter.Letter_type || '-')}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${getStatusClass(letter.Review_status)}" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: fit-content;">
            ${getStatusIcon(letter.Review_status)}
            <span>${Utils.escapeHtml(letter.Review_status || '-')}</span>
          </span>
        </td>
        <td>
          <span class="status-badge ${getStatusClass(letter.sender || 'مرسل')}">
            ${Utils.escapeHtml(letter.sender || 'مرسل')}
          </span>
        </td>
        <td>${Utils.escapeHtml(letter.Recipient_name || '-')}</td>
        <td>${Utils.escapeHtml(letter.Subject || '-')}</td>
        <td>${Utils.escapeHtml(letter.Reviewer_email || '-')}</td>
        <td>
          ${letter.Review_notes && letter.Review_notes !== '-' ? `
            <div class="review-notes-cell">
              <span class="review-notes-preview">${Utils.escapeHtml(letter.Review_notes.substring(0, 50))}${letter.Review_notes.length > 50 ? '...' : ''}</span>
              ${letter.Review_notes.length > 50 ? `<button class="read-more-btn" onclick="LetterHistory.showReviewNotesModal('${letter.ID}', event)" title="اقرأ المزيد">اقرأ المزيد</button>` : ''}
            </div>
          ` : '-'}
        </td>
        <td>${Utils.escapeHtml(letter.Created_by || '-')}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="LetterHistory.viewLetter('${letter.ID}')" title="عرض">
              <img src="/attached_assets/New_Icons/Frame-1.svg" alt="" width="18" height="18" style="filter: var(--icon-filter);">
            </button>
            <div class="download-btn-container">
              <button class="action-btn download" onclick="LetterHistory.toggleDownloadOptions(event, '${letter.ID}')" title="تحميل">
                <img src="/attached_assets/New_Icons/Frame-2.svg" alt="" width="18" height="18" style="filter: var(--icon-filter);">
              </button>
              <div class="download-dropdown" data-letter-id="${letter.ID}">
                <button class="dropdown-item" onclick="LetterHistory.viewLetterPDF('${letter.ID}'); event.stopPropagation();">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.66669 10C1.66669 10 4.16669 4.16667 10 4.16667C15.8334 4.16667 18.3334 10 18.3334 10C18.3334 10 15.8334 15.8333 10 15.8333C4.16669 15.8333 1.66669 10 1.66669 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>عرض PDF</span>
                </button>
                <button class="dropdown-item" onclick="LetterHistory.downloadLetterPDF('${letter.ID}'); event.stopPropagation();">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.66669 14.1667L10 17.5M10 17.5L13.3334 14.1667M10 17.5V10M17.5 13.9524C18.4583 13.2953 19.1667 12.2142 19.1667 11C19.1667 9.15906 17.6743 7.66668 15.8334 7.66668C15.6061 7.66668 15.3834 7.68759 15.1676 7.72754C14.5867 5.39198 12.5469 3.66668 10.0834 3.66668C7.13781 3.66668 4.75002 6.05447 4.75002 9.00001C4.75002 9.60569 4.84314 10.1896 5.01592 10.738C3.36225 11.2208 2.16669 12.7391 2.16669 14.5C2.16669 16.6591 3.92395 18.4167 6.08335 18.4167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>تحميل PDF</span>
                </button>
              </div>
            </div>
            <button class="action-btn delete" onclick="LetterHistory.deleteLetter('${letter.ID}')" title="حذف">
              <img src="/attached_assets/New_Icons/Frame-3.svg" alt="" width="18" height="18" style="filter: var(--icon-filter);">
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Format date for display
   */
  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Get CSS class for status badge
   */
  function getStatusClass(status) {
    const statusMap = {
      'جاهز للإرسال': 'ready',
      'في الانتظار': 'pending',
      'يحتاج إلى تحسين': 'improvements',
      'مرفوض': 'rejected'
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Get icon for status badge
   */
  function getStatusIcon(status) {
    const iconMap = {
      'جاهز للإرسال': '<img src="/attached_assets/New_Icons/Check.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'في الانتظار': '<img src="/attached_assets/New_Icons/Clock.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'يحتاج إلى تحسين': '<img src="/attached_assets/New_Icons/Exclamation.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'مرفوض': '<img src="/attached_assets/New_Icons/X.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">'
    };
    return iconMap[status] || '';
  }

  /**
   * Get icon for letter type
   */
  function getLetterTypeIcon(type) {
    const iconMap = {
      'خطاب جديد': '<img src="/attached_assets/New_Icons/Document.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'رد على خطاب من الجهة': '<img src="/attached_assets/New_Icons/Switch horizontal.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'خطاب إلحاقي': '<img src="/attached_assets/New_Icons/Receipt refund.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'طلب': '<img src="/attached_assets/New_Icons/Document add.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'جدولة اجتماع': '<img src="/attached_assets/New_Icons/Frame.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'دعوة حضور': '<img src="/attached_assets/New_Icons/Mail open.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'تهنئة': '<img src="/attached_assets/New_Icons/Document.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">',
      'إشعار بانتهاء...': '<img src="/attached_assets/New_Icons/Annotation.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">'
    };
    return iconMap[type] || '<img src="/attached_assets/New_Icons/Document.svg" alt="" width="16" height="16" style="filter: var(--icon-filter); margin-left: 6px;">';
  }

  /**
   * Render pagination controls
   */
  function renderPagination(pagination) {
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    const page = pagination.page || 1;
    const totalPages = pagination.total_pages || 1;
    const totalItems = pagination.total_items || 0;

    // Update info
    paginationInfo.textContent = `صفحة ${page} من ${totalPages} (${totalItems} خطاب)`;

    // Update controls
    paginationControls.innerHTML = `
      <button class="page-btn" onclick="LetterHistory.goToPage('first')" ${page === 1 ? 'disabled' : ''}>
        الأولى
      </button>
      <button class="page-btn" onclick="LetterHistory.goToPage('prev')" ${page === 1 ? 'disabled' : ''}>
        السابق
      </button>
      <button class="page-btn" onclick="LetterHistory.goToPage('next')" ${page === totalPages ? 'disabled' : ''}>
        التالي
      </button>
      <button class="page-btn" onclick="LetterHistory.goToPage('last')" ${page === totalPages ? 'disabled' : ''}>
        الأخيرة
      </button>
    `;
  }

  /**
   * Navigate to a specific page
   */
  function goToPage(direction) {
    switch (direction) {
      case 'first':
        currentPage = 1;
        break;
      case 'prev':
        currentPage = Math.max(1, currentPage - 1);
        break;
      case 'next':
        currentPage = currentPage + 1; // Will be capped by backend
        break;
      case 'last':
        // Get from pagination info or use a large number
        currentPage = 9999; // Backend will cap to actual last page
        break;
      default:
        if (typeof direction === 'number') {
          currentPage = direction;
        }
    }

    loadLetters();
  }

  /**
   * View letter details
   */
  async function viewLetter(id) {
    try {
      const response = await ApiClient.getSubmission(id);
      if (response && response.status === 'success' && response.data) {
        const letter = response.data;
        // TODO: Navigate to review-letter.html with the letter ID
        window.location.href = `review-letter.html?id=${id}`;
      } else {
        alert('حدث خطأ في تحميل تفاصيل الخطاب');
      }
    } catch (error) {
      console.error('Failed to view letter:', error);
      alert('حدث خطأ في تحميل تفاصيل الخطاب');
    }
  }

  /**
   * Show download options dropdown
   */
  function toggleDownloadOptions(event, id) {
    event.stopPropagation();
    console.log('🔽 Toggle download options for letter:', id);

    // Close all other dropdowns
    document.querySelectorAll('.download-dropdown').forEach(dropdown => {
      if (dropdown.dataset.letterId !== id) {
        dropdown.classList.remove('active');
      }
    });

    // Toggle this dropdown (dropdown is sibling of button, inside parent container)
    const dropdown = event.currentTarget.parentElement.querySelector('.download-dropdown');
    if (dropdown) {
      console.log('✅ Dropdown found, toggling visibility');
      dropdown.classList.toggle('active');
    } else {
      console.error('❌ Dropdown not found!');
    }
  }

  /**
   * View letter PDF (opens in new tab)
   */
  async function viewLetterPDF(id) {
    console.log('📄 View PDF button clicked for letter ID:', id);

    // Close the dropdown
    document.querySelectorAll('.download-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });

    try {
      const response = await ApiClient.getSubmission(id);
      if (response && response.status === 'success' && response.data) {
        const letter = response.data;

        // Check if Final_letter_url exists
        if (letter.Final_letter_url) {
          console.log('📄 Opening PDF:', letter.Final_letter_url);
          window.open(letter.Final_letter_url, '_blank');
        } else {
          console.warn('⚠️ No Final_letter_url found for letter:', id);
          alert('لا يوجد رابط PDF لهذا الخطاب');
        }
      } else {
        alert('حدث خطأ في تحميل الخطاب');
      }
    } catch (error) {
      console.error('Failed to view letter PDF:', error);
      alert('حدث خطأ في فتح الخطاب');
    }
  }

  /**
   * Download letter PDF
   */
  async function downloadLetterPDF(id) {
    console.log('📥 Download PDF button clicked for letter ID:', id);

    // Close the dropdown
    document.querySelectorAll('.download-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });

    try {
      const response = await ApiClient.getSubmission(id);
      console.log('📊 API Response:', response);

      if (response && response.status === 'success' && response.data) {
        const letter = response.data;

        // Check if Final_letter_url exists
        if (letter.Final_letter_url) {
          console.log('✅ Final_letter_url found:', letter.Final_letter_url);
          console.log('🎨 Showing export notification modal...');

          // Show themed notification modal before opening PDF
          showExportNotificationModal(() => {
            console.log('✅ User confirmed - opening PDF...');
            const downloadUrl = convertDriveUrlToDownload(letter.Final_letter_url);
            window.open(downloadUrl, '_blank');
          });
        } else {
          // Fallback: Create text file if no PDF URL
          console.warn('⚠️ No Final_letter_url, falling back to text file');
          downloadLetterAsText(letter, id);
        }
      } else {
        console.error('❌ Invalid API response');
        alert('حدث خطأ في تحميل الخطاب');
      }
    } catch (error) {
      console.error('❌ Failed to download letter PDF:', error);
      alert('حدث خطأ في تحميل الخطاب');
    }
  }

  /**
   * Show export notification modal (theme-aware)
   */
  function showExportNotificationModal(onConfirm) {
    console.log('🎨 Creating export notification modal...');

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'export-notification-overlay';
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    overlay.setAttribute('data-theme', theme);
    console.log('🎨 Modal theme:', theme);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'export-notification-modal';

    modal.innerHTML = `
      <div class="export-notification-content">
        <div class="export-notification-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="export-notification-title">جاري فتح الخطاب</h3>
        <p class="export-notification-message">سيتم فتح ملف PDF الخاص بالخطاب في نافذة جديدة</p>
        <div class="export-notification-buttons">
          <button class="export-notification-btn export-notification-btn-cancel" id="exportCancelBtn">
            إلغاء
          </button>
          <button class="export-notification-btn export-notification-btn-confirm" id="exportConfirmBtn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.66669 14.1667L10 17.5M10 17.5L13.3334 14.1667M10 17.5V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            فتح الخطاب
          </button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    console.log('✅ Modal added to DOM');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Add show class after a brief delay for animation
    setTimeout(() => {
      overlay.classList.add('show');
      console.log('✅ Modal animation triggered (show class added)');
    }, 10);

    // Handle buttons
    const confirmBtn = document.getElementById('exportConfirmBtn');
    const cancelBtn = document.getElementById('exportCancelBtn');

    if (!confirmBtn || !cancelBtn) {
      console.error('❌ Modal buttons not found!', { confirmBtn, cancelBtn });
      return;
    }

    console.log('✅ Modal buttons found and event listeners attached');

    const closeModal = () => {
      console.log('🚪 Closing modal...');
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
        console.log('✅ Modal removed from DOM');
      }, 300);
    };

    confirmBtn.addEventListener('click', () => {
      console.log('✅ Confirm button clicked');
      closeModal();
      if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
      console.log('❌ Cancel button clicked');
      closeModal();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        console.log('🚪 Overlay clicked - closing modal');
        closeModal();
      }
    });
  }

  /**
   * Download letter as text file (fallback)
   */
  function downloadLetterAsText(letter, id) {
    // Backend returns capital case field names
    const content = `
الرقم المرجعي: ${letter.ID || '-'}
التاريخ: ${formatDate(letter.Timestamp)}
نوع الخطاب: ${letter.Letter_type || '-'}
المستلم: ${letter.Recipient_name || '-'}
الموضوع: ${letter.Subject || '-'}

${letter.Letter_content || letter.content || ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letter-${letter.ID || id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Legacy download function (kept for backward compatibility)
   */
  async function downloadLetter(id) {
    // Redirect to new download PDF function
    await downloadLetterPDF(id);
  }

  /**
   * Delete letter
   */
  let letterToDelete = null;

  function deleteLetter(id) {
    // Store the letter ID and show the custom modal
    letterToDelete = id;
    showDeleteModal();
  }

  /**
   * Show delete confirmation modal
   */
  function showDeleteModal() {
    const modal = document.getElementById('deleteModalOverlay');
    if (modal) {
      modal.style.display = 'flex';
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hide delete confirmation modal
   */
  function hideDeleteModal() {
    const modal = document.getElementById('deleteModalOverlay');
    if (modal) {
      modal.style.display = 'none';
      // Restore body scroll
      document.body.style.overflow = '';
    }
    letterToDelete = null;
  }

  /**
   * Confirm delete and execute
   */
  async function confirmDelete() {
    if (!letterToDelete) return;

    try {
      console.log('Deleting letter:', letterToDelete);
      const response = await ApiClient.deleteLetter(letterToDelete);

      if (response && response.status === 'success') {
        hideDeleteModal();
        notify.show(response.message || 'تم حذف الخطاب بنجاح', 'success');
        await loadStats();
        await loadLetters();
      } else {
        throw new Error(response?.message || 'فشل حذف الخطاب');
      }
    } catch (error) {
      console.error('Failed to delete letter:', error);
      hideDeleteModal();
      notify.show(error.message || 'حدث خطأ في حذف الخطاب', 'error');
    }
  }

  /**
   * Apply filters
   */
  function applyFilters() {
    currentPage = 1; // Reset to first page
    loadLetters();
  }

  /**
   * Export all letters
   */
  async function exportAll() {
    try {
      // Get all letters (max pages)
      const response = await ApiClient.getSubmissions(1, 1000, 'Timestamp', 'desc');
      if (response && response.status === 'success' && response.data) {
        const letters = response.data;
        console.log('📤 Exporting letters:', letters);

        // Create CSV content with Final_letter_url column
        // Backend returns capital case field names: ID, Timestamp, Letter_type, Review_status, etc.
        const headers = ['الرقم المرجعي', 'التاريخ', 'نوع الخطاب', 'حالة المراجعة', 'المستلم', 'الموضوع', 'الكاتب', 'رابط PDF'];
        const rows = letters.map(letter => [
          letter.ID || '-',
          formatDate(letter.Timestamp),
          letter.Letter_type || '-',
          letter.Review_status || '-',
          letter.Recipient_name || '-',
          letter.Subject || '-',
          letter.Created_by || '-',
          letter.Final_letter_url || '-'
        ]);

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        // Add BOM for Excel compatibility with Arabic
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `letters-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`✅ Exported ${letters.length} letters with PDF links`);
      } else {
        alert('لا توجد خطابات للتصدير');
      }
    } catch (error) {
      console.error('Failed to export letters:', error);
      alert('حدث خطأ في تصدير الخطابات');
    }
  }

  /**
   * Show review notes modal
   */
  function showReviewNotesModal(letterId, event) {
    if (event) {
      event.stopPropagation();
    }

    console.log('📖 Opening review notes modal for letter:', letterId);

    // Find the letter in current data
    const letter = currentLetters.find(l => l.ID === letterId);

    if (!letter || !letter.Review_notes || letter.Review_notes === '-') {
      console.warn('⚠️ No review notes found for letter:', letterId);
      if (typeof notify !== 'undefined') {
        notify.warning('لا توجد ملاحظات مراجعة لهذا الخطاب');
      } else {
        alert('لا توجد ملاحظات مراجعة لهذا الخطاب');
      }
      return;
    }

    console.log('✅ Review notes found:', letter.Review_notes);

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'review-notes-modal-overlay';
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    overlay.setAttribute('data-theme', theme);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'review-notes-modal';

    modal.innerHTML = `
      <div class="review-notes-modal-header">
        <h3 class="review-notes-modal-title">ملاحظات المراجعة</h3>
        <button class="review-notes-modal-close" id="closeReviewNotesModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="review-notes-modal-content">
        <div class="review-notes-letter-info">
          <p><strong>رقم الخطاب:</strong> ${Utils.escapeHtml(letter.ID)}</p>
          <p><strong>الموضوع:</strong> ${Utils.escapeHtml(letter.Subject || '-')}</p>
          <p><strong>المراجع:</strong> ${Utils.escapeHtml(letter.Reviewer_email || '-')}</p>
        </div>
        <div class="review-notes-text">
          ${Utils.escapeHtml(letter.Review_notes).replace(/\n/g, '<br>')}
        </div>
      </div>
      <div class="review-notes-modal-footer">
        <button class="review-notes-modal-btn" id="closeReviewNotesBtn">
          إغلاق
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Add show class after a brief delay for animation
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Handle close buttons
    const closeBtn = document.getElementById('closeReviewNotesBtn');
    const closeIcon = document.getElementById('closeReviewNotesModal');

    const closeModal = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      }, 300);
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    if (closeIcon) {
      closeIcon.addEventListener('click', closeModal);
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value;
        applyFilters();
      });
    }

    // Items per page selector
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
      itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        loadLetters();
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportAll);
    }

    // Delete modal event listeners
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    }

    // Close modal when clicking overlay
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    if (deleteModalOverlay) {
      deleteModalOverlay.addEventListener('click', (e) => {
        if (e.target === deleteModalOverlay) {
          hideDeleteModal();
        }
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', closeAllDropdowns);

    // Close download dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.download-btn-container')) {
        document.querySelectorAll('.download-dropdown').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });

    console.log('✅ Event listeners set up');
  }

  // Public API
  return {
    init,
    goToPage,
    viewLetter,
    downloadLetter,
    viewLetterPDF,
    downloadLetterPDF,
    toggleDownloadOptions,
    deleteLetter,
    showReviewNotesModal,
    applyFilters
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.LetterHistory = LetterHistory;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', LetterHistory.init);
} else {
  LetterHistory.init();
}
