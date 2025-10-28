/**
 * Fake Letters Data Module
 * Provides mock data for testing the letter history page
 *
 * ⚠️ This is temporary mock data for development
 * Replace with real API integration when backend is ready
 */

const FakeLetters = (() => {
  'use strict';

  // Mock letters data
  let letters = [
    {
      id: 1,
      referenceNumber: 'MKT-2024-001',
      date: '2024-01-15',
      letterType: 'خطاب جديد',
      reviewStatus: 'جاهز للإرسال',
      sender: 'مرسل',
      recipient: 'وزارة التعليم',
      subject: 'طلب موافقة على مشروع جديد',
      reviewerName: 'أحمد محمد',
      notes: 'تم المراجعة بنجاح',
      writer: 'سارة أحمد',
      content: 'محتوى الخطاب...'
    },
    {
      id: 2,
      referenceNumber: 'MKT-2024-002',
      date: '2024-01-14',
      letterType: 'رد على خطاب من الجهة',
      reviewStatus: 'في الانتظار',
      sender: 'مرسل',
      recipient: 'وزارة الصحة',
      subject: 'رد على استفسار سابق',
      reviewerName: 'محمد علي',
      notes: 'في انتظار المراجعة',
      writer: 'خالد محمود',
      content: 'محتوى الخطاب...'
    },
    {
      id: 3,
      referenceNumber: 'MKT-2024-003',
      date: '2024-01-13',
      letterType: 'طلب',
      reviewStatus: 'جاهز للإرسال',
      sender: 'مرسل',
      recipient: 'وزارة المالية',
      subject: 'طلب تمويل للمشروع',
      reviewerName: 'فاطمة حسن',
      notes: 'معتمد للإرسال',
      writer: 'عمر فاروق',
      content: 'محتوى الخطاب...'
    },
    {
      id: 4,
      referenceNumber: 'MKT-2024-004',
      date: '2024-01-12',
      letterType: 'جدولة اجتماع',
      reviewStatus: 'في الانتظار',
      sender: 'مرسل',
      recipient: 'وزارة التجارة',
      subject: 'دعوة لحضور اجتماع تنسيقي',
      reviewerName: 'ليلى سعيد',
      notes: 'تحت المراجعة',
      writer: 'ياسمين علي',
      content: 'محتوى الخطاب...'
    },
    {
      id: 5,
      referenceNumber: 'MKT-2024-005',
      date: '2024-01-11',
      letterType: 'دعوة حضور',
      reviewStatus: 'جاهز للإرسال',
      sender: 'مرسل',
      recipient: 'وزارة الثقافة',
      subject: 'دعوة لحضور مؤتمر',
      reviewerName: 'حسن إبراهيم',
      notes: 'جاهز',
      writer: 'نور الدين',
      content: 'محتوى الخطاب...'
    },
    {
      id: 6,
      referenceNumber: 'MKT-2024-006',
      date: '2024-01-10',
      letterType: 'تهنئة',
      reviewStatus: 'يحتاج إلى تحسين',
      sender: 'مرسل',
      recipient: 'وزارة الإعلام',
      subject: 'تهنئة بمناسبة النجاح',
      reviewerName: 'علي أحمد',
      notes: 'يحتاج تعديلات',
      writer: 'منى سالم',
      content: 'محتوى الخطاب...'
    },
    {
      id: 7,
      referenceNumber: 'MKT-2024-007',
      date: '2024-01-09',
      letterType: 'خطاب إلحاقي',
      reviewStatus: 'جاهز للإرسال',
      sender: 'مرسل',
      recipient: 'وزارة النقل',
      subject: 'خطاب إلحاقي بشأن المشروع',
      reviewerName: 'زينب كمال',
      notes: 'معتمد',
      writer: 'طارق رشيد',
      content: 'محتوى الخطاب...'
    },
    {
      id: 8,
      referenceNumber: 'MKT-2024-008',
      date: '2024-01-08',
      letterType: 'خطاب جديد',
      reviewStatus: 'في الانتظار',
      sender: 'مرسل',
      recipient: 'وزارة البيئة',
      subject: 'اقتراح مبادرة بيئية',
      reviewerName: 'سمير عادل',
      notes: 'قيد المراجعة',
      writer: 'رانيا محمد',
      content: 'محتوى الخطاب...'
    }
  ];

  /**
   * Get statistics for all letters
   */
  function getStats() {
    const stats = {
      total: letters.length,
      pendingReview: letters.filter(l => l.reviewStatus === 'في الانتظار').length,
      readyToSend: letters.filter(l => l.reviewStatus === 'جاهز للإرسال').length,
      thisMonth: letters.filter(l => {
        const letterDate = new Date(l.date);
        const now = new Date();
        return letterDate.getMonth() === now.getMonth() &&
               letterDate.getFullYear() === now.getFullYear();
      }).length
    };

    return stats;
  }

  /**
   * Get paginated and filtered letters
   */
  function getPaginatedLetters(page = 1, itemsPerPage = 10, filters = {}) {
    let filtered = [...letters];

    // Apply letter type filter
    if (filters.letterType && filters.letterType !== 'all') {
      filtered = filtered.filter(l => l.letterType === filters.letterType);
    }

    // Apply review status filter
    if (filters.reviewStatus && filters.reviewStatus !== 'all') {
      filtered = filtered.filter(l => l.reviewStatus === filters.reviewStatus);
    }

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim().toLowerCase();
      filtered = filtered.filter(l =>
        l.recipient.toLowerCase().includes(searchTerm) ||
        l.referenceNumber.toLowerCase().includes(searchTerm) ||
        l.writer.toLowerCase().includes(searchTerm) ||
        l.subject.toLowerCase().includes(searchTerm)
      );
    }

    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const data = filtered.slice(start, end);

    return {
      data,
      page,
      itemsPerPage,
      total,
      totalPages
    };
  }

  /**
   * Get all letters (for export)
   */
  function getAllLetters() {
    return [...letters];
  }

  /**
   * Get a single letter by ID
   */
  function viewLetter(id) {
    return letters.find(l => l.id === id);
  }

  /**
   * Download letter (mock)
   */
  function downloadLetter(id) {
    const letter = letters.find(l => l.id === id);
    if (letter) {
      console.log('📥 Downloading letter:', letter);
      alert(`تحميل الخطاب: ${letter.referenceNumber}\n\n(هذا مجرد إجراء وهمي للاختبار)`);
    }
  }

  /**
   * Delete letter
   */
  function deleteLetter(id) {
    const index = letters.findIndex(l => l.id === id);
    if (index !== -1) {
      letters.splice(index, 1);
      console.log('🗑️ Letter deleted:', id);
      return true;
    }
    return false;
  }

  // Public API
  return {
    getStats,
    getPaginatedLetters,
    getAllLetters,
    viewLetter,
    downloadLetter,
    deleteLetter
  };
})();

// Export for browser
if (typeof window !== 'undefined') {
  window.FakeLetters = FakeLetters;
}

// Export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FakeLetters;
}
