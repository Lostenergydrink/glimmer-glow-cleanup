/**
 * Admin User Management Routes
 * --------------------------
 * Provides endpoints for managing users in the admin panel:
 * - List users
 * - Get user details
 * - Create user
 * - Update user
 * - Delete user
 * - Change user roles
 * - Update user status
 */

import express from 'express';
import { authenticateJWT, requirePermission } from '../../auth/middleware/auth.middleware.js';
import * as validation from '../../middleware/validation.middleware.js';
import * as auditLog from '../../services/audit-log.service.js';
import * as userService from '../../services/user.service.js';

const router = express.Router();

// Apply authentication to all routes in this router
router.use(authenticateJWT);

// Helper middleware to log admin user management actions
const logUserAction = (action) => {
  return async (req, res, next) => {
    try {
      await auditLog.recordAdminAction(req.user.id, action, {
        ip: req.ip,
        method: req.method,
        path: req.path,
        targetUserId: req.params.id || req.body.id || null,
        targetEmail: req.body.email || null
      });
      next();
    } catch (error) {
      console.error('Failed to log user action:', error);
      next(); // Continue even if logging fails
    }
  };
};

// Get all users with pagination and filtering
router.get('/',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      const { search, role, status, page = 1, limit = 20 } = req.query;
      
      const filters = {
        search,
        role,
        status
      };
      
      const users = await userService.listUsers(filters, page, limit);
      
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
});

// Get user by ID
router.get('/:id',
  requirePermission('admin:read'),
  validation.validateParams({
    id: validation.string().required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
});

// Create new user
router.post('/',
  requirePermission('admin:write'),
  logUserAction('create_user'),
  validation.validateBody({
    email: validation.string().email().required(),
    password: validation.string().min(8).required(),
    displayName: validation.string().optional(),
    firstName: validation.string().optional(),
    lastName: validation.string().optional(),
    role: validation.string().valid('user', 'admin', 'editor').default('user'),
    status: validation.string().valid('active', 'inactive', 'suspended').default('active')
  }),
  async (req, res) => {
    try {
      const userData = {
        email: req.body.email,
        password: req.body.password,
        displayName: req.body.displayName || req.body.email.split('@')[0],
        firstName: req.body.firstName || '',
        lastName: req.body.lastName || '',
        role: req.body.role || 'user',
        status: req.body.status || 'active'
      };
      
      const newUser = await userService.createUser(userData);
      
      // Remove sensitive information
      delete newUser.password;
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      
      res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/:id',
  requirePermission('admin:write'),
  logUserAction('update_user'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    email: validation.string().email().optional(),
    displayName: validation.string().optional(),
    firstName: validation.string().optional(),
    lastName: validation.string().optional(),
    role: validation.string().valid('user', 'admin', 'editor').optional(),
    status: validation.string().valid('active', 'inactive', 'suspended').optional()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get existing user to make sure they exist
      const existingUser = await userService.getUserById(id);
      
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update user
      const updatedUser = await userService.updateUser(id, req.body);
      
      // Remove sensitive information
      delete updatedUser.password;
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'Email already in use by another user' });
      }
      
      res.status(500).json({ error: 'Failed to update user' });
    }
});

// Change user password
router.patch('/:id/password',
  requirePermission('admin:write'),
  logUserAction('reset_user_password'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    password: validation.string().min(8).required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      // Check if user exists
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update password
      await userService.updateUserPassword(id, password);
      
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
});

// Delete user
router.delete('/:id',
  requirePermission('admin:write'),
  logUserAction('delete_user'),
  validation.validateParams({
    id: validation.string().required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if trying to delete themselves
      if (id === req.user.id) {
        return res.status(403).json({ error: 'You cannot delete your own account' });
      }
      
      // Delete user
      await userService.deleteUser(id);
      
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Change user role
router.patch('/:id/role',
  requirePermission('admin:write'),
  logUserAction('change_user_role'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    role: validation.string().valid('user', 'admin', 'editor').required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      // Check if user exists
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update role
      const updatedUser = await userService.updateUserRole(id, role);
      
      res.json({
        success: true,
        message: `User role updated to ${role}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Change user status
router.patch('/:id/status',
  requirePermission('admin:write'),
  logUserAction('change_user_status'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    status: validation.string().valid('active', 'inactive', 'suspended').required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Check if user exists
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if trying to suspend themselves
      if (id === req.user.id) {
        return res.status(403).json({ error: 'You cannot change your own status' });
      }
      
      // Update status
      const updatedUser = await userService.updateUserStatus(id, status);
      
      res.json({
        success: true,
        message: `User status updated to ${status}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          status: updatedUser.status
        }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
});

export default router; 