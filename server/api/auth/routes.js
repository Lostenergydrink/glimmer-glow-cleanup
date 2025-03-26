/**
 * Authentication API Routes
 * Handles user authentication and authorization
 */
import express from 'express';
import services from '../../services/index.js';
import { authenticateUser, csrfProtection, generateCsrfToken } from '../../middleware/auth.middleware.js';
import { asyncHandler, errorHandler } from '../../../scripts/utils/utilities-node.js';

const router = express.Router();

// Apply CSRF protection to all routes
router.use(csrfProtection);

// Generate CSRF token for all responses
router.use(generateCsrfToken);

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post('/signup', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Password requirements
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  const result = await services.auth().signUp(email, password, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    redirectUrl: req.body.redirectUrl
  });
  
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  res.status(201).json({ success: true, message: 'User registered successfully' });
}));

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const result = await services.auth().signIn(email, password, {
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  if (!result.success) {
    return res.status(401).json({ error: result.message });
  }
  
  // Set cookie for non-browser clients
  res.cookie('authToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Get token expiry time
  const expiresIn = 3600; // 1 hour in seconds
  
  res.json({
    success: true,
    message: 'Login successful',
    token: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: expiresIn,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role || 'user'
    }
  });
}));

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  // Get current access token if available
  let currentAccessToken = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    currentAccessToken = authHeader.split(' ')[1];
  }
  
  const result = await services.auth().refreshTokens(refreshToken, currentAccessToken, {
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  if (!result.success) {
    return res.status(401).json({ error: result.message || 'Token refresh failed' });
  }
  
  // Get token expiry time
  const expiresIn = 3600; // 1 hour in seconds
  
  res.json({
    success: true,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: expiresIn,
    user: result.user
  });
}));

/**
 * @route POST /api/auth/logout
 * @desc Logout a user
 * @access Private
 */
router.post('/logout', authenticateUser, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  // Get current access token
  let accessToken = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.split(' ')[1];
  }
  
  const result = await services.auth().signOut(accessToken, refreshToken);
  
  // Clear auth cookie
  res.clearCookie('authToken');
  
  res.json({ success: true, message: 'Logout successful' });
}));

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateUser, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role || 'user'
    }
  });
}));

/**
 * @route GET /api/auth/status
 * @desc Check authentication status
 * @access Public
 */
router.get('/status', asyncHandler(async (req, res) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
      isAuthenticated: false,
      user: null
    });
  }

  const token = authHeader.split(' ')[1];
  const result = await services.auth().verifyToken(token);

  if (!result.success) {
    return res.json({
      isAuthenticated: false,
      user: null
    });
  }

  res.json({
    isAuthenticated: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role || 'user'
    }
  });
}));

/**
 * @route POST /api/auth/reset-password
 * @desc Request password reset
 * @access Public
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const result = await services.auth().resetPassword(email, {
    redirectTo: req.body.redirectUrl,
    metadata: {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  });
  
  // Always return success to prevent email enumeration
  res.json({ success: true, message: 'If the email exists, a password reset link has been sent' });
}));

/**
 * @route POST /api/auth/reset-password/complete
 * @desc Complete password reset with token
 * @access Public
 */
router.post('/reset-password/complete', asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  const result = await services.auth().updatePasswordWithToken(token, password, {
    metadata: {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  });
  
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  res.json({ success: true, message: 'Password updated successfully' });
}));

/**
 * @route POST /api/auth/update-password
 * @desc Update password (when already authenticated)
 * @access Private
 */
router.post('/update-password', authenticateUser, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  const result = await services.auth().updatePassword(
    req.user.id,
    currentPassword,
    newPassword,
    {
      email: req.user.email,
      currentSessionId: req.tokenData?.jti,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    }
  );
  
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  res.json({ success: true, message: 'Password updated successfully' });
}));

/**
 * @route GET /api/auth/csrf-token
 * @desc Get a CSRF token
 * @access Public
 */
router.get('/csrf-token', (req, res) => {
  res.json({ 
    success: true,
    csrfToken: res.locals.csrfToken 
  });
});

// Legacy admin login for backwards compatibility
router.post('/admin/login', asyncHandler(async (req, res) => {
  const { adminKey } = req.body;
  
  if (!adminKey) {
    return res.status(400).json({ error: 'Admin key is required' });
  }
  
  const isValid = services.auth().verifyAdminKey(adminKey);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  
  // Set admin cookie
  res.cookie('adminKey', adminKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.json({ success: true });
}));

export default router; 