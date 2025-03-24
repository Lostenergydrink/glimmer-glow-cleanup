/**
 * Shows an error message for a form field
 * @param {HTMLElement} field - The form field element (null for general errors)
 * @param {string} message - The error message to display
 */
export function showError(field, message) {
  if (field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      field.classList.add('error');
    }
  } else {
    const generalError = document.querySelector('.message-container .error-message');
    if (generalError) {
      generalError.textContent = message;
      generalError.style.display = 'block';
    }
  }
}

/**
 * Shows a success message
 * @param {string} message - The success message to display
 */
export function showSuccess(message) {
  const successElement = document.querySelector('.message-container .success-message');
  if (successElement) {
    successElement.textContent = message;
    successElement.style.display = 'block';
  }
}

/**
 * Clears all error messages from the form
 */
export function clearErrors() {
  // Clear field-specific errors
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(element => {
    element.textContent = '';
    element.style.display = 'none';
  });

  // Clear error styling from fields
  const fields = document.querySelectorAll('.error');
  fields.forEach(field => field.classList.remove('error'));

  // Clear general error message
  const generalError = document.querySelector('.message-container .error-message');
  if (generalError) {
    generalError.textContent = '';
    generalError.style.display = 'none';
  }

  // Clear success message
  const successMessage = document.querySelector('.message-container .success-message');
  if (successMessage) {
    successMessage.textContent = '';
    successMessage.style.display = 'none';
  }
}

/**
 * Debounces a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 * @param {Function} func - The function to throttle
 * @param {number} limit - The number of milliseconds to wait between function calls
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Formats a date string
 * @param {string|Date} date - The date to format
 * @returns {string} - The formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {boolean} - Whether the email is valid
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Sanitizes HTML content
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - The sanitized HTML content
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Generates a random string
 * @param {number} length - The length of the string to generate
 * @returns {string} - The random string
 */
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => chars[x % chars.length])
    .join('');
}
