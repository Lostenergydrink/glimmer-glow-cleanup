/**
 * @file utilities.js - Common utility functions for GlimmerGlow website
 * 
 * This file contains shared utility functions that are used across multiple
 * JavaScript files in the project. By centralizing these functions, we reduce
 * code duplication and make maintenance easier.
 * 
 * @version 1.0.0
 * @created 2025-03-22
 * @updated 2025-03-27
 * @phase Code Cleanup and Standardization (Phase 3)
 */

// =============================================================================
// DOM UTILITY FUNCTIONS
// =============================================================================

/**
 * Shorthand for document.querySelector with error handling
 * 
 * @param {string} selector - CSS selector
 * @param {Element} parent - Optional parent element (defaults to document)
 * @returns {Element|null} - The selected element or null if not found
 */
export const select = (selector, parent = document) => {
  try {
    return parent.querySelector(selector);
  } catch (error) {
    console.error(`Error selecting "${selector}":`, error);
    return null;
  }
};

/**
 * Shorthand for document.querySelectorAll with error handling
 * 
 * @param {string} selector - CSS selector
 * @param {Element} parent - Optional parent element (defaults to document)
 * @returns {NodeList|Array} - The selected elements or empty array if none found
 */
export const selectAll = (selector, parent = document) => {
  try {
    return parent.querySelectorAll(selector);
  } catch (error) {
    console.error(`Error selecting all "${selector}":`, error);
    return [];
  }
};

/**
 * Safely add event listener with error handling
 * 
 * @param {Element} element - The element to attach the event listener to
 * @param {string} eventType - The event type (e.g., 'click', 'submit')
 * @param {Function} handler - The event handler function
 * @param {boolean|Object} options - Optional options for addEventListener
 */
export const addEvent = (element, eventType, handler, options = false) => {
  if (!element) {
    console.warn(`Cannot add ${eventType} event to undefined element`);
    return;
  }
  
  try {
    element.addEventListener(eventType, handler, options);
  } catch (error) {
    console.error(`Error adding ${eventType} event:`, error);
  }
};

/**
 * Safely remove event listener with error handling
 * 
 * @param {Element} element - The element to remove the event listener from
 * @param {string} eventType - The event type (e.g., 'click', 'submit')
 * @param {Function} handler - The event handler function
 * @param {boolean|Object} options - Optional options for removeEventListener
 */
export const removeEvent = (element, eventType, handler, options = false) => {
  if (!element) {
    console.warn(`Cannot remove ${eventType} event from undefined element`);
    return;
  }
  
  try {
    element.removeEventListener(eventType, handler, options);
  } catch (error) {
    console.error(`Error removing ${eventType} event:`, error);
  }
};

/**
 * Detect elements that overflow their containers
 * 
 * @param {string|Element} container - CSS selector or element to check for overflow
 * @returns {Array} - Array of elements that overflow
 */
export const detectOverflowElements = (container) => {
  const containerEl = typeof container === 'string' ? select(container) : container;
  if (!containerEl) return [];
  
  const children = Array.from(containerEl.children);
  return children.filter(child => {
    const childRect = child.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    
    return (
      childRect.left < containerRect.left ||
      childRect.right > containerRect.right ||
      childRect.top < containerRect.top ||
      childRect.bottom > containerRect.bottom
    );
  });
};

// =============================================================================
// API & DATA HANDLING FUNCTIONS
// =============================================================================

/**
 * Generic error handler for async operations
 * 
 * @param {Error} error - The error object
 * @param {string} context - Optional context information
 * @param {boolean} showUser - Whether to show the error to the user
 */
export const errorHandler = (error, context = '', showUser = true) => {
  const contextMsg = context ? ` in ${context}` : '';
  console.error(`Error${contextMsg}:`, error);
  
  // If we have a UI notification system, use it here
  if (window.notify && showUser) {
    window.notify({
      type: 'error',
      message: `An error occurred${contextMsg}. Please try again.`
    });
  }
  
  // Optional: log to monitoring service
  if (window.errorMonitor) {
    window.errorMonitor.logError(error, context);
  }
};

