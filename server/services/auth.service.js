/**
 * Authentication Service - Provides standardized access to Supabase Auth
 * Centralizes all authentication operations through a single service
 */
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../../scripts/utils/utilities-node.js';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev';
const JWT_EXPIRY = '24h'; // Token expiry time
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token expiry time

// Initialize Supabase client
let supabaseClient = null;

/**
 * Authentication Service class to handle all auth operations
 * Provides a standardized interface for Supabase Auth
 */
class AuthService {
  constructor(url, key) {
    if (!url || !key) {
      throw new Error('Missing required Supabase configuration');
    }

    // Initialize the Supabase client if not already initialized
    if (!supabaseClient) {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false // Don't persist session in browser storage
        }
      });
    }

    this.supabase = supabaseClient;
  }

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response
   */
  async signUp(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      errorHandler(error, 'User signup');
      return { success: false, message: error.message };
    }
  }

  /**
   * Sign in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response with tokens
   */
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Generate tokens
      const accessToken = this.generateAccessToken(data.user);
      const refreshToken = this.generateRefreshToken(data.user);

      return {
        success: true,
        user: data.user,
        accessToken,
        refreshToken
      };
    } catch (error) {
      errorHandler(error, 'User signin');
      return { success: false, message: error.message };
    }
  }

  /**
   * Sign out a user
   * @param {string} accessToken - Access token to blacklist
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<Object>} Auth response
   */
  async signOut(accessToken, refreshToken) {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) throw error;

      // Blacklist access token if provided
      if (accessToken) {
        await this.blacklistToken(accessToken, 'logout');
      }

      // Invalidate refresh token if provided
      if (refreshToken) {
        await this.invalidateRefreshToken(refreshToken);
      }

      return { success: true };
    } catch (error) {
      errorHandler(error, 'User signout');
      return { success: false, message: error.message };
    }
  }

  /**
   * Verify a user's access token
   * @param {string} token - JWT access token
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken(token) {
    try {
      if (!token) {
        return { success: false, message: 'No token provided' };
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return { success: false, message: 'Token has been revoked' };
      }

      // Check that user still exists in Supabase
      const { data, error } = await this.supabase.auth.getUser();

      if (error || !data.user || data.user.id !== decoded.sub) {
        return { success: false, message: 'Invalid token' };
      }

      return { success: true, user: data.user };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { success: false, message: 'Token expired', expired: true };
      }
      errorHandler(error, 'Token verification');
      return { success: false, message: 'Token verification failed' };
    }
  }

  /**
   * Verify and refresh tokens using a refresh token
   * @param {string} refreshToken - Refresh token
   * @param {string} currentAccessToken - Current access token to blacklist
   * @returns {Promise<Object>} New tokens or error
   */
  async refreshTokens(refreshToken, currentAccessToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET);

      // Check that user still exists and get latest data
      const { data, error } = await this.supabase.auth.getUser();

      if (error || !data.user || data.user.id !== decoded.sub) {
        return { success: false, message: 'Invalid refresh token' };
      }

      // Check if refresh token has been invalidated
      const isInvalidated = await this.isRefreshTokenInvalidated(refreshToken);
      if (isInvalidated) {
        return { success: false, message: 'Refresh token has been invalidated' };
      }

      // Generate new tokens
      const accessToken = this.generateAccessToken(data.user);
      const newRefreshToken = this.generateRefreshToken(data.user);

      // Invalidate old refresh token
      await this.invalidateRefreshToken(refreshToken);

      // Blacklist old access token if provided
      if (currentAccessToken) {
        await this.blacklistToken(currentAccessToken, 'refresh');
      }

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
        user: data.user
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { success: false, message: 'Refresh token expired' };
      }
      errorHandler(error, 'Token refresh');
      return { success: false, message: 'Token refresh failed' };
    }
  }

  /**
   * Get the current user
   * @returns {Promise<Object>} Current user
   */
  async getCurrentUser() {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      errorHandler(error, 'Get current user');
      return { success: false, message: error.message };
    }
  }

  /**
   * Reset a user's password
   * @param {string} email - User email
   * @param {Object} options - Reset options
   * @param {string} options.redirectTo - URL to redirect to after reset
   * @param {Object} options.metadata - Additional metadata for the reset
   * @returns {Promise<Object>} Reset response
   */
  async resetPassword(email, options = {}) {
    try {
      // Check if user exists
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return { success: false, message: 'User not found' };
      }

      // Generate reset token with short expiry
      const resetToken = jwt.sign(
        {
          sub: userData.id,
          email: userData.email,
          type: 'reset'
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store reset token in database
      const { error: tokenError } = await this.supabase
        .from('password_resets')
        .insert([
          {
            user_id: userData.id,
            token: resetToken,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
            metadata: options.metadata || {}
          }
        ]);

      if (tokenError) throw tokenError;

      // Send reset email through Supabase
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: options.redirectTo
      });

      if (error) throw error;

      // Log password reset attempt
      await this.supabase
        .from('auth_events')
        .insert([
          {
            user_id: userData.id,
            event_type: 'password_reset_requested',
            metadata: {
              ip: options.metadata?.ip,
              userAgent: options.metadata?.userAgent
            }
          }
        ]);

      return { success: true };
    } catch (error) {
      errorHandler(error, 'Password reset');
      return { success: false, message: error.message };
    }
  }

  /**
   * Verify a password reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Verification result
   */
  async verifyResetToken(token) {
    try {
      // Verify token structure
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'reset') {
        return { success: false, message: 'Invalid token type' };
      }

      // Check token in database
      const { data, error } = await this.supabase
        .from('password_resets')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        return { success: false, message: 'Invalid reset token' };
      }

      // Check if token is expired
      if (new Date(data.expires_at) < new Date()) {
        return { success: false, message: 'Reset token has expired' };
      }

      // Check if token has been used
      if (data.used_at) {
        return { success: false, message: 'Reset token has already been used' };
      }

      return { success: true, userId: data.user_id };
    } catch (error) {
      errorHandler(error, 'Verify reset token');
      return { success: false, message: 'Invalid reset token' };
    }
  }

  /**
   * Update a user's password with reset token
   * @param {string} resetToken - Reset token
   * @param {string} newPassword - New password
   * @param {Object} options - Update options
   * @param {Object} options.metadata - Additional metadata for the update
   * @returns {Promise<Object>} Update response
   */
  async updatePasswordWithToken(resetToken, newPassword, options = {}) {
    try {
      // Verify reset token
      const verification = await this.verifyResetToken(resetToken);
      if (!verification.success) {
        return verification;
      }

      // Update password
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Mark token as used
      await this.supabase
        .from('password_resets')
        .update({
          used_at: new Date().toISOString()
        })
        .eq('token', resetToken);

      // Log password update
      await this.supabase
        .from('auth_events')
        .insert([
          {
            user_id: verification.userId,
            event_type: 'password_reset_completed',
            metadata: {
              ip: options.metadata?.ip,
              userAgent: options.metadata?.userAgent
            }
          }
        ]);

      // Invalidate all existing sessions
      await this.invalidateUserSessions(verification.userId);

      return { success: true };
    } catch (error) {
      errorHandler(error, 'Update password with token');
      return { success: false, message: error.message };
    }
  }

  /**
   * Update a user's password (when already authenticated)
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {Object} options - Update options
   * @param {Object} options.metadata - Additional metadata for the update
   * @returns {Promise<Object>} Update response
   */
  async updatePassword(userId, currentPassword, newPassword, options = {}) {
    try {
      // Verify current password
      const { data, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: options.email,
        password: currentPassword
      });

      if (signInError || !data?.user || data.user.id !== userId) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Update password
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Log password change
      await this.supabase
        .from('auth_events')
        .insert([
          {
            user_id: userId,
            event_type: 'password_changed',
            metadata: {
              ip: options.metadata?.ip,
              userAgent: options.metadata?.userAgent
            }
          }
        ]);

      // Invalidate all other sessions
      await this.invalidateUserSessions(userId, options.currentSessionId);

      return { success: true };
    } catch (error) {
      errorHandler(error, 'Update password');
      return { success: false, message: error.message };
    }
  }

  /**
   * Verify admin authentication using admin key
   * @param {string} adminKey - Admin key from request
   * @returns {boolean} Is authenticated admin
   */
  verifyAdminKey(adminKey) {
    // This is a fallback for the current admin key approach
    // Eventually should be replaced with proper role-based auth
    return adminKey === process.env.ADMIN_KEY;
  }

  /**
   * Generate an access token for a user
   * @param {Object} user - User object
   * @returns {string} JWT access token
   * @private
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role || 'user',
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  }

  /**
   * Generate a refresh token for a user
   * @param {Object} user - User object
   * @returns {string} JWT refresh token
   * @private
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  }

  /**
   * Check if a refresh token has been invalidated
   * @param {string} refreshToken - Refresh token to check
   * @returns {Promise<boolean>} Whether the token is invalidated
   * @private
   */
  async isRefreshTokenInvalidated(refreshToken) {
    try {
      const { data, error } = await this.supabase
        .from('invalidated_tokens')
        .select('token')
        .eq('token', refreshToken)
        .single();

      if (error) throw error;

      return !!data;
    } catch (error) {
      errorHandler(error, 'Check invalidated token');
      return true; // Fail secure - assume token is invalidated if check fails
    }
  }

  /**
   * Invalidate a refresh token
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<void>}
   * @private
   */
  async invalidateRefreshToken(refreshToken) {
    try {
      const { error } = await this.supabase
        .from('invalidated_tokens')
        .insert([
          {
            token: refreshToken,
            invalidated_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
    } catch (error) {
      errorHandler(error, 'Invalidate refresh token');
    }
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} Whether the token is blacklisted
   * @private
   */
  async isTokenBlacklisted(token) {
    try {
      const { data, error } = await this.supabase
        .from('blacklisted_tokens')
        .select('token')
        .eq('token', token)
        .single();

      if (error) throw error;

      return !!data;
    } catch (error) {
      errorHandler(error, 'Check blacklisted token');
      return true; // Fail secure - assume token is blacklisted if check fails
    }
  }

  /**
   * Add a token to the blacklist
   * @param {string} token - Token to blacklist
   * @param {string} reason - Reason for blacklisting
   * @returns {Promise<void>}
   * @private
   */
  async blacklistToken(token, reason = 'logout') {
    try {
      const { error } = await this.supabase
        .from('blacklisted_tokens')
        .insert([
          {
            token,
            reason,
            blacklisted_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
    } catch (error) {
      errorHandler(error, 'Blacklist token');
    }
  }

  /**
   * Clean up expired tokens from blacklist
   * @returns {Promise<void>}
   * @private
   */
  async cleanupBlacklistedTokens() {
    try {
      const now = new Date();
      const { error } = await this.supabase
        .from('blacklisted_tokens')
        .delete()
        .lt('blacklisted_at', new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()); // Remove tokens older than 7 days

      if (error) throw error;
    } catch (error) {
      errorHandler(error, 'Cleanup blacklisted tokens');
    }
  }

  /**
   * Clean up expired tokens from invalidated tokens table
   * @returns {Promise<void>}
   * @private
   */
  async cleanupInvalidatedTokens() {
    try {
      const now = new Date();
      const { error } = await this.supabase
        .from('invalidated_tokens')
        .delete()
        .lt('invalidated_at', new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()); // Remove tokens older than 30 days

      if (error) throw error;
    } catch (error) {
      errorHandler(error, 'Cleanup invalidated tokens');
    }
  }

  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   * @param {string} [excludeSessionId] - Session ID to exclude from invalidation
   * @returns {Promise<void>}
   * @private
   */
  async invalidateUserSessions(userId, excludeSessionId = null) {
    try {
      // Get all active sessions for user
      const { data: sessions, error: sessionsError } = await this.supabase
        .from('user_sessions')
        .select('id, refresh_token, access_token')
        .eq('user_id', userId)
        .neq('id', excludeSessionId || '')
        .is('ended_at', null);

      if (sessionsError) throw sessionsError;

      // Blacklist all access tokens
      for (const session of sessions) {
        if (session.access_token) {
          await this.blacklistToken(session.access_token, 'password_change');
        }
        if (session.refresh_token) {
          await this.invalidateRefreshToken(session.refresh_token);
        }
      }

      // Mark sessions as ended
      await this.supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          end_reason: 'password_change'
        })
        .eq('user_id', userId)
        .neq('id', excludeSessionId || '');
    } catch (error) {
      errorHandler(error, 'Invalidate user sessions');
    }
  }
}

// Export singleton instance
export default AuthService;