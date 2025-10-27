/**
 * Submissions Service
 * Handles letter submissions data using the new API
 * Replaces direct Google Sheets access with API calls
 */

// ==================== Caching System ====================

class SubmissionsCache {
    constructor() {
        this.cache = new Map();
        this.lastFetch = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.CACHE_KEY = 'submissionsCache';
        this.VERSION_KEY = 'submissionsCacheVersion';

        // Load from localStorage if available
        this.loadFromStorage();
    }

    saveToStorage() {
        try {
            const cacheData = {
                data: Array.from(this.cache.entries()),
                lastFetch: this.lastFetch,
                version: Date.now()
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
            localStorage.setItem(this.VERSION_KEY, cacheData.version.toString());
        } catch (error) {
            console.warn('Failed to save cache to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const cacheData = JSON.parse(cached);
                this.cache = new Map(cacheData.data);
                this.lastFetch = cacheData.lastFetch;

                // Check if cache is still valid
                if (this.isExpired()) {
                    this.clear();
                }
            }
        } catch (error) {
            console.warn('Failed to load cache from localStorage:', error);
            this.clear();
        }
    }

    isExpired() {
        return !this.lastFetch || (Date.now() - this.lastFetch) > this.CACHE_DURATION;
    }

    get(key) {
        if (this.isExpired()) {
            return null;
        }
        return this.cache.get(key);
    }

    set(key, value) {
        this.cache.set(key, value);
        this.lastFetch = Date.now();
        this.saveToStorage();
    }

    clear() {
        this.cache.clear();
        this.lastFetch = null;
        localStorage.removeItem(this.CACHE_KEY);
        localStorage.removeItem(this.VERSION_KEY);
    }

    invalidate() {
        this.clear();
    }
}

// Global cache instance
const submissionsCache = new SubmissionsCache();

// ==================== Pagination ====================

class SubmissionsPagination {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalItems = 0;
        this.totalPages = 0;
        this.hasNext = false;
        this.hasPrev = false;
    }

    updateFromResponse(pagination) {
        if (pagination) {
            this.currentPage = pagination.current_page || 1;
            this.pageSize = pagination.page_size || 20;
            this.totalPages = pagination.total_pages || 0;
            this.totalItems = pagination.total_items || 0;
            this.hasNext = pagination.has_next || false;
            this.hasPrev = pagination.has_prev || false;
        }
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            return true;
        }
        return false;
    }

    nextPage() {
        return this.goToPage(this.currentPage + 1);
    }

    prevPage() {
        return this.goToPage(this.currentPage - 1);
    }
}

// Global pagination instance
const submissionsPagination = new SubmissionsPagination();

// ==================== Data Loading ====================

/**
 * Load submissions data with caching and pagination
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Object>} Submissions data with pagination
 */
async function loadSubmissionsData(page = 1, pageSize = 20, sortBy = 'ID', sortOrder = 'desc', forceRefresh = false) {
    console.time('loadSubmissionsData');

    // Check cache first
    const cacheKey = `submissions_${page}_${pageSize}_${sortBy}_${sortOrder}`;
    if (!forceRefresh) {
        const cached = submissionsCache.get(cacheKey);
        if (cached) {
            console.log('📦 Loading from cache:', cached.data.length, 'submissions');
            console.timeEnd('loadSubmissionsData');
            return cached;
        }
    }

    try {
        console.log('🔄 Fetching submissions from API...');

        // Use ApiClient to fetch submissions
        const response = await ApiClient.getSubmissions(page, pageSize, sortBy, sortOrder);

        if (response && response.status === 'success') {
            const result = {
                data: processSubmissions(response.data || []),
                pagination: response.pagination || {}
            };

            // Update pagination state
            submissionsPagination.updateFromResponse(result.pagination);

            // Cache the result
            submissionsCache.set(cacheKey, result);

            console.log('✅ Loaded:', result.data.length, 'submissions');
            console.timeEnd('loadSubmissionsData');
            return result;
        }

        console.timeEnd('loadSubmissionsData');
        return { data: [], pagination: {} };
    } catch (error) {
        console.error('❌ Error loading submissions:', error);
        console.timeEnd('loadSubmissionsData');

        // Return cached data if available, even if expired
        const cached = submissionsCache.cache.get(cacheKey);
        if (cached) {
            console.log('🔄 Fallback to cached data due to error');
            return cached;
        }

        return { data: [], pagination: {} };
    }
}

/**
 * Process submissions data from API
 * @param {Array} submissions - Raw submissions data
 * @returns {Array} Processed submissions
 */
