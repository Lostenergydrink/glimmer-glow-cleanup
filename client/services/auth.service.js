/**
 * Auth Service
 * 
 * Handles all authentication-related API calls to the server,
 * including login, logout, registration, and authentication status.
 */

import { apiService } from './api.service.js';

// Token refresh configuration
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const TOKEN_STORAGE_KEY = 'auth_tokens';

class AuthService {
  constructor() {
    this.apiBase = '/api/auth';
    this.currentUser = null;
    this.isAuthenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.refreshTimeout = null;
    
    // Initialize from secure storage if available
    this.loadTokensFromStorage();
    
    // Set up token refresh mechanism
    if (this.accessToken && this.tokenExpiry) {
      this.scheduleTokenRefresh();
    }
    
    // Listen for auth events
    window.addEventListener('auth:unauthenticated', () => {
      this.handleUnauthenticated();
    });
  }

  /**
   * Load tokens from secure storage
   * @private
   */
  loadTokensFromStorage() {
    try {
      const tokenData = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (tokenData) {
        const { accessToken, refreshToken, expiry, user } = JSON.parse(tokenData);
        
        // Only restore if not expired
        if (expiry && new Date(expiry) > new Date()) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          this.tokenExpiry = new Date(expiry);
          this.currentUser = user;
          this.isAuthenticated = true;
          
          // Set authorization header for all future requests
          apiService.setAuthHeader(`Bearer ${this.accessToken}`);
        } else {
          // Clear expired tokens
          this.clearTokens();
        }
      }
    } catch (error) {
      console.error('Error loading auth tokens:', error);
      this.clearTokens();
    }
  }

  /**
   * Save tokens to secure storage
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {Date} expiry - Token expiry date
   * @param {Object} user - User data
   * @private
   */
  saveTokensToStorage(accessToken, refreshToken, expiry, user) {
    try {
      const tokenData = JSON.stringify({
        accessToken,
        refreshToken,
        expiry: expiry.toISOString(),
        user
      });
      
      sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenData);
    } catch (error) {
      console.error('Error saving auth tokens:', error);
    }
  }

  /**
   * Clear tokens from storage and memory
   * @private
   */
  clearTokens() {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.currentUser = null;
      this.isAuthenticated = false;
      
      // Clear auth header
      apiService.clearAuthHeader();
      
      // Clear any scheduled refresh
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }

  /**
   * Schedule token refresh before expiry
   * @private
   */
  scheduleTokenRefresh() {
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    if (!this.tokenExpiry) return;
    
    const now = new Date();
    const expiresAt = new Date(this.tokenExpiry);
    
    // Calculate time until refresh (5 minutes before expiry)
    const timeUntilRefresh = Math.max(0, expiresAt.getTime() - now.getTime() - TOKEN_REFRESH_THRESHOLD);
    
    // Schedule refresh
    this.refreshTimeout = setTimeout(() => {
      this.refreshAccessToken();
    }, timeUntilRefresh);
  }

  /**
   * Refresh the access token using refresh token
   * @returns {Promise<boolean>} Refresh success
   * @private
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        return false;
      }
      
      const response = await apiService.post(`${this.apiBase}/refresh-token`, {
        refreshToken: this.refreshToken
      });
      
      if (response.success) {
        // Update tokens
        this.accessToken = response.accessToken;
        this.refreshToken = response.refreshToken;
        this.tokenExpiry = new Date(Date.now() + response.expiresIn * 1000);
        this.currentUser = response.user;
        this.isAuthenticated = true;
        
        // Update auth header
        apiService.setAuthHeader(`Bearer ${this.accessToken}`);
        
        // Save to storage
        this.saveTokensToStorage(
          this.accessToken,
          this.refreshToken,
          this.tokenExpiry,
          this.currentUser
        );
        
        // Schedule next refresh
        this.scheduleTokenRefresh();
        
        return true;
      }
      
      // If refresh failed, clear tokens and redirect to login
      this.clearTokens();
      this.handleUnauthenticated();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      this.handleUnauthenticated();
      return false;
    }
  }

  /**
   * Handle unauthenticated event
   * @private
   */
  handleUnauthenticated() {
    this.clearTokens();
    
    // Redirect to login page if not already there
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }

  /**
   * Check authentication status
   * @returns {Promise<Object>} Authentication status
   */
  async checkAuthStatus() {
    try {
      // If we have a valid token, use it
      if (this.accessToken && this.tokenExpiry && new Date(this.tokenExpiry) > new Date()) {
        return {
          isAuthenticated: true,
          userId: this.currentUser?.id,
          user: this.currentUser
        };
      }
      
      // Otherwise check with server
      const response = await apiService.get(`${this.apiBase}/status`);
      this.isAuthenticated = response.isAuthenticated;
      this.currentUser = response.user || null;
      
      return {
        isAuthenticated: this.isAuthenticated,
        userId: this.currentUser?.id,
        user: this.currentUser
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated = false;
      this.currentUser = null;
      return {
        isAuthenticated: false,
        userId: null,
        user: null
      };
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async login(email, password) {
    try {
      // Ensure CSRF token is available
      await apiService.ensureCsrfToken();
      
      const response = await apiService.post(`${this.apiBase}/login`, {
        email,
        password
      });
      
      if (response.success) {
        // Store tokens
        this.accessToken = response.token;
        this.refreshToken = response.refreshToken;
        this.tokenExpiry = new Date(Date.now() + response.expiresIn * 1000);
        this.currentUser = response.user;
        this.isAuthenticated = true;
        
        // Set auth header for future requests
        apiService.setAuthHeader(`Bearer ${this.accessToken}`);
        
        // Save to storage
        this.saveTokensToStorage(
          this.accessToken,
          this.refreshToken,
          this.tokenExpiry,
          this.currentUser
        );
        
        // Schedule token refresh
        this.scheduleTokenRefresh();
        
        return {
          success: true,
          user: response.user
        };
      }
      
      return {
        success: false,
        message: response.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred during login'
      };
    }
  }

  /**
   * Logout user
   * @returns {Promise<boolean>} Logout success
   */
  async logout() {
    try {
      // Only call API if we have a token
      if (this.accessToken) {
        await apiService.post(`${this.apiBase}/logout`, {
          refreshToken: this.refreshToken
        });
      }
      
      // Clear tokens regardless of API call result
      this.clearTokens();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear tokens on error
      this.clearTokens();
      return true;
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      // Ensure CSRF token is available
      await apiService.ensureCsrfToken();
      
      const response = await apiService.post(`${this.apiBase}/register`, userData);
      
      if (response.success) {
        return {
          success: true,
          message: 'Registration successful'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred during registration'
      };
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request result
   */
  async requestPasswordReset(email) {
    try {
      // Ensure CSRF token is available
      await apiService.ensureCsrfToken();
      
      const response = await apiService.post(`${this.apiBase}/reset-password`, { email });
      return {
        success: true,
        message: 'Password reset instructions sent to your email'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send password reset'
      };
    }
  }

  /**
   * Complete password reset
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Reset result
   */
  async completePasswordReset(token, password) {
    try {
      // Ensure CSRF token is available
      await apiService.ensureCsrfToken();
      
      const response = await apiService.post(`${this.apiBase}/reset-password/complete`, {
        token,
        password
      });
      
      return {
        success: true,
        message: 'Password successfully reset'
      };
    } catch (error) {
      console.error('Password reset completion error:', error);
      return {
        success: false,
        message: error.message || 'Failed to reset password'
      };
    }
  }
}

// Export a singleton instance
const authService = new AuthService();
export { authService }; 