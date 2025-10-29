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
    try {
      const response = await ApiClient.getSubmissionsStats();

      if (response && response.status === 'success' && response.data) {
        const stats = response.data;

        // Update stats cards
        document.getElementById('total-letters').textContent = stats.total_submissions || 0;
        document.getElementById('pending-review').textContent =
          (stats.by_review_status && stats.by_review_status['في الانتظار']) || 0;
        document.getElementById('ready-to-send').textContent =
          (stats.by_review_status && stats.by_review_status['جاهز للإرسال']) || 0;
        document.getElementById('this-month').textContent = stats.this_month_count || 0;
      } else {
        console.warn('⚠️ No stats data available');
        setDefaultStats();
      }
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
      setDefaultStats();
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
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="LetterHistory.viewLetter('${letter.ID}')" title="عرض">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.66669 10C1.66669 10 4.16669 4.16667 10 4.16667C15.8334 4.16667 18.3334 10 18.3334 10C18.3334 10 15.8334 15.8333 10 15.8333C4.16669 15.8333 1.66669 10 1.66669 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="action-btn download" onclick="LetterHistory.downloadLetter('${letter.ID}')" title="تحميل">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.66669 14.1667L10 17.5M10 17.5L13.3334 14.1667M10 17.5V10M17.5 13.9524C18.4583 13.2953 19.1667 12.2142 19.1667 11C19.1667 9.15906 17.6743 7.66668 15.8334 7.66668C15.6061 7.66668 15.3834 7.68759 15.1676 7.72754C14.5867 5.39198 12.5469 3.66668 10.0834 3.66668C7.13781 3.66668 4.75002 6.05447 4.75002 9.00001C4.75002 9.60569 4.84314 10.1896 5.01592 10.738C3.36225 11.2208 2.16669 12.7391 2.16669 14.5C2.16669 16.6591 3.92395 18.4167 6.08335 18.4167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="action-btn delete" onclick="LetterHistory.deleteLetter('${letter.ID}')" title="حذف">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 5H4.16667M4.16667 5H17.5M4.16667 5V16.6667C4.16667 17.1087 4.34226 17.5326 4.65482 17.8452C4.96738 18.1577 5.39131 18.3333 5.83333 18.3333H14.1667C14.6087 18.3333 15.0326 18.1577 15.3452 17.8452C15.6577 17.5326 15.8333 17.1087 15.8333 16.6667V5H4.16667ZM6.66667 5V3.33333C6.66667 2.89131 6.84226 2.46738 7.15482 2.15482C7.46738 1.84226 7.89131 1.66667 8.33333 1.66667H11.6667C12.1087 1.66667 12.5326 1.84226 12.8452 2.15482C13.1577 2.46738 13.3333 2.89131 13.3333 3.33333V5M8.33333 9.16667V14.1667M11.6667 9.16667V14.1667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </td>
        <td>${Utils.escapeHtml(letter.Created_by || '-')}</td>
        <td>${Utils.escapeHtml(letter.notes || '-')}</td>
        <td>${Utils.escapeHtml(letter.reviewer_name || '-')}</td>
        <td>${Utils.escapeHtml(letter.Subject || '-')}</td>
        <td>${Utils.escapeHtml(letter.Recipient_name || '-')}</td>
        <td>
          <span class="status-badge ${getStatusClass(letter.sender || 'مرسل')}">
            ${Utils.escapeHtml(letter.sender || 'مرسل')}
          </span>
        </td>
        <td>
          <span class="status-badge ${getStatusClass(letter.Review_status)}">
            ${Utils.escapeHtml(letter.Review_status || '-')}
          </span>
        </td>
        <td>${Utils.escapeHtml(letter.Letter_type || '-')}</td>
        <td>${formatDate(letter.Timestamp)}</td>
        <td>${Utils.escapeHtml(letter.ID || '-')}</td>
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
      'يحتاج إلى تحسين': 'improvements'
    };
    return statusMap[status] || 'pending';
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
   * Download letter
   */
  async function downloadLetter(id) {
    try {
      const response = await ApiClient.getSubmission(id);
      if (response && response.status === 'success' && response.data) {
        const letter = response.data;
        // Create a downloadable file
        const content = `
الرقم المرجعي: ${letter.reference_number || '-'}
التاريخ: ${formatDate(letter.created_at)}
نوع الخطاب: ${letter.letter_type || '-'}
المستلم: ${letter.recipient || '-'}
الموضوع: ${letter.subject || '-'}

${letter.content || ''}
        `.trim();

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `letter-${letter.reference_number || id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('حدث خطأ في تحميل الخطاب');
      }
    } catch (error) {
      console.error('Failed to download letter:', error);
      alert('حدث خطأ في تحميل الخطاب');
    }
  }

  /**
   * Delete letter
   */
  async function deleteLetter(id) {
    if (confirm('هل أنت متأكد من حذف هذا الخطاب؟')) {
      try {
        console.log('Deleting letter:', id);
        const response = await ApiClient.deleteLetter(id);

        if (response && response.status === 'success') {
          NotificationsModule.show(response.message || 'تم حذف الخطاب بنجاح', 'success');
          await loadStats();
          await loadLetters();
        } else {
          throw new Error(response?.message || 'فشل حذف الخطاب');
        }
      } catch (error) {
        console.error('Failed to delete letter:', error);
        NotificationsModule.show(error.message || 'حدث خطأ في حذف الخطاب', 'error');
      }
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
      const response = await ApiClient.getSubmissions(1, 1000, 'created_at', 'desc');
      if (response && response.status === 'success' && response.data) {
        const letters = response.data;
        console.log('📤 Exporting letters:', letters);

        // Create CSV content
        const headers = ['الرقم المرجعي', 'التاريخ', 'نوع الخطاب', 'حالة المراجعة', 'المستلم', 'الموضوع', 'الكاتب'];
        const rows = letters.map(letter => [
          letter.reference_number || '-',
          formatDate(letter.created_at),
          letter.letter_type || '-',
          letter.review_status || '-',
          letter.recipient || '-',
          letter.subject || '-',
          letter.writer || '-'
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
      } else {
        alert('لا توجد خطابات للتصدير');
      }
    } catch (error) {
      console.error('Failed to export letters:', error);
      alert('حدث خطأ في تصدير الخطابات');
    }
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

    // Close dropdowns when clicking outside
    document.addEventListener('click', closeAllDropdowns);

    console.log('✅ Event listeners set up');
  }

  // Public API
  return {
    init,
    goToPage,
    viewLetter,
    downloadLetter,
    deleteLetter,
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
