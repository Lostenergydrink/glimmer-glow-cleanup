/**
 * utilities-node.js - Server-side utility functions for GlimmerGlow website
 * 
 * This file contains shared utility functions for Node.js server-side code.
 * These utilities are adapted from the client-side utilities.js but modified
 * for server-side use.
 * 
 * Created: 2025-03-23
 * Phase: Code Cleanup and Standardization (Phase 3)
 */

/**
 * Generic error handler for server-side operations
 * @param {Error} error - The error object
 * @param {string} context - Optional context information
 */
export const errorHandler = (error, context = '') => {
  const contextMsg = context ? ` in ${context}` : '';
  console.error(`Error${contextMsg}:`, error);
  
  // Log additional information for debugging
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  
  // Could integrate with server monitoring or logging service here
};

/**
 * Async handler wrapper to simplify error handling in async functions
 * This makes error handling more consistent across the codebase
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
export const asyncHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error, fn.name);
      throw error; // Re-throw for controller-level handling
    }
  };
};

/**
 * Retry a function with exponential backoff
 * 
 * @param {Function} fn - Function to retry
 * @param {Object} options - Options for retry behavior
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 100)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 5000)
 * @returns {Promise<any>} - Result of the function
 */
export const withRetry = async (fn, options = {}) => {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 100;
  const maxDelay = options.maxDelay || 5000;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          maxDelay,
          baseDelay * Math.pow(2, attempt) + Math.random() * 100
        );
        
        console.log(`Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Read and parse a JSON file with error handling
 * 
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<any>} - Parsed JSON data
 */
export const readJsonFile = asyncHandler(async (filePath) => {
  const fs = await import('fs/promises');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
});

/**
 * Write data to a JSON file with error handling
 * 
 * @param {string} filePath - Path to the JSON file
 * @param {any} data - Data to write
 * @param {number} indentation - Number of spaces for indentation (default: 2)
 * @returns {Promise<void>}
 */
export const writeJsonFile = asyncHandler(async (filePath, data, indentation = 2) => {
  const fs = await import('fs/promises');
  await fs.writeFile(
    filePath, 
    JSON.stringify(data, null, indentation)
  );
});

/**
 * Generate a unique identifier
 * 
 * @returns {string} - A UUID
 */
export const generateId = () => {
  const crypto = require('crypto');
  return crypto.randomUUID();
};

// Export all utilities
export default {
  errorHandler,
  asyncHandler,
  withRetry,
  readJsonFile,
  writeJsonFile,
  generateId
}; 