/**
 * Async handler wrapper to simplify error handling
 * 
 * @param {Function} fn - Async function to wrap
 * @param {boolean} showUserError - Whether to show errors to the user
 * @returns {Function} - Wrapped function with error handling
 */
export const asyncHandler = (fn, showUserError = true) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error, fn.name, showUserError);
      return null;
    }
  };
};

/**
 * Debounce function to limit how often a function can be called
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit how often a function can be called
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// =============================================================================
// PRODUCT MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Get all products from the API
 * 
 * @returns {Promise<Array>} - Array of product objects
 */
export const getProducts = asyncHandler(async () => {
  const response = await fetch('/api/products');
  if (!response.ok) {
    const statusCode = response.status;
    const errorText = await response.text();
    throw new Error(`Failed to fetch products: ${statusCode} ${response.statusText} - ${errorText}`);
  }
  return await response.json();
});

/**
 * Get a specific product by ID
 * 
 * @param {string} productId - The product ID
 * @returns {Promise<Object>} - Product object
 */
export const getProduct = asyncHandler(async (productId) => {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  const response = await fetch(`/api/products/${productId}`);
  if (!response.ok) {
    const statusCode = response.status;
    const errorText = await response.text();
    throw new Error(`Failed to fetch product ${productId}: ${statusCode} ${response.statusText} - ${errorText}`);
  }
  return await response.json();
});

/**
 * Update a product
 * 
 * @param {string} productId - The product ID
 * @param {Object} data - The updated product data
 * @returns {Promise<Object>} - Updated product object
 */
