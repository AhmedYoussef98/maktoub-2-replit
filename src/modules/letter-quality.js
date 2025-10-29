/**
 * Letter Quality Analysis and Preview Management Module
 * Handles quality checks, statistics calculation, and preview state management
 */

const LetterQuality = (() => {
  // ==================== Private Helper Functions ====================

  /**
   * Check if letter contains Basmala
   * @private
   */
  function hasBasmala(content) {
    const basmalaPatterns = [
      'بسم الله الرحمن الرحيم',
      'بسم الله',
      'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ'
    ];

    return basmalaPatterns.some(pattern => content.includes(pattern));
  }

  /**
   * Check if content is predominantly Arabic
   * @private
   */
  function hasArabicContent(content) {
    // Remove whitespace and count Arabic characters
    const arabicChars = content.match(/[\u0600-\u06FF]/g);
    const totalChars = content.replace(/\s/g, '').length;

    if (totalChars === 0) return false;

    // At least 70% should be Arabic characters
    const arabicPercentage = (arabicChars?.length || 0) / totalChars;
    return arabicPercentage >= 0.7;
  }

  /**
   * Check if letter has appropriate length
   * @private
   */
  function hasAppropriateLength(content) {
    const wordCount = calculateWordCount(content);

    // Appropriate length: between 50 and 1000 words
    return wordCount >= 50 && wordCount <= 1000;
  }

  /**
   * Check if letter contains greeting
   * @private
   */
  function hasGreeting(content) {
    const greetingPatterns = [
      'السلام عليكم',
      'تحية طيبة',
      'تحياتنا',
      'المحترم',
      'المحترمة',
      'الموقر',
      'الموقرة',
      'سعادة',
      'معالي'
    ];

    return greetingPatterns.some(pattern => content.includes(pattern));
  }

  /**
   * Calculate character count (excluding spaces)
   * @private
   */
  function calculateCharCount(content) {
    return content.replace(/\s/g, '').length;
  }

  /**
   * Calculate word count
   * @private
   */
  function calculateWordCount(content) {
    // Split by whitespace and filter empty strings
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Calculate line count (paragraph count)
   * @private
   */
  function calculateLineCount(content) {
    // Split by newlines and filter empty lines
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  }

  /**
   * Update check icon status
   * @private
   */
  function updateCheckIcon(elementId, isPassed) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const icon = element.querySelector('.check-icon');
    if (!icon) return;

    // Update element class for background color
    if (isPassed) {
      element.classList.remove('check-failure');
      element.classList.add('check-success');

      icon.classList.remove('text-red-400');
      icon.classList.add('text-green-400');
      icon.innerHTML = `
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
        <path d="M22 4L12 14.01l-3-3"></path>
      `;
    } else {
      element.classList.remove('check-success');
      element.classList.add('check-failure');

      icon.classList.remove('text-green-400');
      icon.classList.add('text-red-400');
      icon.innerHTML = `
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M15 9l-6 6M9 9l6 6"></path>
      `;
    }
  }

  /**
   * Update quality status banner
   * @private
   */
  function updateQualityStatus(checks) {
    const statusElement = document.getElementById('qualityStatus');
    const messageElement = document.getElementById('qualityMessage');
    if (!statusElement || !messageElement) return;

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const passRate = passedChecks / totalChecks;

    // Remove all status classes
    statusElement.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-opacity-20');
    statusElement.classList.remove('quality-excellent', 'quality-good', 'quality-poor');

    const statusIcon = statusElement.querySelector('svg');
    const statusTitle = statusElement.querySelector('p');

    if (passRate === 1) {
      // All checks passed
      statusElement.classList.add('quality-excellent');
      if (statusIcon) {
        statusIcon.classList.remove('text-yellow-400', 'text-red-400');
        statusIcon.classList.add('text-green-400', 'status-icon');
      }
      if (statusTitle) {
        statusTitle.classList.remove('text-yellow-400', 'text-red-400');
        statusTitle.classList.add('text-green-400', 'status-title');
        statusTitle.textContent = 'البنية ممتازة';
      }
      messageElement.textContent = 'الخطاب يحتوي على جميع العناصر المطلوبة';
    } else if (passRate >= 0.5) {
      // Most checks passed
      statusElement.classList.add('quality-good');
      if (statusIcon) {
        statusIcon.classList.remove('text-green-400', 'text-red-400');
        statusIcon.classList.add('text-yellow-400', 'status-icon');
      }
      if (statusTitle) {
        statusTitle.classList.remove('text-green-400', 'text-red-400');
        statusTitle.classList.add('text-yellow-400', 'status-title');
        statusTitle.textContent = 'البنية جيدة';
      }
      messageElement.textContent = 'الخطاب يحتاج إلى بعض التحسينات';
    } else {
      // Most checks failed
      statusElement.classList.add('quality-poor');
      if (statusIcon) {
        statusIcon.classList.remove('text-green-400', 'text-yellow-400');
        statusIcon.classList.add('text-red-400', 'status-icon');
      }
      if (statusTitle) {
        statusTitle.classList.remove('text-green-400', 'text-yellow-400');
        statusTitle.classList.add('text-red-400', 'status-title');
        statusTitle.textContent = 'البنية تحتاج تحسين';
      }
      messageElement.textContent = 'الخطاب يحتاج إلى تحسينات كبيرة';
    }
  }

  // ==================== Public API Functions ====================

  /**
   * Analyze letter quality and update UI
   * @param {string} letterContent - The letter content to analyze
   * @returns {Object} Analysis results
   */
  function analyzeLetter(letterContent) {
    if (!letterContent || letterContent.trim().length === 0) {
      console.warn('⚠️ No letter content to analyze');
      return null;
    }

    console.log('🔍 Analyzing letter content...', letterContent.substring(0, 100) + '...');

    // Perform quality checks
    const checks = {
      basmala: hasBasmala(letterContent),
      arabic: hasArabicContent(letterContent),
      length: hasAppropriateLength(letterContent),
      greeting: hasGreeting(letterContent)
    };

    console.log('📋 Quality checks results:', checks);

    // Calculate statistics
    const statistics = {
      charCount: calculateCharCount(letterContent),
      wordCount: calculateWordCount(letterContent),
      lineCount: calculateLineCount(letterContent)
    };

    console.log('📊 Statistics calculated:', statistics);

    // Update UI with results
    updateCheckIcon('checkBasmala', checks.basmala);
    updateCheckIcon('checkArabic', checks.arabic);
    updateCheckIcon('checkLength', checks.length);
    updateCheckIcon('checkGreeting', checks.greeting);

    updateQualityStatus(checks);

    // Update statistics display
    const charCountEl = document.getElementById('charCount');
    const wordCountEl = document.getElementById('wordCount');
    const lineCountEl = document.getElementById('lineCount');

    if (charCountEl) charCountEl.textContent = statistics.charCount;
    if (wordCountEl) wordCountEl.textContent = statistics.wordCount;
    if (lineCountEl) lineCountEl.textContent = statistics.lineCount;

    // Show quality analysis section (make sure it's visible)
    const qualitySection = document.getElementById('qualityAnalysisSection');
    if (qualitySection) {
      qualitySection.style.display = 'block';
      qualitySection.style.opacity = '1';
      qualitySection.style.visibility = 'visible';
      console.log('✅ Quality analysis section shown');
    } else {
      console.warn('⚠️ qualityAnalysisSection element not found');
    }

    console.log('✅ Letter analysis complete:', { checks, statistics });

    return {
      checks,
      statistics,
      overallQuality: Object.values(checks).filter(Boolean).length / Object.keys(checks).length
    };
  }

  /**
   * Show letter preview and hide placeholder
   * @param {Object} letterData - Generated letter data
   * @param {FormData} formData - Original form data
   */
  function showPreview(letterData, formData) {
    // Hide placeholder
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // Show document preview
    const documentPreview = document.getElementById('documentPreview');
    if (documentPreview) {
      documentPreview.style.display = 'block';
    }

    // Show template actions section (القالب الرسمي / تعديل الخطاب)
    const templateActionsSection = document.getElementById('templateActionsSection');
    if (templateActionsSection) {
      templateActionsSection.style.display = 'block';
    }

    // Show save button
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
      saveButton.style.display = 'block';
    }

    // Populate document template if function exists
    if (typeof populateDocumentTemplate === 'function') {
      populateDocumentTemplate(letterData, formData);
    }

    // Analyze the letter content
    const letterContent = letterData.Letter || letterData.content || '';

    console.log('📄 Letter content found:', letterContent ? `${letterContent.length} chars` : 'NO CONTENT');

    if (letterContent && letterContent.trim().length > 0) {
      console.log('🔍 Running quality analysis...');
      analyzeLetter(letterContent);
    } else {
      console.warn('⚠️ No letter content to analyze in showPreview');
    }

    console.log('✅ Letter preview displayed');
  }

  /**
   * Hide preview and show placeholder
   */
  function hidePreview() {
    // Show placeholder
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }

    // Hide document preview
    const documentPreview = document.getElementById('documentPreview');
    if (documentPreview) {
      documentPreview.style.display = 'none';
    }

    // Hide template actions section
    const templateActionsSection = document.getElementById('templateActionsSection');
    if (templateActionsSection) {
      templateActionsSection.style.display = 'none';
    }

    // Hide save button
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
      saveButton.style.display = 'none';
    }

    // Hide quality analysis section
    const qualitySection = document.getElementById('qualityAnalysisSection');
    if (qualitySection) {
      qualitySection.style.display = 'none';
    }

    console.log('✅ Preview hidden, placeholder shown');
  }

  /**
   * Refresh quality analysis for current letter
   */
  function refreshQualityAnalysis() {
    console.log('🔄 Refreshing quality analysis...');

    const mainLetterContentEl = document.getElementById('mainLetterContent');

    if (!mainLetterContentEl) {
      console.error('❌ mainLetterContent element not found');
      if (typeof notify !== 'undefined') {
        notify.error('خطأ: عنصر المحتوى غير موجود');
      }
      return;
    }

    // Get text content (strips HTML tags)
    const letterContent = mainLetterContentEl.textContent || mainLetterContentEl.innerText || '';

    console.log('📄 Letter content length:', letterContent.length);
    console.log('📄 Letter content preview:', letterContent.substring(0, 100) + '...');

    if (letterContent.trim().length > 0) {
      console.log('✅ Analyzing letter...');
      const result = analyzeLetter(letterContent);

      console.log('📊 Analysis result:', result);

      if (typeof notify !== 'undefined') {
        notify.success('تم تحديث تحليل الجودة بنجاح');
      }
    } else {
      console.warn('⚠️ No letter content to analyze');

      if (typeof notify !== 'undefined') {
        notify.warning('لا يوجد محتوى للتحليل. الرجاء إنشاء خطاب أولاً');
      }
    }
  }

  /**
   * Initialize event listeners
   */
  function init() {
    console.log('🚀 Initializing Letter Quality module...');

    // Refresh quality button
    const refreshButton = document.getElementById('refreshQualityButton');
    if (refreshButton) {
      refreshButton.addEventListener('click', refreshQualityAnalysis);
      console.log('✅ Refresh quality button found and connected');
    } else {
      console.warn('⚠️ refreshQualityButton not found - button may not exist yet');
    }

    // Check if main elements exist
    const mainLetterContent = document.getElementById('mainLetterContent');
    const qualitySection = document.getElementById('qualityAnalysisSection');

    console.log('📋 Element check:', {
      mainLetterContent: mainLetterContent ? '✓' : '✗',
      qualitySection: qualitySection ? '✓' : '✗',
      refreshButton: refreshButton ? '✓' : '✗'
    });

    console.log('✅ Letter Quality module initialized');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== Public API ====================
  return {
    analyzeLetter,
    showPreview,
    hidePreview,
    refreshQualityAnalysis,
    init
  };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.LetterQuality = LetterQuality;
}
