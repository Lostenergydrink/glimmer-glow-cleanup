/**
 * Permissions Configuration
 * Defines role-based access control rules for the application
 */

// Permission definitions
export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // Product management
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_MANAGE_CATEGORIES: 'product:manage_categories',

  // Order management
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_REFUND: 'order:refund',
  ORDER_CANCEL: 'order:cancel',

  // Gallery management
  GALLERY_CREATE: 'gallery:create',
  GALLERY_READ: 'gallery:read',
  GALLERY_UPDATE: 'gallery:update',
  GALLERY_DELETE: 'gallery:delete',

  // Event management
  EVENT_CREATE: 'event:create',
  EVENT_READ: 'event:read',
  EVENT_UPDATE: 'event:update',
  EVENT_DELETE: 'event:delete',

  // Settings management
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Analytics & reporting
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_VIEW: 'reports:view',
  AUDIT_LOGS_VIEW: 'audit_logs:view',

  // System management
  SYSTEM_HEALTH_VIEW: 'system:health_view',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_RESTORE: 'system:restore'
};

// Role definitions with associated permissions
export const ROLES = {
  ADMIN: {
    name: 'admin',
    description: 'Full system access',
    permissions: Object.values(PERMISSIONS)
  },

  MANAGER: {
    name: 'manager',
    description: 'Store management access',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.PRODUCT_UPDATE,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.PRODUCT_MANAGE_CATEGORIES,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_REFUND,
      PERMISSIONS.ORDER_CANCEL,
      PERMISSIONS.GALLERY_CREATE,
      PERMISSIONS.GALLERY_READ,
      PERMISSIONS.GALLERY_UPDATE,
      PERMISSIONS.GALLERY_DELETE,
      PERMISSIONS.EVENT_CREATE,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_UPDATE,
      PERMISSIONS.EVENT_DELETE,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.REPORTS_VIEW
    ]
  },

  STAFF: {
    name: 'staff',
    description: 'Basic store operations access',
    permissions: [
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.PRODUCT_UPDATE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.GALLERY_READ,
      PERMISSIONS.EVENT_READ,
      PERMISSIONS.EVENT_UPDATE,
      PERMISSIONS.SETTINGS_READ
    ]
  },

  USER: {
    name: 'user',
    description: 'Standard user access',
    permissions: [
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.GALLERY_READ,
      PERMISSIONS.EVENT_READ
    ]
  }
};

/**
 * Check if a role has a specific permission
 * @param {string} role - Role name
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether the role has the permission
 */
export const hasPermission = (role, permission) => {
  const roleConfig = ROLES[role.toUpperCase()];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
};

/**
 * Get all permissions for a role
 * @param {string} role - Role name
 * @returns {string[]} Array of permissions
 */
export const getRolePermissions = (role) => {
  const roleConfig = ROLES[role.toUpperCase()];
  return roleConfig ? roleConfig.permissions : [];
};

/**
 * Check if a role has all specified permissions
 * @param {string} role - Role name
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether the role has all permissions
 */
export const hasAllPermissions = (role, permissions) => {
  const roleConfig = ROLES[role.toUpperCase()];
  if (!roleConfig) return false;
  return permissions.every(permission => roleConfig.permissions.includes(permission));
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - Role name
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether the role has any of the permissions
 */
export const hasAnyPermission = (role, permissions) => {
  const roleConfig = ROLES[role.toUpperCase()];
  if (!roleConfig) return false;
  return permissions.some(permission => roleConfig.permissions.includes(permission));
};

/**
 * Get role hierarchy (roles that can be managed by this role)
 * @param {string} role - Role name
 * @returns {string[]} Array of manageable role names
 */
export const getManageableRoles = (role) => {
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return ['MANAGER', 'STAFF', 'USER'];
    case 'MANAGER':
      return ['STAFF', 'USER'];
    case 'STAFF':
      return ['USER'];
    default:
      return [];
  }
};
