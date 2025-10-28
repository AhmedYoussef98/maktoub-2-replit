/**
 * Letter History Module
 * Manages the letter history page functionality
 *
 * ⚠️ TODO: Integrate with real API endpoints
 * - GET /api/v1/submissions (paginated letter list)
 * - GET /api/v1/submissions/stats (statistics)
 * - GET /api/v1/submissions/<id> (single letter details)
 * See API_ENDPOINTS.md for full API documentation
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

    // TODO: Replace with real API integration
    // This page currently needs API integration to function properly
    console.warn('⚠️ Letter History: API integration required');

    loadStats();
    setupDropdowns();
    loadLetters();
    setupEventListeners();
  }

  /**
   * Load and display statistics
   */
  function loadStats() {
    const stats = FakeLetters.getStats();

    document.getElementById('total-letters').textContent = stats.total;
    document.getElementById('pending-review').textContent = stats.pendingReview;
    document.getElementById('ready-to-send').textContent = stats.readyToSend;
    document.getElementById('this-month').textContent = stats.thisMonth;
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
  function loadLetters() {
    const allFilters = { ...filters };
    const result = FakeLetters.getPaginatedLetters(currentPage, itemsPerPage, allFilters);

    // Apply sorting
    result.data = sortLetters(result.data, filters.sortBy);

    renderTable(result.data);
    renderPagination(result);

    // Update stats after filtering
    loadStats();
  }

  /**
   * Sort letters based on selected option
   */
  function sortLetters(letters, sortBy) {
    const sorted = [...letters];

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'recipient-asc':
        sorted.sort((a, b) => a.recipient.localeCompare(b.recipient, 'ar'));
        break;
      case 'recipient-desc':
        sorted.sort((a, b) => b.recipient.localeCompare(a.recipient, 'ar'));
        break;
      case 'subject-asc':
        sorted.sort((a, b) => a.subject.localeCompare(b.subject, 'ar'));
        break;
      case 'subject-desc':
        sorted.sort((a, b) => b.subject.localeCompare(a.subject, 'ar'));
        break;
      case 'type-asc':
        sorted.sort((a, b) => a.letterType.localeCompare(b.letterType, 'ar'));
        break;
      case 'review-status':
        sorted.sort((a, b) => a.reviewStatus.localeCompare(b.reviewStatus, 'ar'));
        break;
      case 'writer-asc':
        sorted.sort((a, b) => a.writer.localeCompare(b.writer, 'ar'));
        break;
    }

    return sorted;
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

    tbody.innerHTML = letters.map(letter => `
      <tr data-letter-id="${letter.id}">
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="LetterHistory.viewLetter(${letter.id})" title="عرض">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.66669 10C1.66669 10 4.16669 4.16667 10 4.16667C15.8334 4.16667 18.3334 10 18.3334 10C18.3334 10 15.8334 15.8333 10 15.8333C4.16669 15.8333 1.66669 10 1.66669 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="action-btn download" onclick="LetterHistory.downloadLetter(${letter.id})" title="تحميل">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.66669 14.1667L10 17.5M10 17.5L13.3334 14.1667M10 17.5V10M17.5 13.9524C18.4583 13.2953 19.1667 12.2142 19.1667 11C19.1667 9.15906 17.6743 7.66668 15.8334 7.66668C15.6061 7.66668 15.3834 7.68759 15.1676 7.72754C14.5867 5.39198 12.5469 3.66668 10.0834 3.66668C7.13781 3.66668 4.75002 6.05447 4.75002 9.00001C4.75002 9.60569 4.84314 10.1896 5.01592 10.738C3.36225 11.2208 2.16669 12.7391 2.16669 14.5C2.16669 16.6591 3.92395 18.4167 6.08335 18.4167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="action-btn delete" onclick="LetterHistory.deleteLetter(${letter.id})" title="حذف">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 5H4.16667M4.16667 5H17.5M4.16667 5V16.6667C4.16667 17.1087 4.34226 17.5326 4.65482 17.8452C4.96738 18.1577 5.39131 18.3333 5.83333 18.3333H14.1667C14.6087 18.3333 15.0326 18.1577 15.3452 17.8452C15.6577 17.5326 15.8333 17.1087 15.8333 16.6667V5H4.16667ZM6.66667 5V3.33333C6.66667 2.89131 6.84226 2.46738 7.15482 2.15482C7.46738 1.84226 7.89131 1.66667 8.33333 1.66667H11.6667C12.1087 1.66667 12.5326 1.84226 12.8452 2.15482C13.1577 2.46738 13.3333 2.89131 13.3333 3.33333V5M8.33333 9.16667V14.1667M11.6667 9.16667V14.1667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </td>
        <td>${Utils.escapeHtml(letter.writer)}</td>
        <td>${Utils.escapeHtml(letter.notes)}</td>
        <td>${Utils.escapeHtml(letter.reviewerName)}</td>
        <td>${Utils.escapeHtml(letter.subject)}</td>
        <td>${Utils.escapeHtml(letter.recipient)}</td>
        <td>
          <span class="status-badge ${getStatusClass(letter.sender)}">
            ${Utils.escapeHtml(letter.sender)}
          </span>
        </td>
        <td>
          <span class="status-badge ${getStatusClass(letter.reviewStatus)}">
            ${Utils.escapeHtml(letter.reviewStatus)}
          </span>
        </td>
        <td>${Utils.escapeHtml(letter.letterType)}</td>
        <td>${Utils.escapeHtml(letter.date)}</td>
        <td>${Utils.escapeHtml(letter.referenceNumber)}</td>
      </tr>
    `).join('');
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
  function renderPagination(result) {
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    // Update info
    paginationInfo.textContent = `صفحة ${result.page} من ${result.totalPages} (${result.total} خطاب)`;

    // Update controls
    paginationControls.innerHTML = `
      <button class="page-btn" onclick="LetterHistory.goToPage('first')" ${result.page === 1 ? 'disabled' : ''}>
        الأولى
      </button>
      <button class="page-btn" onclick="LetterHistory.goToPage('prev')" ${result.page === 1 ? 'disabled' : ''}>
        السابق
      </button>
      <button class="page-btn" onclick="LetterHistory.goToPage('next')" ${result.page === result.totalPages ? 'disabled' : ''}>
        التالي
      </button>
      <button class="page-btn" onclick="LetterHistory.goToPage('last')" ${result.page === result.totalPages ? 'disabled' : ''}>
        الأخيرة
      </button>
    `;
  }

  /**
   * Navigate to a specific page
   */
  function goToPage(direction) {
    const result = FakeLetters.getPaginatedLetters(currentPage, itemsPerPage, filters);

    switch (direction) {
      case 'first':
        currentPage = 1;
        break;
      case 'prev':
        currentPage = Math.max(1, currentPage - 1);
        break;
      case 'next':
        currentPage = Math.min(result.totalPages, currentPage + 1);
        break;
      case 'last':
        currentPage = result.totalPages;
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
  function viewLetter(id) {
    const letter = FakeLetters.viewLetter(id);
    if (letter) {
      alert(`عرض تفاصيل الخطاب:\n\nالرقم المرجعي: ${letter.referenceNumber}\nالموضوع: ${letter.subject}\n\n(هذا مجرد إجراء وهمي للاختبار)`);
    }
  }

  /**
   * Download letter
   */
  function downloadLetter(id) {
    FakeLetters.downloadLetter(id);
  }

  /**
   * Delete letter
   */
  function deleteLetter(id) {
    if (confirm('هل أنت متأكد من حذف هذا الخطاب؟')) {
      const success = FakeLetters.deleteLetter(id);
      if (success) {
        loadStats();
        loadLetters();
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
  function exportAll() {
    const letters = FakeLetters.getAllLetters();
    console.log('📤 Exporting letters:', letters);
    alert(`تصدير ${letters.length} خطاب\n\n(هذا مجرد إجراء وهمي للاختبار)`);
    // In production, this would generate CSV/Excel file
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
