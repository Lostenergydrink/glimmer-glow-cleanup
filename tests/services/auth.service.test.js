/**
 * Auth Service Tests
 */
import jwt from 'jsonwebtoken';
import AuthService from '../../server/services/auth.service.js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn()
  }))
}));

describe('AuthService', () => {
  let authService;
  let mockSupabase;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    role: 'user'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize auth service
    authService = new AuthService('test-url', 'test-key');
    mockSupabase = authService.supabase;
  });

  describe('signIn', () => {
    it('should sign in user and return tokens', async () => {
      // Setup
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Execute
      const result = await authService.signIn('test@example.com', 'password');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify token contents
      const decodedAccess = jwt.verify(result.accessToken, process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev');
      expect(decodedAccess.sub).toBe(mockUser.id);
      expect(decodedAccess.type).toBe('access');

      const decodedRefresh = jwt.verify(result.refreshToken, process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev');
      expect(decodedRefresh.sub).toBe(mockUser.id);
      expect(decodedRefresh.type).toBe('refresh');
    });

    it('should handle sign in errors', async () => {
      // Setup
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error('Invalid credentials')
      });

      // Execute
      const result = await authService.signIn('test@example.com', 'password');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      // Setup
      const refreshToken = authService.generateRefreshToken(mockUser);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Execute
      const result = await authService.refreshTokens(refreshToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toEqual(mockUser);

      // Verify new tokens
      const decodedAccess = jwt.verify(result.accessToken, process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev');
      expect(decodedAccess.sub).toBe(mockUser.id);
      expect(decodedAccess.type).toBe('access');

      const decodedRefresh = jwt.verify(result.refreshToken, process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev');
      expect(decodedRefresh.sub).toBe(mockUser.id);
      expect(decodedRefresh.type).toBe('refresh');
    });

    it('should reject invalid refresh token', async () => {
      // Setup
      const invalidToken = 'invalid-token';

      // Execute
      const result = await authService.refreshTokens(invalidToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Token');
    });

    it('should reject invalidated refresh token', async () => {
      // Setup
      const refreshToken = authService.generateRefreshToken(mockUser);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { token: refreshToken }, // Token is in invalidated list
        error: null
      });

      // Execute
      const result = await authService.refreshTokens(refreshToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Refresh token has been invalidated');
    });

    it('should handle expired refresh token', async () => {
      // Setup - create an expired token
      const expiredToken = jwt.sign(
        { sub: mockUser.id, type: 'refresh' },
        process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev',
        { expiresIn: 0 }
      );

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Execute
      const result = await authService.refreshTokens(expiredToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Refresh token expired');
    });
  });

  describe('signOut', () => {
    it('should sign out and invalidate refresh token', async () => {
      // Setup
      const refreshToken = authService.generateRefreshToken(mockUser);
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      // Execute
      const result = await authService.signOut(refreshToken);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('invalidated_tokens');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          token: refreshToken
        })
      ]);
    });

    it('should handle sign out without refresh token', async () => {
      // Setup
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Execute
      const result = await authService.signOut();

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.from().insert).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', async () => {
      // Setup
      const accessToken = authService.generateAccessToken(mockUser);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Execute
      const result = await authService.verifyToken(accessToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should detect expired access token', async () => {
      // Setup - create an expired token
      const expiredToken = jwt.sign(
        { sub: mockUser.id, type: 'access' },
        process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev',
        { expiresIn: 0 }
      );

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Execute
      const result = await authService.verifyToken(expiredToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Token expired');
      expect(result.expired).toBe(true);
    });
  });

  describe('token blacklisting', () => {
    it('should blacklist token on sign out', async () => {
      // Setup
      const accessToken = authService.generateAccessToken(mockUser);
      const refreshToken = authService.generateRefreshToken(mockUser);
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      // Execute
      const result = await authService.signOut(accessToken, refreshToken);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('blacklisted_tokens');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          token: accessToken,
          reason: 'logout'
        })
      ]);
    });

    it('should check for blacklisted tokens during verification', async () => {
      // Setup
      const accessToken = authService.generateAccessToken(mockUser);
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { token: accessToken }, // Token is blacklisted
        error: null
      });

      // Execute
      const result = await authService.verifyToken(accessToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Token has been revoked');
    });

    it('should blacklist old access token during refresh', async () => {
      // Setup
      const oldAccessToken = authService.generateAccessToken(mockUser);
      const refreshToken = authService.generateRefreshToken(mockUser);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null, // Refresh token not invalidated
        error: null
      });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      // Execute
      const result = await authService.refreshTokens(refreshToken, oldAccessToken);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('blacklisted_tokens');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          token: oldAccessToken,
          reason: 'refresh'
        })
      ]);
    });

    it('should clean up expired blacklisted tokens', async () => {
      // Setup
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      mockSupabase.from().delete.mockResolvedValue({ error: null });

      // Execute
      await authService.cleanupBlacklistedTokens();

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('blacklisted_tokens');
      expect(mockSupabase.from().delete().lt).toHaveBeenCalledWith('blacklisted_at', sevenDaysAgo);
    });

    it('should handle errors during token blacklisting', async () => {
      // Setup
      const accessToken = authService.generateAccessToken(mockUser);
      mockSupabase.from().insert.mockResolvedValue({
        error: new Error('Database error')
      });

      // Execute
      await authService.blacklistToken(accessToken, 'test');

      // Assert - should not throw error, just log it
      expect(mockSupabase.from).toHaveBeenCalledWith('blacklisted_tokens');
    });

    it('should fail secure when blacklist check fails', async () => {
      // Setup
      const accessToken = authService.generateAccessToken(mockUser);
      mockSupabase.from().select().eq().single.mockRejectedValue(new Error('Database error'));

      // Execute
      const isBlacklisted = await authService.isTokenBlacklisted(accessToken);

      // Assert - should assume token is blacklisted on error
      expect(isBlacklisted).toBe(true);
    });
  });

  describe('password reset', () => {
    const mockResetToken = 'mock-reset-token';
    const mockOptions = {
      redirectTo: 'http://example.com/reset',
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      }
    };

    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      mockSupabase.from().select.mockReturnThis();
      mockSupabase.from().update.mockReturnThis();
      mockSupabase.from().eq.mockReturnThis();
      mockSupabase.from().neq.mockReturnThis();
      mockSupabase.from().is.mockReturnThis();
    });

    describe('resetPassword', () => {
      it('should initiate password reset process', async () => {
        // Setup
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { id: mockUser.id, email: mockUser.email },
          error: null
        });
        mockSupabase.from().insert.mockResolvedValue({ error: null });
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

        // Execute
        const result = await authService.resetPassword(mockUser.email, mockOptions);

        // Assert
        expect(result.success).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('users');
        expect(mockSupabase.from).toHaveBeenCalledWith('password_resets');
        expect(mockSupabase.from).toHaveBeenCalledWith('auth_events');
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          mockUser.email,
          { redirectTo: mockOptions.redirectTo }
        );
      });

      it('should handle non-existent user', async () => {
        // Setup
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: null
        });

        // Execute
        const result = await authService.resetPassword('nonexistent@example.com');

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('User not found');
        expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
      });
    });

    describe('verifyResetToken', () => {
      it('should verify valid reset token', async () => {
        // Setup
        const resetToken = jwt.sign(
          { sub: mockUser.id, type: 'reset' },
          process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev',
          { expiresIn: '1h' }
        );

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: {
            user_id: mockUser.id,
            token: resetToken,
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            used_at: null
          },
          error: null
        });

        // Execute
        const result = await authService.verifyResetToken(resetToken);

        // Assert
        expect(result.success).toBe(true);
        expect(result.userId).toBe(mockUser.id);
      });

      it('should reject expired token', async () => {
        // Setup
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: {
            user_id: mockUser.id,
            token: mockResetToken,
            expires_at: new Date(Date.now() - 3600000).toISOString(),
            used_at: null
          },
          error: null
        });

        // Execute
        const result = await authService.verifyResetToken(mockResetToken);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Reset token has expired');
      });

      it('should reject used token', async () => {
        // Setup
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: {
            user_id: mockUser.id,
            token: mockResetToken,
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            used_at: new Date().toISOString()
          },
          error: null
        });

        // Execute
        const result = await authService.verifyResetToken(mockResetToken);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Reset token has already been used');
      });
    });

    describe('updatePasswordWithToken', () => {
      it('should update password with valid token', async () => {
        // Setup
        const resetToken = jwt.sign(
          { sub: mockUser.id, type: 'reset' },
          process.env.JWT_SECRET || 'glimmerglow-jwt-secret-key-dev',
          { expiresIn: '1h' }
        );

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: {
            user_id: mockUser.id,
            token: resetToken,
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            used_at: null
          },
          error: null
        });

        mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
        mockSupabase.from().update.mockResolvedValue({ error: null });
        mockSupabase.from().insert.mockResolvedValue({ error: null });

        // Execute
        const result = await authService.updatePasswordWithToken(
          resetToken,
          'newPassword123',
          mockOptions
        );

        // Assert
        expect(result.success).toBe(true);
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'newPassword123'
        });
        expect(mockSupabase.from).toHaveBeenCalledWith('password_resets');
        expect(mockSupabase.from).toHaveBeenCalledWith('auth_events');
      });

      it('should handle invalid token', async () => {
        // Setup
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: null
        });

        // Execute
        const result = await authService.updatePasswordWithToken(
          'invalid-token',
          'newPassword123'
        );

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid reset token');
        expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
      });
    });

    describe('updatePassword', () => {
      it('should update password for authenticated user', async () => {
        // Setup
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser },
          error: null
        });
        mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
        mockSupabase.from().insert.mockResolvedValue({ error: null });

        // Execute
        const result = await authService.updatePassword(
          mockUser.id,
          'currentPassword',
          'newPassword123',
          { ...mockOptions, email: mockUser.email }
        );

        // Assert
        expect(result.success).toBe(true);
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: mockUser.email,
          password: 'currentPassword'
        });
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'newPassword123'
        });
        expect(mockSupabase.from).toHaveBeenCalledWith('auth_events');
      });

      it('should handle incorrect current password', async () => {
        // Setup
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: null,
          error: new Error('Invalid credentials')
        });

        // Execute
        const result = await authService.updatePassword(
          mockUser.id,
          'wrongPassword',
          'newPassword123',
          { email: mockUser.email }
        );

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Current password is incorrect');
        expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
      });
    });

    describe('invalidateUserSessions', () => {
      it('should invalidate all user sessions except current', async () => {
        // Setup
        const currentSessionId = 'current-session';
        const mockSessions = [
          { id: 'session1', access_token: 'token1', refresh_token: 'refresh1' },
          { id: 'session2', access_token: 'token2', refresh_token: 'refresh2' }
        ];

        mockSupabase.from().select().eq().neq().is.mockResolvedValue({
          data: mockSessions,
          error: null
        });
        mockSupabase.from().update.mockResolvedValue({ error: null });

        // Execute
        await authService.invalidateUserSessions(mockUser.id, currentSessionId);

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('user_sessions');
        expect(mockSupabase.from().update).toHaveBeenCalledWith(
          expect.objectContaining({
            ended_at: expect.any(String),
            end_reason: 'password_change'
          })
        );
        expect(mockSupabase.from).toHaveBeenCalledWith('blacklisted_tokens');
      });

      it('should handle errors gracefully', async () => {
        // Setup
        mockSupabase.from().select().eq().neq().is.mockRejectedValue(
          new Error('Database error')
        );

        // Execute & Assert - should not throw
        await expect(
          authService.invalidateUserSessions(mockUser.id)
        ).resolves.not.toThrow();
      });
    });
  });
});
