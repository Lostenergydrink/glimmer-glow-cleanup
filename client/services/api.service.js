/**
 * API Service
 * 
 * Provides a standard interface for making API requests to the server.
 * Handles common functionality like error handling, retries, and CSRF token management.
 */

class ApiService {
  constructor() {
    this.csrfToken = null;
    this.pendingRequests = new Map();
  }

  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(url, options = {}) {
    return this.request(url, { 
      method: 'GET',
      ...options
    });
  }

  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {Object|FormData} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: this.prepareBody(data),
      ...options
    });
  }

  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {Object|FormData} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body: this.prepareBody(data),
      ...options
    });
  }

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(url, options = {}) {
    return this.request(url, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Make a request with retry functionality
   * @param {string} url - API endpoint
   * @param {Object} options - Request options
   * @param {number} retries - Number of retries
   * @returns {Promise<Object>} Response data
   */
  async request(url, options = {}, retries = 3) {
    const requestKey = `${options.method || 'GET'}-${url}-${Date.now()}`;
    
    try {
      // Setup new request
      const controller = new AbortController();
      this.pendingRequests.set(requestKey, controller);
      options.signal = controller.signal;

      // Ensure credentials and headers
      options.credentials = 'same-origin';
      options.headers = {
        ...options.headers
      };

      // Add content type for JSON requests
      if (!(options.body instanceof FormData) && options.body && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }

      // Add CSRF token if available
      if (this.csrfToken) {
        options.headers['CSRF-Token'] = this.csrfToken;
      }

      const response = await fetch(url, options);
      
      // Handle 401 unauthorized
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthenticated'));
        return null;
      }

      // Update CSRF token if present
      const newToken = response.headers.get('CSRF-Token');
      if (newToken) {
        this.csrfToken = newToken;
      }

      // Handle 304 Not Modified
      if (response.status === 304) {
        return { notModified: true };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => {
          return { message: 'Unknown error' };
        });
        throw new Error(errorData.message || 'API request failed');
      }

      // Parse JSON response
      const data = await response.json().catch(() => ({}));
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted:', requestKey);
        return null;
      }

      if (retries > 0 && !options.signal?.aborted) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(url, options, retries - 1);
      }

      console.error(`API Error (${url}):`, error);
      throw error;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Prepare request body based on data type
   * @param {Object|FormData} data - Request body data
   * @returns {string|FormData} Prepared body
   */
  prepareBody(data) {
    if (data instanceof FormData) {
      return data;
    }
    
    return JSON.stringify(data);
  }

  /**
   * Ensure CSRF token is available
   * @returns {Promise<string>} CSRF token
   */
  async ensureCsrfToken() {
    if (!this.csrfToken) {
      const response = await this.get('/api/csrf-token');
      if (response?.csrfToken) {
        this.csrfToken = response.csrfToken;
      }
    }
    return this.csrfToken;
  }
}

// Export singleton instance
const apiService = new ApiService();
export { apiService }; 