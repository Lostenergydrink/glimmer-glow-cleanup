/**
 * Formatting Utilities
 * Common formatting functions for text, numbers, dates, and currency.
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} [currencyCode='USD'] - Currency code
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD', locale = 'en-US') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Format a date in a readable format
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Truncates text and adds ellipsis if it exceeds the specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Format a number with commas as thousands separators
 * @param {number} number - Number to format
 * @param {number} [decimalPlaces=0] - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(number, decimalPlaces = 0) {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return number.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

/**
 * Format a string to capitalize the first letter of each word
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
export function capitalizeWords(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 