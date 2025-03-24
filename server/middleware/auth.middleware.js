/**
 * Authentication Middleware
 * Provides middleware functions to secure API endpoints
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';
import AuthService from '../services/auth.service.js';
import { errorHandler } from '../../scripts/utils/utilities-node.js';

// Initialize auth service
const authService = new AuthService(SUPABASE_URL, SUPABASE_ANON_KEY);

// Role hierarchy definition
const ROLE_HIERARCHY = {
  admin: ['admin', 'manager', 'user'],
  manager: ['manager', 'user'],
  user: ['user']
};

/**
 * Check if a role has permission over another role
 * @param {string} userRole - The role of the user making the request
 * @param {string} requiredRole - The role required for the action
 * @returns {boolean} Whether the user role has permission
 */
const hasRolePermission = (userRole, requiredRole) => {
  if (!ROLE_HIERARCHY[userRole]) return false;
  return ROLE_HIERARCHY[userRole].includes(requiredRole);
};

/**
 * Middleware to authenticate users with JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.verifyToken(token);

    if (!result.success) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request object
    req.user = result.user;
    next();
  } catch (error) {
    errorHandler(error, 'User authentication middleware');
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to authenticate admin with JWT token or admin key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateAdmin = async (req, res, next) => {
  try {
    // First check for admin key in cookies (legacy method)
    const adminKey = req.cookies.adminKey;
    if (adminKey && authService.verifyAdminKey(adminKey)) {
      req.isAdmin = true;
      req.user = { role: 'admin' }; // Set role for consistency
      return next();
    }

    // Next check for JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.verifyToken(token);

    if (!result.success) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user has admin role
    const user = result.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    // Attach user to request object
    req.user = user;
    req.isAdmin = true;
    next();
  } catch (error) {
    errorHandler(error, 'Admin authentication middleware');
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware - doesn't require auth but attaches user if present
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuthentication = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.verifyToken(token);

    if (result.success) {
      // Attach user to request object if valid
      req.user = result.user;
    }

    next();
  } catch (error) {
    // Continue without authentication in case of error
    next();
  }
};

/**
 * Role-based access control middleware
 * @param {string|string[]} requiredRoles - Required role(s) for the route
 * @returns {Function} Middleware function
 */
export const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRole = req.user.role;
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // Check if user's role has permission for any of the required roles
      const hasPermission = roles.some(role => hasRolePermission(userRole, role));

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: roles,
          current: userRole
        });
      }

      next();
    } catch (error) {
      errorHandler(error, 'Role-based access control middleware');
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

/**
 * Resource ownership middleware
 * @param {Function} getResourceOwner - Function to get the owner ID of the resource
 * @returns {Function} Middleware function
 */
export const requireOwnership = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Admin and managers can bypass ownership check
      if (hasRolePermission(req.user.role, 'manager')) {
        return next();
      }

      const ownerId = await getResourceOwner(req);

      if (ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Resource access denied' });
      }

      next();
    } catch (error) {
      errorHandler(error, 'Resource ownership middleware');
      return res.status(500).json({ error: 'Ownership check failed' });
    }
  };
};