export const updateProduct = asyncHandler(async (productId, data) => {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  if (!data || Object.keys(data).length === 0) {
    throw new Error('Update data is required');
  }

  const response = await fetch(`/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const statusCode = response.status;
    const errorText = await response.text();
    throw new Error(`Failed to update product ${productId}: ${statusCode} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
});

/**
 * Update product stock
 * 
 * @param {string} productId - The product ID
 * @param {number} quantity - The new stock quantity
 * @returns {Promise<Object>} - Updated product object
 */
export const updateProductStock = asyncHandler(async (productId, quantity) => {
  if (typeof quantity !== 'number' || quantity < 0) {
    throw new Error('Quantity must be a non-negative number');
  }
  
  return await updateProduct(productId, { stock: quantity });
});

/**
 * Create a new product
 * 
 * @param {Object} data - The product data
 * @returns {Promise<Object>} - New product object
 */
export const createProduct = asyncHandler(async (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Product data is required');
  }

  // Validate required fields
  const requiredFields = ['name', 'price'];
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const statusCode = response.status;
    const errorText = await response.text();
    throw new Error(`Failed to create product: ${statusCode} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
});

/**
 * Delete a product
 * 
 * @param {string} productId - The product ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteProduct = asyncHandler(async (productId) => {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  const response = await fetch(`/api/products/${productId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const statusCode = response.status;
    const errorText = await response.text();
    throw new Error(`Failed to delete product ${productId}: ${statusCode} ${response.statusText} - ${errorText}`);
  }
  
  return true;
});

// =============================================================================
// UI HELPER FUNCTIONS
// =============================================================================

/**
 * Show a testimonial in a carousel or slider
 * 
 * @param {number} index - Index of the testimonial to show
 * @param {string|Element} container - Container selector or element
 */
export const showTestimonial = (index, container) => {
  const containerEl = typeof container === 'string' ? select(container) : container;
  if (!containerEl) return;
  
  const testimonials = selectAll('.testimonial', containerEl);
  if (!testimonials.length) return;
  
  // Normalize index to handle wrapping around
  const normalizedIndex = ((index % testimonials.length) + testimonials.length) % testimonials.length;
  
  // Hide all testimonials and show the selected one
  Array.from(testimonials).forEach((testimonial, i) => {
    testimonial.classList.toggle('active', i === normalizedIndex);
  });
};

/**
 * Start an automatic rotation for sliders/carousels
 * 
 * @param {Function} showFn - Function to call on each rotation
 * @param {number} interval - Rotation interval in milliseconds
 * @param {Element} container - Container element for pause on hover
 * @returns {Object} - Control object with start, stop, and pause methods
 */
export const startRotation = (showFn, interval = 5000, container = null) => {
  let currentIndex = 0;
  let timer = null;
  let isPaused = false;
  
  const rotationFn = () => {
    currentIndex++;
    showFn(currentIndex);
  };
  
  const start = () => {
    stop();
    timer = setInterval(rotationFn, interval);
    return timer;
  };
  
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  
  const pause = () => {
    isPaused = true;
    stop();
  };
  
  const resume = () => {
    isPaused = false;
    if (!timer) start();
  };
  
  // Set up pause on hover if container is provided
  if (container) {
    addEvent(container, 'mouseenter', pause);
    addEvent(container, 'mouseleave', resume);
  }
  
  // Start immediately
  start();
  
  // Return control object
  return {
    start,
    stop,
    pause,
    resume,
    setIndex: (index) => {
      currentIndex = index;
      showFn(currentIndex);
    },
    isPaused: () => isPaused
  };
};

// =============================================================================
// DATA STORAGE HELPERS
// =============================================================================

/**
 * Initialize a data storage system
 * Using localStorage with a fallback to memory if not available
 * 
 * @param {string} namespace - Namespace for the storage
 * @returns {Object} - Storage interface
 */
export const initializeDataStorage = (namespace = 'glimmerglowapp') => {
  const useLocalStorage = (() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      console.warn('LocalStorage not available, falling back to memory storage');
      return false;
    }
  })();
  
  const memoryStorage = {};
  
  return {
    /**
     * Set an item in storage
     * 
     * @param {string} key - Key to store under
     * @param {*} value - Value to store (will be JSON stringified)
     */
    setItem: (key, value) => {
      const storageKey = `${namespace}.${key}`;
      const valueStr = JSON.stringify(value);
      
      try {
        if (useLocalStorage) {
          localStorage.setItem(storageKey, valueStr);
        } else {
          memoryStorage[storageKey] = valueStr;
        }
      } catch (error) {
        console.error(`Error storing ${key}:`, error);
      }
    },
    
    /**
     * Get an item from storage
     * 
     * @param {string} key - Key to retrieve
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} - Retrieved value
     */
    getItem: (key, defaultValue = null) => {
      const storageKey = `${namespace}.${key}`;
      let value;
      
      try {
        if (useLocalStorage) {
          value = localStorage.getItem(storageKey);
        } else {
          value = memoryStorage[storageKey];
        }
        
        if (value === null || value === undefined) {
          return defaultValue;
        }
        
        return JSON.parse(value);
      } catch (error) {
        console.error(`Error retrieving ${key}:`, error);
        return defaultValue;
      }
    },
    
    /**
     * Remove an item from storage
     * 
     * @param {string} key - Key to remove
     */
    removeItem: (key) => {
      const storageKey = `${namespace}.${key}`;
      
      try {
        if (useLocalStorage) {
          localStorage.removeItem(storageKey);
        } else {
          delete memoryStorage[storageKey];
        }
      } catch (error) {
        console.error(`Error removing ${key}:`, error);
      }
    },
    
    /**
     * Clear all items in the namespace
     */
    clear: () => {
      try {
        if (useLocalStorage) {
          // Only clear items in our namespace
          const keys = Object.keys(localStorage).filter(key => key.startsWith(`${namespace}.`));
          keys.forEach(key => localStorage.removeItem(key));
        } else {
          Object.keys(memoryStorage).forEach(key => {
            if (key.startsWith(`${namespace}.`)) {
              delete memoryStorage[key];
            }
          });
        }
      } catch (error) {
        console.error(`Error clearing storage:`, error);
      }
    }
  };
}; 