function processSubmissions(submissions) {
    console.time('processSubmissions');

    const processed = submissions.map(sub => ({
        id: sub.ID || sub.id || '',
        date: sub.Timestamp || sub.date || '',
        createdBy: sub.Created_by || sub.createdBy || '',
        type: sub.Letter_type || sub.letterType || '',
        recipient: sub.Recipient_name || sub.recipient || '',
        subject: sub.Subject || sub.subject || '',
        content: sub.Letter_content || sub.content || '',
        letterLink: sub.Letter_Link || sub.letterLink || '',
        reviewStatus: sub.Review_status || sub.reviewStatus || 'Pending',
        sendStatus: sub.Send_status || sub.sendStatus || 'Pending',
        reviewerName: sub.Reviewer_name || sub.reviewerName || '',
        reviewNotes: sub.Review_notes || sub.reviewNotes || '',
        writer: sub.Writer || sub.writer || sub.Created_by || sub.createdBy || '',
    })).filter(letter => letter.id); // Remove empty entries

    console.timeEnd('processSubmissions');
    return processed;
}

/**
 * Get single submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Submission data or null
 */
async function getSubmission(submissionId) {
    try {
        const response = await ApiClient.getSubmission(submissionId);
        if (response && response.status === 'success') {
            return processSubmissions([response.data])[0] || null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching submission:', error);
        return null;
    }
}

/**
 * Get submissions statistics
 * @returns {Promise<Object|null>} Statistics data or null
 */
async function getSubmissionsStats() {
    try {
        const response = await ApiClient.getSubmissionsStats();
        if (response && response.status === 'success') {
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching submissions stats:', error);
        return null;
    }
}

// ==================== Rendering & UI ====================

/**
 * Render submissions table
 * @param {Array} submissions - Submissions data
 */
function renderSubmissionsTable(submissions) {
    console.time('renderSubmissionsTable');

    const tableBody = document.getElementById("lettersTableBody");
    if (!tableBody) {
        console.warn('Table body element not found');
        console.timeEnd('renderSubmissionsTable');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get("highlight");

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    submissions.forEach(letter => {
        const row = document.createElement("tr");

        if (highlightId && letter.id === highlightId) {
            row.classList.add("highlighted-letter");
        }

        const reviewStatusClass = getStatusClass(letter.reviewStatus);
        const sendStatusClass = getStatusClass(letter.sendStatus);

        row.innerHTML = `
            <td>${letter.id}</td>
            <td>${letter.date}</td>
            <td>${translateLetterType(letter.type)}</td>
            <td><span class="status-badge ${reviewStatusClass}">${letter.reviewStatus}</span></td>
            <td><span class="status-badge ${sendStatusClass}">${letter.sendStatus}</span></td>
            <td>${letter.recipient}</td>
            <td>${letter.subject}</td>
            <td>${letter.reviewerName || "-"}</td>
            <td>${letter.reviewNotes || "-"}</td>
            <td>${letter.writer || "-"}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="reviewLetter('${letter.id}')" title="مراجعة">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    </button>
                    <button class="action-btn download" onclick="downloadLetter('${letter.id}')" title="تحميل">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    </button>
                    <button class="action-btn delete" onclick="deleteLetter('${letter.id}')" title="حذف">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </td>
        `;

        fragment.appendChild(row);
    });

    // Single DOM update
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);

    console.timeEnd('renderSubmissionsTable');

    // Handle highlighting
    if (highlightId) {
        setTimeout(() => {
            const highlightedRow = document.querySelector(".highlighted-letter");
            if (highlightedRow) {
                highlightedRow.scrollIntoView({ behavior: "smooth", block: "center" });
                setTimeout(() => {
                    highlightedRow.classList.remove("highlighted-letter");
                }, 3000);
            }
        }, 100);
    }
}

/**
 * Update pagination UI
 */
function updatePaginationUI() {
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        const start = (submissionsPagination.currentPage - 1) * submissionsPagination.pageSize + 1;
        const end = Math.min(submissionsPagination.currentPage * submissionsPagination.pageSize, submissionsPagination.totalItems);
        paginationInfo.textContent = `صفحة ${submissionsPagination.currentPage} من ${submissionsPagination.totalPages} (${start}-${end} من ${submissionsPagination.totalItems} خطاب)`;
    }

    // Update button states
    const firstBtn = document.getElementById('firstPageBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const lastBtn = document.getElementById('lastPageBtn');

    if (firstBtn) firstBtn.disabled = !submissionsPagination.hasPrev;
    if (prevBtn) prevBtn.disabled = !submissionsPagination.hasPrev;
    if (nextBtn) nextBtn.disabled = !submissionsPagination.hasNext;
    if (lastBtn) lastBtn.disabled = !submissionsPagination.hasNext;
}

/**
 * Setup pagination controls
 */
function setupPaginationControls() {
    const firstBtn = document.getElementById('firstPageBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const lastBtn = document.getElementById('lastPageBtn');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (firstBtn) {
        firstBtn.addEventListener('click', async () => {
            if (submissionsPagination.goToPage(1)) {
                const result = await loadSubmissionsData(1, submissionsPagination.pageSize);
                renderSubmissionsTable(result.data);
                updatePaginationUI();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', async () => {
            if (submissionsPagination.prevPage()) {
                const result = await loadSubmissionsData(submissionsPagination.currentPage, submissionsPagination.pageSize);
                renderSubmissionsTable(result.data);
                updatePaginationUI();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            if (submissionsPagination.nextPage()) {
                const result = await loadSubmissionsData(submissionsPagination.currentPage, submissionsPagination.pageSize);
                renderSubmissionsTable(result.data);
                updatePaginationUI();
            }
        });
    }

    if (lastBtn) {
        lastBtn.addEventListener('click', async () => {
            if (submissionsPagination.goToPage(submissionsPagination.totalPages)) {
                const result = await loadSubmissionsData(submissionsPagination.totalPages, submissionsPagination.pageSize);
                renderSubmissionsTable(result.data);
                updatePaginationUI();
            }
        });
    }

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', async (e) => {
            submissionsPagination.pageSize = parseInt(e.target.value);
            submissionsPagination.currentPage = 1;
            const result = await loadSubmissionsData(1, submissionsPagination.pageSize);
            renderSubmissionsTable(result.data);
            updatePaginationUI();
        });
    }
}

/**
 * Main load function
 */
async function loadLetterHistory() {
    const tableBody = document.getElementById("lettersTableBody");
    const noData = document.getElementById("noData");

    try {
        console.log('🚀 Loading letter history...');

        showLoadingIndicator();

        // Load first page
        const result = await loadSubmissionsData(1, submissionsPagination.pageSize);

        if (result.data.length === 0) {
            if (tableBody) tableBody.style.display = "none";
            if (noData) noData.style.display = "block";
        } else {
            console.log(`📊 Loaded ${result.data.length} submissions`);

            renderSubmissionsTable(result.data);
            updatePaginationUI();
            setupPaginationControls();

            if (tableBody) tableBody.style.display = "table-row-group";
            if (noData) noData.style.display = "none";
        }
    } catch (error) {
        console.error('❌ Error loading letter history:', error);
        if (typeof notify !== 'undefined') {
            notify.error('حدث خطأ في تحميل البيانات. الرجاء المحاولة مرة أخرى.');
        }
    } finally {
        hideLoadingIndicator();
    }
}

/**
 * Refresh data (invalidate cache and reload)
 */
async function refreshSubmissions() {
    submissionsCache.invalidate();
    await loadLetterHistory();
}

// ==================== Helper Functions ====================

function showLoadingIndicator() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('active');
    }
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('active');
    }
}

