// Custom Notification System for AI Letter Generator

class NotificationSystem {
constructor() {
this.container = null;
this.init();
}init() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    } else {
        this.container = document.getElementById('notification-container');
    }
}show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;    // Icon based on type
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icons[type]} notification-icon"></i>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="notification-progress"></div>
    `;    this.container.appendChild(notification);    // Trigger animation
    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);    // Auto remove after duration
    if (duration > 0) {
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.animation = `progress ${duration}ms linear`;        setTimeout(() => {
            this.hide(notification);
        }, duration);
    }    return notification;
}hide(notification) {
    notification.classList.remove('notification-show');
    notification.classList.add('notification-hide');    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 300);
}success(message, duration = 4000) {
    return this.show(message, 'success', duration);
}error(message, duration = 6000) {
    return this.show(message, 'error', duration);
}warning(message, duration = 5000) {
    return this.show(message, 'warning', duration);
}info(message, duration = 4000) {
    return this.show(message, 'info', duration);
}confirm(message, onConfirm, onCancel) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'notification-modal-overlay';    // Create confirm dialog
    const modal = document.createElement('div');
    modal.className = 'notification-modal notification-modal-show';    modal.innerHTML = `
        <div class="notification-modal-content">
            <div class="notification-modal-header">
                <i class="fas fa-question-circle"></i>
                <h3>تأكيد العملية</h3>
            </div>
            <div class="notification-modal-body">
                <p>${message}</p>
            </div>
            <div class="notification-modal-footer">
                <button class="notification-modal-btn notification-modal-btn-cancel">
                    <i class="fas fa-times"></i>
                    إلغاء
                </button>
                <button class="notification-modal-btn notification-modal-btn-confirm">
                    <i class="fas fa-check"></i>
                    تأكيد
                </button>
            </div>
        </div>
    `;    overlay.appendChild(modal);
    document.body.appendChild(overlay);    // Trigger animation
    setTimeout(() => {
        overlay.classList.add('notification-modal-overlay-show');
    }, 10);    // Handle confirm
    const confirmBtn = modal.querySelector('.notification-modal-btn-confirm');
    confirmBtn.addEventListener('click', () => {
        this.closeModal(overlay);
        if (onConfirm) onConfirm();
    });    // Handle cancel
    const cancelBtn = modal.querySelector('.notification-modal-btn-cancel');
    cancelBtn.addEventListener('click', () => {
        this.closeModal(overlay);
        if (onCancel) onCancel();
    });    // Handle overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            this.closeModal(overlay);
            if (onCancel) onCancel();
        }
    });    return overlay;
}closeModal(overlay) {
    overlay.classList.remove('notification-modal-overlay-show');
    const modal = overlay.querySelector('.notification-modal');
    modal.classList.remove('notification-modal-show');
    modal.classList.add('notification-modal-hide');    setTimeout(() => {
        overlay.remove();
    }, 300);
}loading(message = 'جاري التحميل...') {
    const notification = document.createElement('div');
    notification.className = 'notification notification-loading';    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-spinner"></div>
            <span class="notification-message">${message}</span>
        </div>
    `;    this.container.appendChild(notification);    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);    return notification;
}clearAll() {
    const notifications = this.container.querySelectorAll('.notification');
    notifications.forEach(notification => {
        this.hide(notification);
    });
}
}// Create global notification instance
const notify = new NotificationSystem();// Export for use in other files
if (typeof window !== 'undefined') {
window.notify = notify;
}// Backward compatibility functions
window.showNotification = (message, type = 'info') => notify.show(message, type);
window.showSuccess = (message) => notify.success(message);
window.showError = (message) => notify.error(message);
window.showWarning = (message) => notify.warning(message);
window.showInfo = (message) => notify.info(message);
window.showConfirm = (message, onConfirm, onCancel) => notify.confirm(message, onConfirm, onCancel);
window.showLoading = (message) => notify.loading(message);
