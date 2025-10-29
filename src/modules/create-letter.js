/**
 * Create Letter Page Module
 * Handles letter generation, editing, and saving functionality
 */

const CreateLetterPage = (() => {
  // Global variables for edit session and validation
  let currentEditSession = null;
  let currentValidation = null;
  let currentLetterData = null;

  // ==================== Form Initialization ====================

  /**
   * Initialize form event listeners
   */
  function initForm() {
    const letterForm = document.getElementById('letterForm');
    const generateButton = document.getElementById('generateButton');
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const recipientTitleSelect = document.getElementById('recipientTitle');
    const otherRecipientTitleInput = document.getElementById('otherRecipientTitle');
    const letterTypeSelect = document.getElementById('letterType');
    const previousLetterGroup = document.getElementById('previousLetterGroup');
    const receivedLetterGroup = document.getElementById('receivedLetterGroup');
    const editSection = document.getElementById('editSection');
    const templateRadios = document.querySelectorAll('input[name="template"]');

    // Show/hide edit section based on template selection
    if (templateRadios) {
      templateRadios.forEach(radio => {
        radio.addEventListener('change', function() {
          if (this.value === 'template2') {
            if (editSection) editSection.style.display = 'block';
          } else {
            if (editSection) editSection.style.display = 'none';
          }
        });
      });
    }

    // Show/hide other recipient title input
    if (recipientTitleSelect && otherRecipientTitleInput) {
      recipientTitleSelect.addEventListener('change', function() {
        if (this.value === 'أخرى') {
          otherRecipientTitleInput.style.display = 'block';
        } else {
          otherRecipientTitleInput.style.display = 'none';
        }
      });
    }

    // Show/hide conditional letter groups based on letter type
    if (letterTypeSelect && previousLetterGroup && receivedLetterGroup) {
      letterTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;

        if (selectedType === 'خطاب إلحاقي') {
          previousLetterGroup.style.display = 'flex';
          receivedLetterGroup.style.display = 'none';
        } else if (selectedType === 'خطاب رد على خطاب من الجهة') {
          receivedLetterGroup.style.display = 'flex';
          previousLetterGroup.style.display = 'none';
        } else {
          previousLetterGroup.style.display = 'none';
          receivedLetterGroup.style.display = 'none';
        }
      });
    }

    // Letter generation form submission
    if (letterForm) {
      letterForm.addEventListener('submit', handleLetterGeneration);
    }

    // Edit button
    if (editButton) {
      editButton.addEventListener('click', handleLetterEdit);
    }

    // Save button
    if (saveButton) {
      saveButton.addEventListener('click', handleLetterSave);
    }

    console.log('✅ Create Letter form initialized');
  }

  // ==================== Letter Generation ====================

  /**
   * Handle letter generation form submission
   */
  async function handleLetterGeneration(event) {
    event.preventDefault();

    try {
      const formData = new FormData(event.target);

      console.log('📝 Generating letter...');

      // Call API to generate letter
      if (typeof ApiClient === 'undefined' || !ApiClient.generateLetter) {
        console.error('❌ ApiClient not available');
        if (typeof notify !== 'undefined') {
          notify.error('خطأ في النظام. الرجاء إعادة تحميل الصفحة.');
        }
        return;
      }

      const result = await ApiClient.generateLetter(formData);

      if (!result) {
        console.error('❌ Letter generation failed');
        return;
      }

      console.log('✅ Letter generated successfully:', result);

      // Store current letter data
      currentLetterData = result;

      // Show preview using LetterQuality module
      if (typeof LetterQuality !== 'undefined') {
        LetterQuality.showPreview(result, formData);
      } else {
        console.error('❌ LetterQuality module not available');
      }

      // Show success notification
      if (typeof notify !== 'undefined') {
        notify.success('تم إنشاء الخطاب بنجاح');
      }

    } catch (error) {
      console.error('❌ Error in letter generation:', error);

      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء إنشاء الخطاب');
      }
    }
  }

  // ==================== Letter Editing ====================

  /**
   * Handle letter edit request
   */
  async function handleLetterEdit() {
    const editFeedback = document.getElementById('editFeedback')?.value;
    const letterPreview = document.getElementById('letterPreview')?.value ||
                         document.getElementById('mainLetterContent')?.textContent || '';

    if (!editFeedback || editFeedback.trim() === '') {
      if (typeof notify !== 'undefined') {
        notify.warning('الرجاء إدخال التعديلات المطلوبة');
      }
      return;
    }

    if (!letterPreview || letterPreview.trim() === '') {
      if (typeof notify !== 'undefined') {
        notify.warning('لا يوجد خطاب للتعديل');
      }
      return;
    }

    try {
      console.log('✏️ Editing letter...');

      // Create chat session if not exists
      if (!currentEditSession) {
        if (typeof ApiClient === 'undefined' || !ApiClient.createChatSession) {
          console.error('❌ ApiClient not available');
          return;
        }

        const sessionData = await ApiClient.createChatSession(letterPreview);

        if (!sessionData || !sessionData.session_id) {
          console.error('❌ Failed to create chat session');
          if (typeof notify !== 'undefined') {
            notify.error('فشل في إنشاء جلسة التعديل');
          }
          return;
        }

        currentEditSession = sessionData.session_id;

        // Update session status
        const sessionStatusText = document.getElementById('sessionStatusText');
        if (sessionStatusText) {
          sessionStatusText.textContent = `جلسة التعديل نشطة (${currentEditSession.substring(0, 8)}...)`;
        }

        console.log('✅ Chat session created:', currentEditSession);
      }

      // Call edit API with correct parameter order: (sessionId, userMessage, currentLetter, context)
      const result = await ApiClient.editLetter(currentEditSession, editFeedback, letterPreview);

      if (!result || !result.Letter) {
        console.error('❌ Letter editing failed');
        return;
      }

      console.log('✅ Letter edited successfully');

      // Update current letter data
      currentLetterData = result;

      // Refresh preview with updated content
      // This will update both the display and quality analysis
      if (typeof LetterQuality !== 'undefined') {
        // Get form data for preview
        const letterForm = document.getElementById('letterForm');
        const formData = letterForm ? new FormData(letterForm) : null;

        // Show preview (updates content, shows UI elements, and analyzes quality)
        LetterQuality.showPreview(result, formData);
      }

      // Clear edit feedback
      const editFeedbackEl = document.getElementById('editFeedback');
      if (editFeedbackEl) {
        editFeedbackEl.value = '';
      }

      // Show success notification
      if (typeof notify !== 'undefined') {
        notify.success('تم تعديل الخطاب بنجاح');
      }

    } catch (error) {
      console.error('❌ Error in letter editing:', error);

      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء تعديل الخطاب');
      }
    }
  }

  // ==================== Letter Saving ====================

  /**
   * Handle letter save request
   */
  async function handleLetterSave() {
    const letterContent = document.getElementById('letterPreview')?.value ||
                         document.getElementById('mainLetterContent')?.textContent || '';

    if (!letterContent || letterContent.trim() === '') {
      if (typeof notify !== 'undefined') {
        notify.warning('لا يوجد خطاب للحفظ');
      }
      return;
    }

    try {
      console.log('💾 Saving letter...');

      // Get form data
      const letterForm = document.getElementById('letterForm');
      if (!letterForm) {
        console.error('❌ Letter form not found');
        return;
      }

      const formData = new FormData(letterForm);

      // Add letter content to form data
      formData.append('content', letterContent);
      formData.append('letter', letterContent);

      // Add title from form if available
      const letterPurpose = formData.get('title') || 'خطاب';
      formData.set('title', letterPurpose);

      // Call archive API
      if (typeof ApiClient === 'undefined' || !ApiClient.archiveLetter) {
        console.error('❌ ApiClient not available');
        return;
      }

      const result = await ApiClient.archiveLetter(formData);

      if (!result) {
        console.error('❌ Letter save failed');
        return;
      }

      console.log('✅ Letter saved successfully');

      // Clean up chat session if exists
      if (currentEditSession) {
        if (ApiClient.deleteChatSession) {
          await ApiClient.deleteChatSession(currentEditSession);
        }
        currentEditSession = null;
      }

      // Show success and redirect
      if (typeof notify !== 'undefined') {
        notify.success('تم حفظ الخطاب بنجاح');
      }

      // Redirect to letter history after a short delay
      setTimeout(() => {
        window.location.href = 'letter-history.html';
      }, 1500);

    } catch (error) {
      console.error('❌ Error in letter saving:', error);

      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء حفظ الخطاب');
      }
    }
  }

  // ==================== Initialization ====================

  /**
   * Initialize the create letter page
   */
  function init() {
    initForm();
    console.log('✅ Create Letter Page module initialized');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== Public API ====================
  return {
    init,
    getCurrentSession: () => currentEditSession,
    getCurrentLetter: () => currentLetterData
  };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CreateLetterPage = CreateLetterPage;
}
