import express from 'express';
import { UserService } from '../../services/user.service.js';
import { validateUser } from '../../middleware/validation.middleware.js';
import { requirePermission, requireRoleManagement } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = express.Router();
const userService = new UserService();

// Get target user's role for role management middleware
const getTargetUserRole = async (req) => {
  const userId = req.params.id || req.body.id;
  if (!userId) return 'USER'; // Default for new users
  const user = await userService.getUserById(userId);
  return user.role;
};

// Get all users (requires read permission)
router.get('/',
  requirePermission(PERMISSIONS.USER_READ),
  asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json(users);
  })
);

// Get single user (requires read permission)
router.get('/:id',
  requirePermission(PERMISSIONS.USER_READ),
  asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  })
);

// Create new user (requires create permission and role management check)
router.post('/',
  requirePermission(PERMISSIONS.USER_CREATE),
  requireRoleManagement(getTargetUserRole),
  validateUser,
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  })
);

// Update user (requires update permission and role management check)
router.put('/:id',
  requirePermission(PERMISSIONS.USER_UPDATE),
  requireRoleManagement(getTargetUserRole),
  validateUser,
  asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  })
);

// Delete user (requires delete permission and role management check)
router.delete('/:id',
  requirePermission(PERMISSIONS.USER_DELETE),
  requireRoleManagement(getTargetUserRole),
  asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  })
);

// Update user role (requires role management permission and role hierarchy check)
router.put('/:id/role',
  requirePermission(PERMISSIONS.USER_MANAGE_ROLES),
  requireRoleManagement(getTargetUserRole),
  asyncHandler(async (req, res) => {
    const user = await userService.updateUserRole(req.params.id, req.body.role);
    res.json(user);
  })
);

// Get user activity logs (requires read permission)
router.get('/:id/activity',
  requirePermission(PERMISSIONS.USER_READ),
  asyncHandler(async (req, res) => {
    const logs = await userService.getUserActivityLogs(req.params.id);
    res.json(logs);
  })
);

export default router;
