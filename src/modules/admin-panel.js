/**
 * Admin Panel Module
 * Handles admin user management operations (CRUD)
 */

const AdminPanel = (() => {
  // State
  let usersData = [];

  // ==================== Load and Display Users ====================

  /**
   * Load and display all users
   */
  async function loadUsers() {
    try {
      // Check if ApiClient is available
      if (typeof ApiClient === 'undefined') {
        console.error('❌ ApiClient is not defined!');
        if (typeof notify !== 'undefined') {
          notify.error('خطأ: لم يتم تحميل خدمة API بشكل صحيح');
        }
        return;
      }

      console.log('📊 Loading users...');

      const response = await ApiClient.getAdminUsers();

      if (response && response.status === 'success') {
        usersData = response.users || [];
        console.log(`✅ Loaded ${usersData.length} users`);

        renderTable(usersData);

        // Update user count
        const userCount = document.getElementById('userCount');
        if (userCount) {
          userCount.textContent = response.count || usersData.length;
        }

        if (typeof notify !== 'undefined') {
          notify.success('تم تحميل المستخدمين بنجاح');
        }
      } else {
        console.warn('⚠️ No users data available');
        renderTable([]);
        if (typeof notify !== 'undefined') {
          notify.warning('لا توجد بيانات للمستخدمين');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      renderTable([]);
      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء تحميل المستخدمين');
      }
    }
  }

  /**
   * Render users table
   * @param {Array} users - Array of user objects
   */
  function renderTable(users) {
    const tableContainer = document.getElementById('tableContainer');

    if (!tableContainer) {
      console.error('❌ Table container not found');
      return;
    }

    if (!Array.isArray(users)) {
      console.error('❌ Users is not an array:', users);
      tableContainer.innerHTML = '<div class="empty-state">خطأ في تحميل بيانات المستخدمين</div>';
      return;
    }

    if (users.length === 0) {
      console.log('📋 No users to display');
      tableContainer.innerHTML = '<div class="empty-state">لا توجد مستخدمون في القائمة حتى الآن</div>';
      return;
    }

    console.log(`📋 Rendering ${users.length} users`);

    try {
      // Backend returns: email, full_name, phone_number, role, status, created_at
      const tableHTML = `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>البريد الإلكتروني</th>
                <th>الاسم الكامل</th>
                <th>رقم الهاتف</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => {
                if (!user) return '';
                const email = user.email || '';
                const fullName = user.full_name || '-';
                const phoneNumber = user.phone_number || '-';
                const role = user.role || 'user';
                const status = user.status || 'inactive';
                const createdAt = user.created_at || '';

                return `
                <tr data-user-email="${Utils.escapeHtml(email)}">
                  <td>
                    <i class="fas fa-user" style="color: #999; margin-left: 8px;"></i>
                    ${Utils.escapeHtml(email)}
                  </td>
                  <td>${Utils.escapeHtml(fullName)}</td>
                  <td>${Utils.escapeHtml(phoneNumber)}</td>
                  <td>
                    <span class="badge badge-${role}">
                      ${role === 'admin' ? '<i class="fas fa-shield-alt"></i>' : ''}
                      ${role === 'admin' ? 'مسؤول' : 'مستخدم'}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-${status}">
                      ${status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td>${formatDate(createdAt)}</td>
                  <td>
                    <button
                      class="btn btn-secondary"
                      onclick="AdminPanel.showEditModal('${Utils.escapeHtml(email)}')"
                      title="تعديل">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-danger"
                      onclick="AdminPanel.handleDeleteUser('${Utils.escapeHtml(email)}')"
                      title="حذف">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      tableContainer.innerHTML = tableHTML;
      console.log('✅ Table rendered successfully');
    } catch (error) {
      console.error('❌ Error rendering table:', error);
      tableContainer.innerHTML = '<div class="empty-state">حدث خطأ أثناء عرض البيانات</div>';
      if (typeof notify !== 'undefined') {
        notify.error('حدث خطأ أثناء عرض قائمة المستخدمين');
      }
    }
  }

  /**
   * Format date for display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  // ==================== Create User ====================

  /**
   * Handle create user form submission
   */
  async function handleCreateUser() {
    const emailInput = document.getElementById('newEmail');
    const usernameInput = document.getElementById('newUsername');
    const phoneInput = document.getElementById('newPhone');
    const passwordInput = document.getElementById('newPassword');
    const roleSelect = document.getElementById('newRole');
    const statusSelect = document.getElementById('newStatus');

    if (!emailInput || !usernameInput || !passwordInput) {
      console.error('❌ Form inputs not found');
      return;
    }

    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const phone_number = phoneInput ? phoneInput.value.trim() : '';
    const role = roleSelect ? roleSelect.value : 'user';
    const status = statusSelect ? statusSelect.value : 'inactive';

    // Validation
    if (!email || !username || !password) {
      if (typeof notify !== 'undefined') {
        notify.warning('الرجاء ملء جميع الحقول المطلوبة');
      }
      return;
    }

    if (password.length < 6) {
      if (typeof notify !== 'undefined') {
        notify.warning('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }
      return;
    }

    try {
      const userData = {
        email,
        username,
        password,
        role,
        status
      };

      if (phone_number) {
        userData.phone_number = phone_number;
      }

      const result = await ApiClient.createAdminUser(userData);

      if (result && result.status === 'success') {
        console.log('✅ User created successfully');

        // Clear form
        emailInput.value = '';
        usernameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (passwordInput) passwordInput.value = '';

        // Reload users list
        await loadUsers();
      }
    } catch (error) {
      console.error('❌ Failed to create user:', error);
    }
  }

  // ==================== Update User ====================

  /**
   * Show edit modal for user
   * @param {string} email - User email
   */
  function showEditModal(email) {
    const user = usersData.find(u => u.email === email);
    if (!user) {
      console.error('❌ User not found:', email);
      return;
    }

    // Fill edit form
    const editEmailInput = document.getElementById('editEmail');
    const editUsernameInput = document.getElementById('editUsername');
    const editPhoneInput = document.getElementById('editPhone');
    const editRoleSelect = document.getElementById('editRole');
    const editStatusSelect = document.getElementById('editStatus');

    if (editEmailInput) editEmailInput.value = user.email;
    if (editUsernameInput) editUsernameInput.value = user.full_name || '';
    if (editPhoneInput) editPhoneInput.value = user.phone_number || '';
    if (editRoleSelect) editRoleSelect.value = user.role || 'user';
    if (editStatusSelect) editStatusSelect.value = user.status || 'inactive';

    // Show modal
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  /**
   * Handle update user form submission
   */
  async function handleUpdateUser() {
    const editEmailInput = document.getElementById('editEmail');
    const editUsernameInput = document.getElementById('editUsername');
    const editPhoneInput = document.getElementById('editPhone');
    const editPasswordInput = document.getElementById('editPassword');
    const editRoleSelect = document.getElementById('editRole');
    const editStatusSelect = document.getElementById('editStatus');

    if (!editEmailInput) {
      console.error('❌ Email input not found');
      return;
    }

    const email = editEmailInput.value.trim();
    if (!email) {
      if (typeof notify !== 'undefined') {
        notify.warning('البريد الإلكتروني مطلوب');
      }
      return;
    }

    // Build updates object (only include changed fields)
    const updates = {};

    if (editUsernameInput && editUsernameInput.value.trim()) {
      updates.username = editUsernameInput.value.trim();
    }
    if (editPhoneInput && editPhoneInput.value.trim()) {
      updates.phone_number = editPhoneInput.value.trim();
    }
    if (editPasswordInput && editPasswordInput.value.trim()) {
      updates.password = editPasswordInput.value.trim();
    }
    if (editRoleSelect) {
      updates.role = editRoleSelect.value;
    }
    if (editStatusSelect) {
      updates.status = editStatusSelect.value;
    }

    if (Object.keys(updates).length === 0) {
      if (typeof notify !== 'undefined') {
        notify.warning('لم يتم تغيير أي بيانات');
      }
      return;
    }

    try {
      const result = await ApiClient.updateAdminUser(email, updates);

      if (result && result.status === 'success') {
        console.log('✅ User updated successfully');

        // Close modal
        const modal = document.getElementById('editModal');
        if (modal) {
          modal.style.display = 'none';
        }

        // Reload users list
        await loadUsers();
      }
    } catch (error) {
      console.error('❌ Failed to update user:', error);
    }
  }

  // ==================== Delete User ====================

  /**
   * Handle delete user
   * @param {string} email - User email
   */
  async function handleDeleteUser(email) {
    if (!email) {
      console.error('❌ Email is required');
      return;
    }

    // Confirmation
    const confirmed = confirm(`هل أنت متأكد من حذف المستخدم: ${email}؟`);
    if (!confirmed) {
      return;
    }

    try {
      const result = await ApiClient.deleteAdminUser(email);

      if (result && result.status === 'success') {
        console.log('✅ User deleted successfully');

        // Reload users list
        await loadUsers();
      }
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
    }
  }

  // ==================== Event Listeners ====================

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Create user button
    const createBtn = document.getElementById('createUserBtn');
    if (createBtn) {
      createBtn.addEventListener('click', handleCreateUser);
    }

    // Update user button
    const updateBtn = document.getElementById('updateUserBtn');
    if (updateBtn) {
      updateBtn.addEventListener('click', handleUpdateUser);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', loadUsers);
    }

    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    });

    console.log('✅ Event listeners setup complete');
  }

  // ==================== Initialization ====================

  /**
   * Initialize the admin panel
   */
  function init() {
    console.log('🔧 Admin Panel module initialized');

    try {
      // Check if ApiClient is available
      if (typeof ApiClient === 'undefined') {
        console.error('❌ ApiClient is not defined!');
        alert('خطأ: لم يتم تحميل خدمة API بشكل صحيح. الرجاء تحديث الصفحة.');
        return;
      }

      console.log('✅ ApiClient is available');

      setupEventListeners();
      loadUsers();

      console.log('✅ Admin Panel initialization complete');
    } catch (error) {
      console.error('❌ Fatal error in Admin Panel init:', error);
      alert('حدث خطأ في تحميل لوحة الإدارة: ' + error.message);
    }
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
    loadUsers,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    showEditModal
  };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.AdminPanel = AdminPanel;
}
