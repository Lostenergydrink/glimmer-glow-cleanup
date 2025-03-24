/**
 * Authentication API Routes
 * Handles user authentication and authorization
 */
import express from 'express';
import services from '../../services/index.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { asyncHandler, errorHandler } from '../../../scripts/utils/utilities-node.js';

const router = express.Router();

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
  
  const result = await services.auth().signUp(email, password);
  
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  res.status(201).json({ message: 'User registered successfully' });
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
  
  const result = await services.auth().signIn(email, password);
  
  if (!result.success) {
    return res.status(401).json({ error: result.message });
  }
  
  // Set cookie for non-browser clients
  res.cookie('authToken', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({
    message: 'Login successful',
    token: result.token,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role || 'user'
    }
  });
}));

/**
 * @route POST /api/auth/logout
 * @desc Logout a user
 * @access Private
 */
router.post('/logout', authenticateUser, asyncHandler(async (req, res) => {
  const result = await services.auth().signOut();
  
  // Clear auth cookie
  res.clearCookie('authToken');
  
  res.json({ message: 'Logout successful' });
}));

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateUser, asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role || 'user'
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
  
  const result = await services.auth().resetPassword(email);
  
  // Always return success to prevent email enumeration
  res.json({ message: 'If the email exists, a password reset link has been sent' });
}));

/**
 * @route POST /api/auth/update-password
 * @desc Update password (after reset or while logged in)
 * @access Private
 */
router.post('/update-password', authenticateUser, asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'New password is required' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  const result = await services.auth().updatePassword(password);
  
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  res.json({ message: 'Password updated successfully' });
}));

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