import { hasPermission, hasAllPermissions, hasAnyPermission } from '../config/permissions.js';
import { AuthError } from '../utils/errors.js';

/**
 * Middleware factory to check if user has required permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AuthError('Authentication required');
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new AuthError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware factory to check if user has all required permissions
 * @param {string[]} permissions - Array of required permissions
 * @returns {Function} Express middleware
 */
export const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AuthError('Authentication required');
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      throw new AuthError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware factory to check if user has any of the required permissions
 * @param {string[]} permissions - Array of permissions (any one required)
 * @returns {Function} Express middleware
 */
export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AuthError('Authentication required');
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      throw new AuthError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware to check if user can manage the target user's role
 * @param {Function} getUserRole - Function to get target user's role from request
 * @returns {Function} Express middleware
 */
export const requireRoleManagement = (getUserRole) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AuthError('Authentication required');
    }

    const targetRole = await getUserRole(req);

    // Admin can manage all roles
    if (req.user.role.toUpperCase() === 'ADMIN') {
      return next();
    }

    // Manager can manage staff and users
    if (req.user.role.toUpperCase() === 'MANAGER' &&
      ['STAFF', 'USER'].includes(targetRole.toUpperCase())) {
      return next();
    }

    // Staff can only manage users
    if (req.user.role.toUpperCase() === 'STAFF' &&
      targetRole.toUpperCase() === 'USER') {
      return next();
    }

    throw new AuthError('Insufficient permissions to manage this role');
  };
};

/**
 * Middleware to check if user owns the resource or has admin rights
 * @param {Function} getResourceUserId - Function to get resource owner's user ID from request
 * @returns {Function} Express middleware
 */
export const requireOwnershipOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AuthError('Authentication required');
    }

    // Admins can access any resource
    if (req.user.role.toUpperCase() === 'ADMIN') {
      return next();
    }

    const resourceUserId = await getResourceUserId(req);

    // Check if user owns the resource
    if (req.user.id === resourceUserId) {
      return next();
    }

    throw new AuthError('Access denied: you do not own this resource');
  };
};

/**
 * Middleware to check if user has sufficient role level
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AuthError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role.toUpperCase())) {
      throw new AuthError('Insufficient role level');
    }

    next();
  };
};