function getStatusClass(status) {
    const statusMap = {
        'Ready': 'ready',
        'Pending': 'pending',
        'Approved': 'approved',
        'Needs Improvement': 'improvements',
        'جاهز للإرسال': 'ready',
        'في الانتظار': 'pending',
        'تم الموافقة': 'approved',
        'يحتاج إلى تحسينات': 'improvements'
    };
    return statusMap[status] || 'pending';
}

function translateLetterType(type) {
    const typeMap = {
        'New': 'جديد',
        'Reply': 'رد',
        'Follow Up': 'متابعة',
        'Co-op': 'تعاون',
        'Inquiry': 'استفسار'
    };
    return typeMap[type] || type;
}

// ==================== Global Exports ====================

// Export for backward compatibility
window.loadLetterHistory = loadLetterHistory;
window.loadLetterHistoryOptimized = loadLetterHistory;
window.loadLetterHistoryProgressive = loadLetterHistory;
window.refreshSubmissions = refreshSubmissions;
window.refreshLetterCache = refreshSubmissions;
window.submissionsCache = submissionsCache;
window.submissionsPagination = submissionsPagination;

// Export service functions
window.SubmissionsService = {
    loadSubmissionsData,
    getSubmission,
    getSubmissionsStats,
    renderSubmissionsTable,
    refreshSubmissions,
};
