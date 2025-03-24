/**
 * Authentication Middleware Tests
 */
import {
  authenticateUser,
  authenticateAdmin,
  optionalAuthentication,
  requireRole,
  requireOwnership
} from '../../server/middleware/auth.middleware.js';
import AuthService from '../../server/services/auth.service.js';

// Mock AuthService
jest.mock('../../server/services/auth.service.js');

describe('Authentication Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request mock
    mockReq = {
      headers: {},
      cookies: {}
    };

    // Setup response mock
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Setup next function mock
    mockNext = jest.fn();
  });

  describe('authenticateUser', () => {
    it('should authenticate valid JWT token', async () => {
      // Setup
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      mockReq.headers.authorization = 'Bearer valid-token';
      AuthService.prototype.verifyToken.mockResolvedValue({
        success: true,
        user: mockUser
      });

      // Execute
      await authenticateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      // Execute
      await authenticateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      // Setup
      mockReq.headers.authorization = 'Bearer invalid-token';
      AuthService.prototype.verifyToken.mockResolvedValue({
        success: false
      });

      // Execute
      await authenticateUser(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authenticateAdmin', () => {
    it('should authenticate admin with valid JWT token', async () => {
      // Setup
      const mockAdmin = { id: 1, email: 'admin@example.com', role: 'admin' };
      mockReq.headers.authorization = 'Bearer valid-admin-token';
      AuthService.prototype.verifyToken.mockResolvedValue({
        success: true,
        user: mockAdmin
      });

      // Execute
      await authenticateAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.user).toEqual(mockAdmin);
      expect(mockReq.isAdmin).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate admin with valid admin key', async () => {
      // Setup
      mockReq.cookies.adminKey = 'valid-admin-key';
      AuthService.prototype.verifyAdminKey.mockReturnValue(true);

      // Execute
      await authenticateAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.isAdmin).toBe(true);
      expect(mockReq.user.role).toBe('admin');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-admin user', async () => {
      // Setup
      const mockUser = { id: 1, email: 'user@example.com', role: 'user' };
      mockReq.headers.authorization = 'Bearer valid-user-token';
      AuthService.prototype.verifyToken.mockResolvedValue({
        success: true,
        user: mockUser
      });

      // Execute
      await authenticateAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Admin privileges required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthentication', () => {
    it('should attach user if valid token provided', async () => {
      // Setup
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      mockReq.headers.authorization = 'Bearer valid-token';
      AuthService.prototype.verifyToken.mockResolvedValue({
        success: true,
        user: mockUser
      });

      // Execute
      await optionalAuthentication(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user if no token provided', async () => {
      // Execute
      await optionalAuthentication(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockReq.user = { id: 1, email: 'test@example.com', role: 'user' };
    });

    it('should allow access if user has required role', async () => {
      // Setup
      const middleware = requireRole('user');

      // Execute
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access if user has higher role', async () => {
      // Setup
      mockReq.user.role = 'admin';
      const middleware = requireRole('user');

      // Execute
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access if user has insufficient role', async () => {
      // Setup
      const middleware = requireRole('admin');

      // Execute
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: ['admin'],
        current: 'user'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple required roles', async () => {
      // Setup
      mockReq.user.role = 'manager';
      const middleware = requireRole(['admin', 'manager']);

      // Execute
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    beforeEach(() => {
      mockReq.user = { id: 1, email: 'test@example.com', role: 'user' };
    });

    it('should allow access if user owns the resource', async () => {
      // Setup
      const getResourceOwner = jest.fn().mockResolvedValue(1);
      const middleware = requireOwnership(getResourceOwner);

      // Execute
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access if user is admin', async () => {
      // Setup
      mockReq.user.role = 'admin';
      const getResourceOwner = jest.fn().mockResolvedValue(2);
      const middleware = requireOwnership(getResourceOwner);

      // Execute
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(getResourceOwner).not.toHaveBeenCalled();
    });

    it('should deny access if user does not own the resource', async () => {
      // Setup
      const getResourceOwner = jest.fn().mockResolvedValue(2);
      const middleware = requireOwnership(getResourceOwner);

      // Execute
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Resource access denied'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
