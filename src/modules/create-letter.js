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
   * Populate contact officer dropdown with emails from API
   */
  async function populateContactOfficerDropdown() {
    const dropdown = document.getElementById('letterStyle');
    if (!dropdown) {
      console.warn('⚠️ Contact officer dropdown not found');
      return;
    }

    try {
      console.log('📧 Fetching contact officer emails...');

      // Call API to get users
      if (typeof ApiClient === 'undefined' || !ApiClient.getUsers) {
        console.error('❌ ApiClient.getUsers not available');
        return;
      }

      const result = await ApiClient.getUsers();

      if (!result || result.status !== 'success') {
        console.error('❌ Failed to fetch users:', result);
        return;
      }

      // Extract emails array from response
      const emails = result.emails || [];

      if (!Array.isArray(emails) || emails.length === 0) {
        console.warn('⚠️ No emails found in response');
        return;
      }

      console.log(`✅ Found ${emails.length} contact officer emails`);

      // Clear existing options except the first one (placeholder)
      const firstOption = dropdown.querySelector('option');
      dropdown.innerHTML = '';
      if (firstOption) {
        dropdown.appendChild(firstOption);
      }

      // Add email options
      emails.forEach(email => {
        const option = document.createElement('option');
        option.value = email;
        option.textContent = email;
        dropdown.appendChild(option);
      });

      console.log('✅ Contact officer dropdown populated successfully');

    } catch (error) {
      console.error('❌ Error populating contact officer dropdown:', error);
    }
  }

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

    // Populate contact officer dropdown
    populateContactOfficerDropdown();

    console.log('✅ Create Letter form initialized');
  }

  // ==================== Letter Generation ====================

  /**
   * Set button loading state
   * @param {HTMLElement} button - The button element
   * @param {boolean} isLoading - Whether the button should be in loading state
   * @param {string} loadingText - Text to show during loading
   * @param {string} defaultText - Default button text
   */
  function setButtonLoading(button, isLoading, loadingText = 'جاري المعالجة...', defaultText = '') {
    if (!button) return;

    const buttonText = button.querySelector('span');

    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      if (buttonText) {
        buttonText.textContent = loadingText;
      }
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      if (buttonText && defaultText) {
        buttonText.textContent = defaultText;
      }
    }
  }

  /**
   * Handle letter generation form submission
   */
  async function handleLetterGeneration(event) {
    event.preventDefault();

    const generateButton = document.getElementById('generateButton');

    try {
      // Set button to loading state
      setButtonLoading(generateButton, true, 'جاري الإنشاء...', 'إنشاء الخطاب');

      const formData = new FormData(event.target);

      console.log('📝 Generating letter...');

      // Call API to generate letter
      if (typeof ApiClient === 'undefined' || !ApiClient.generateLetter) {
        console.error('❌ ApiClient not available');
        if (typeof notify !== 'undefined') {
          notify.error('خطأ في النظام. الرجاء إعادة تحميل الصفحة.');
        }
        setButtonLoading(generateButton, false, '', 'إنشاء الخطاب');
        return;
      }

      const result = await ApiClient.generateLetter(formData);

      if (!result) {
        console.error('❌ Letter generation failed');
        setButtonLoading(generateButton, false, '', 'إنشاء الخطاب');
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

      // Reset button state
      setButtonLoading(generateButton, false, '', 'إنشاء الخطاب');

    } catch (error) {
      console.error('❌ Error in letter generation:', error);

      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء إنشاء الخطاب');
      }

      // Reset button state on error
      setButtonLoading(generateButton, false, '', 'إنشاء الخطاب');
    }
  }

  // ==================== Letter Editing ====================

  /**
   * Handle letter edit request
   */
  async function handleLetterEdit() {
    const editFeedback = document.getElementById('editFeedback')?.value;
    const letterPreview = document.getElementById('mainLetterContent')?.textContent || '';
    const editButton = document.getElementById('editButton');

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
      // Set button to loading state
      setButtonLoading(editButton, true, 'جاري التعديل...', 'تعديل');

      console.log('✏️ Editing letter...');

      // Create chat session if not exists
      if (!currentEditSession) {
        if (typeof ApiClient === 'undefined' || !ApiClient.createChatSession) {
          console.error('❌ ApiClient not available');
          setButtonLoading(editButton, false, '', 'تعديل');
          return;
        }

        const sessionData = await ApiClient.createChatSession(letterPreview);

        if (!sessionData || !sessionData.session_id) {
          console.error('❌ Failed to create chat session');
          if (typeof notify !== 'undefined') {
            notify.error('فشل في إنشاء جلسة التعديل');
          }
          setButtonLoading(editButton, false, '', 'تعديل');
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

      // API returns { updated_letter, session_id, response_text, ... }
      // Check for both updated_letter (new format) and edited_letter (old format)
      const editedLetterContent = result?.updated_letter || result?.edited_letter;

      if (!result || !editedLetterContent) {
        console.error('❌ Letter editing failed - no updated letter in response');
        console.error('Response:', result);
        setButtonLoading(editButton, false, '', 'تعديل');
        return;
      }

      console.log('✅ Letter edited successfully');
      console.log('📝 Updated letter content:', editedLetterContent.substring(0, 100) + '...');

      // Normalize the result to match expected format (Letter property)
      const normalizedResult = {
        Letter: editedLetterContent,
        session_id: result.session_id
      };

      // Update current letter data
      currentLetterData = normalizedResult;

      // Refresh preview with updated content
      // This will update both the display and quality analysis
      if (typeof LetterQuality !== 'undefined') {
        // Get form data for preview
        const letterForm = document.getElementById('letterForm');
        const formData = letterForm ? new FormData(letterForm) : null;

        // Show preview (updates content, shows UI elements, and analyzes quality)
        LetterQuality.showPreview(normalizedResult, formData);
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

      // Reset button state
      setButtonLoading(editButton, false, '', 'تعديل');

    } catch (error) {
      console.error('❌ Error in letter editing:', error);

      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء تعديل الخطاب');
      }

      // Reset button state on error
      setButtonLoading(editButton, false, '', 'تعديل');
    }
  }

  // ==================== Letter Saving ====================

  /**
   * Handle letter save request
   */
  async function handleLetterSave() {
    const letterContent = document.getElementById('mainLetterContent')?.textContent || '';
    const saveButton = document.getElementById('saveButton');

    if (!letterContent || letterContent.trim() === '') {
      if (typeof notify !== 'undefined') {
        notify.warning('لا يوجد خطاب للحفظ');
      }
      return;
    }

    try {
      // Set button to loading state
      setButtonLoading(saveButton, true, 'جاري الحفظ...', 'حفظ ومتابعة');

      console.log('💾 Saving letter...');

      // Get form data
      const letterForm = document.getElementById('letterForm');
      if (!letterForm) {
        console.error('❌ Letter form not found');
        setButtonLoading(saveButton, false, '', 'حفظ ومتابعة');
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
        setButtonLoading(saveButton, false, '', 'حفظ ومتابعة');
        return;
      }

      const result = await ApiClient.archiveLetter(formData);

      if (!result) {
        console.error('❌ Letter save failed');
        setButtonLoading(saveButton, false, '', 'حفظ ومتابعة');
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

      // Show success message without redirect
      if (typeof notify !== 'undefined') {
        notify.success('تم حفظ الخطاب بنجاح! قد يستغرق ظهوره في لوحة التحكم بضع دقائق.');
      }

      // Reset button state
      setButtonLoading(saveButton, false, '', 'حفظ ومتابعة');

    } catch (error) {
      console.error('❌ Error in letter saving:', error);

      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء حفظ الخطاب');
      }

      // Reset button state on error
      setButtonLoading(saveButton, false, '', 'حفظ ومتابعة');
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
