/**
 * Notifications Utility
 * Provides functions for showing toast notifications to the user.
 */

// Default notification options
const DEFAULT_OPTIONS = {
  duration: 3000,
  position: 'bottom-right',
  showProgress: true,
  closeButton: true,
  pauseOnHover: true,
  maxNotifications: 5
};

// Track existing notifications
let notifications = [];
let container = null;

/**
 * Initialize the notifications container
 */
function initContainer() {
  if (container) return;

  container = document.createElement('div');
  container.className = 'notifications-container';
  document.body.appendChild(container);
}

/**
 * Show a notification
 * @param {string} message - Notification message
 * @param {string} [type='info'] - Notification type (info, success, warning, error)
 * @param {Object} [options] - Additional options
 * @returns {Object} The notification object
 */
export function showNotification(message, type = 'info', options = {}) {
  initContainer();
  
  // Merge options with defaults
  const settings = { ...DEFAULT_OPTIONS, ...options };
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Add icon based on type
  const iconTypes = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  // Create notification content
  const content = document.createElement('div');
  content.className = 'notification-content';
  
  // Add icon if available
  if (iconTypes[type]) {
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.textContent = iconTypes[type];
    content.appendChild(icon);
  }
  
  // Add message
  const messageElement = document.createElement('span');
  messageElement.className = 'notification-message';
  messageElement.textContent = message;
  content.appendChild(messageElement);
  
  notification.appendChild(content);
  
  // Add close button if enabled
  if (settings.closeButton) {
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      removeNotification(notification);
    });
    notification.appendChild(closeButton);
  }
  
  // Add progress bar if enabled
  let progressBar = null;
  if (settings.showProgress && settings.duration > 0) {
    progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    notification.appendChild(progressBar);
  }
  
  // Add to container
  container.appendChild(notification);
  
  // Manage maximum notifications
  if (notifications.length >= settings.maxNotifications) {
    removeNotification(notifications[0].element);
  }
  
  // Track notification
  const notificationObj = {
    element: notification,
    timerId: null,
    startTime: Date.now(),
    remainingTime: settings.duration,
    paused: false
  };
  
  notifications.push(notificationObj);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('show');
    
    if (progressBar && settings.duration > 0) {
      progressBar.style.transition = `width ${settings.duration}ms linear`;
      progressBar.style.width = '0%';
    }
  }, 10);
  
  // Set up auto-remove timer if duration > 0
  if (settings.duration > 0) {
    notificationObj.timerId = setTimeout(() => {
      removeNotification(notification);
    }, settings.duration);
  }
  
  // Pause on hover if enabled
  if (settings.pauseOnHover) {
    notification.addEventListener('mouseenter', () => {
      if (notificationObj.timerId) {
        clearTimeout(notificationObj.timerId);
        notificationObj.timerId = null;
        notificationObj.remainingTime = settings.duration - (Date.now() - notificationObj.startTime);
        notificationObj.paused = true;
        
        if (progressBar) {
          progressBar.style.transition = 'none';
        }
      }
    });
    
    notification.addEventListener('mouseleave', () => {
      if (notificationObj.paused) {
        notificationObj.paused = false;
        notificationObj.startTime = Date.now();
        
        if (progressBar) {
          progressBar.style.transition = `width ${notificationObj.remainingTime}ms linear`;
          progressBar.style.width = '0%';
        }
        
        notificationObj.timerId = setTimeout(() => {
          removeNotification(notification);
        }, notificationObj.remainingTime);
      }
    });
  }
  
  return notificationObj;
}

/**
 * Remove a notification
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
  const index = notifications.findIndex(n => n.element === notification);
  
  if (index !== -1) {
    const notificationObj = notifications[index];
    
    // Clear timer if active
    if (notificationObj.timerId) {
      clearTimeout(notificationObj.timerId);
    }
    
    // Animate out
    notification.classList.remove('show');
    notification.classList.add('hiding');
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      notifications.splice(index, 1);
      
      // Remove container if no notifications left
      if (notifications.length === 0 && container) {
        document.body.removeChild(container);
        container = null;
      }
    }, 300);
  }
}

/**
 * Clear all active notifications
 */
export function clearAllNotifications() {
  // Clone the array since we'll be modifying it during iteration
  const notificationsCopy = [...notifications];
  
  notificationsCopy.forEach(notification => {
    removeNotification(notification.element);
  });
}

/**
 * Shortcut for success notification
 * @param {string} message - Notification message
 * @param {Object} [options] - Additional options
 * @returns {Object} The notification object
 */
export function showSuccessNotification(message, options = {}) {
  return showNotification(message, 'success', options);
}

/**
 * Shortcut for error notification
 * @param {string} message - Notification message
 * @param {Object} [options] - Additional options
 * @returns {Object} The notification object
 */
export function showErrorNotification(message, options = {}) {
  return showNotification(message, 'error', { duration: 5000, ...options });
}

/**
 * Shortcut for warning notification
 * @param {string} message - Notification message
 * @param {Object} [options] - Additional options
 * @returns {Object} The notification object
 */
export function showWarningNotification(message, options = {}) {
  return showNotification(message, 'warning', { duration: 4000, ...options });
}

/**
 * Shortcut for info notification
 * @param {string} message - Notification message
 * @param {Object} [options] - Additional options
 * @returns {Object} The notification object
 */
export function showInfoNotification(message, options = {}) {
  return showNotification(message, 'info', options);
} 