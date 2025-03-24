/**
 * Auth Service
 * 
 * Handles all authentication-related API calls to the server,
 * including login, logout, registration, and authentication status.
 */

import { apiService } from './api.service.js';

class AuthService {
  constructor() {
    this.apiBase = '/api/auth';
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  /**
   * Check authentication status
   * @returns {Promise<Object>} Authentication status
   */
  async checkAuthStatus() {
    try {
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
      const response = await apiService.post(`${this.apiBase}/login`, {
        email,
        password
      });
      
      if (response.success) {
        this.isAuthenticated = true;
        this.currentUser = response.user;
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
      await apiService.post(`${this.apiBase}/logout`);
      this.isAuthenticated = false;
      this.currentUser = null;
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
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