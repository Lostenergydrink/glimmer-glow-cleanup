import request from 'supertest';
import app from '../../server/app.js';
import { AuthService } from '../../server/services/auth.service.js';
import { UserService } from '../../server/services/user.service.js';
import { ROLES } from '../../server/config/permissions.js';

describe('RBAC Integration Tests', () => {
  let authService;
  let userService;
  let adminToken;
  let managerToken;
  let staffToken;
  let userToken;
  let testUsers = {};

  beforeAll(async () => {
    authService = new AuthService();
    userService = new UserService();

    // Create test users for each role
    const users = {
      admin: {
        email: 'admin.test@glimmerglow.com',
        password: 'Admin123!@#',
        role: 'ADMIN'
      },
      manager: {
        email: 'manager.test@glimmerglow.com',
        password: 'Manager123!@#',
        role: 'MANAGER'
      },
      staff: {
        email: 'staff.test@glimmerglow.com',
        password: 'Staff123!@#',
        role: 'STAFF'
      },
      user: {
        email: 'user.test@glimmerglow.com',
        password: 'User123!@#',
        role: 'USER'
      }
    };

    // Create users and get their tokens
    for (const [role, userData] of Object.entries(users)) {
      const user = await userService.createUser(userData);
      testUsers[role] = user;
      const { accessToken } = await authService.signIn(userData.email, userData.password);
      switch (role) {
        case 'admin': adminToken = accessToken; break;
        case 'manager': managerToken = accessToken; break;
        case 'staff': staffToken = accessToken; break;
        case 'user': userToken = accessToken; break;
      }
    }
  });

  afterAll(async () => {
    // Clean up test users
    for (const user of Object.values(testUsers)) {
      await userService.deleteUser(user.id);
    }
  });

  describe('Product Management', () => {
    let testProduct;

    beforeEach(async () => {
      // Create a test product
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          price: 99.99,
          description: 'Test product description',
          stock: 100
        });
      testProduct = response.body;
    });

    afterEach(async () => {
      if (testProduct?.id) {
        await request(app)
          .delete(`/api/admin/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    test('Admin should have full product access', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          price: 149.99,
          description: 'New product description',
          stock: 50
        });
      expect(createResponse.status).toBe(201);

      // Read
      const readResponse = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(readResponse.status).toBe(200);

      // Update
      const updateResponse = await request(app)
        .put(`/api/admin/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testProduct, price: 129.99 });
      expect(updateResponse.status).toBe(200);

      // Delete
      const deleteResponse = await request(app)
        .delete(`/api/admin/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteResponse.status).toBe(204);
    });

    test('Manager should have product management access', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/admin/products')
          .set('Authorization', `Bearer ${managerToken}`),
        request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${managerToken}`)
          .send({
            name: 'Manager Product',
            price: 79.99,
            description: 'Manager product description',
            stock: 30
          }),
        request(app)
          .put(`/api/admin/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${managerToken}`)
          .send({ ...testProduct, price: 89.99 })
      ]);

      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });
    });

    test('Staff should have limited product access', async () => {
      // Should be able to read and update
      const readResponse = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(readResponse.status).toBe(200);

      const updateResponse = await request(app)
        .put(`/api/admin/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ ...testProduct, description: 'Updated description' });
      expect(updateResponse.status).toBe(200);

      // Should not be able to create or delete
      const createResponse = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Staff Product',
          price: 59.99,
          description: 'Staff product description',
          stock: 20
        });
      expect(createResponse.status).toBe(403);

      const deleteResponse = await request(app)
        .delete(`/api/admin/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(deleteResponse.status).toBe(403);
    });

    test('Regular user should have no product management access', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/admin/products')
          .set('Authorization', `Bearer ${userToken}`),
        request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'User Product',
            price: 49.99,
            description: 'User product description',
            stock: 10
          }),
        request(app)
          .put(`/api/admin/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ ...testProduct, price: 39.99 }),
        request(app)
          .delete(`/api/admin/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${userToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(403);
      });
    });
  });

  describe('User Management', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test.user@glimmerglow.com',
          password: 'TestUser123!@#',
          role: 'USER'
        });
      testUser = response.body;
    });

    afterEach(async () => {
      if (testUser?.id) {
        await request(app)
          .delete(`/api/admin/users/${testUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    test('Admin should have full user management access', async () => {
      // Create user
      const createResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new.user@glimmerglow.com',
          password: 'NewUser123!@#',
          role: 'USER'
        });
      expect(createResponse.status).toBe(201);

      // Update user role
      const updateRoleResponse = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'STAFF' });
      expect(updateRoleResponse.status).toBe(200);

      // Delete user
      const deleteResponse = await request(app)
        .delete(`/api/admin/users/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteResponse.status).toBe(204);
    });

    test('Manager should have limited user management access', async () => {
      // Should be able to manage staff and regular users
      const createStaffResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          email: 'new.staff@glimmerglow.com',
          password: 'NewStaff123!@#',
          role: 'STAFF'
        });
      expect(createStaffResponse.status).toBe(201);

      // Should not be able to create admin
      const createAdminResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          email: 'new.admin@glimmerglow.com',
          password: 'NewAdmin123!@#',
          role: 'ADMIN'
        });
      expect(createAdminResponse.status).toBe(403);

      // Clean up
      await request(app)
        .delete(`/api/admin/users/${createStaffResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    test('Staff should only be able to manage regular users', async () => {
      // Should be able to manage regular users
      const createUserResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          email: 'new.regular@glimmerglow.com',
          password: 'NewRegular123!@#',
          role: 'USER'
        });
      expect(createUserResponse.status).toBe(201);

      // Should not be able to create staff or admin
      const createStaffResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          email: 'another.staff@glimmerglow.com',
          password: 'Staff123!@#',
          role: 'STAFF'
        });
      expect(createStaffResponse.status).toBe(403);

      // Clean up
      await request(app)
        .delete(`/api/admin/users/${createUserResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    test('Regular user should have no user management access', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${userToken}`),
        request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            email: 'another.user@glimmerglow.com',
            password: 'User123!@#',
            role: 'USER'
          }),
        request(app)
          .put(`/api/admin/users/${testUser.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ role: 'STAFF' }),
        request(app)
          .delete(`/api/admin/users/${testUser.id}`)
          .set('Authorization', `Bearer ${userToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(403);
      });
    });
  });

  describe('Dashboard Access', () => {
    test('Admin should have full dashboard access', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/dashboard/analytics/sales')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/dashboard/reports')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/dashboard/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/dashboard/system-health')
          .set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('Manager should have analytics and reports access', async () => {
      // Should have access to analytics and reports
      const allowedResponses = await Promise.all([
        request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${managerToken}`),
        request(app)
          .get('/api/admin/dashboard/analytics/sales')
          .set('Authorization', `Bearer ${managerToken}`),
        request(app)
          .get('/api/admin/dashboard/reports')
          .set('Authorization', `Bearer ${managerToken}`)
      ]);

      allowedResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should not have access to audit logs and system health
      const restrictedResponses = await Promise.all([
        request(app)
          .get('/api/admin/dashboard/audit-logs')
          .set('Authorization', `Bearer ${managerToken}`),
        request(app)
          .get('/api/admin/dashboard/system-health')
          .set('Authorization', `Bearer ${managerToken}`)
      ]);

      restrictedResponses.forEach(response => {
        expect(response.status).toBe(403);
      });
    });

    test('Staff and regular users should have no dashboard access', async () => {
      const endpoints = [
        '/api/admin/dashboard',
        '/api/admin/dashboard/analytics/sales',
        '/api/admin/dashboard/reports',
        '/api/admin/dashboard/audit-logs',
        '/api/admin/dashboard/system-health'
      ];

      // Test staff access
      const staffResponses = await Promise.all(
        endpoints.map(endpoint =>
          request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${staffToken}`)
        )
      );

      staffResponses.forEach(response => {
        expect(response.status).toBe(403);
      });

      // Test regular user access
      const userResponses = await Promise.all(
        endpoints.map(endpoint =>
          request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${userToken}`)
        )
      );

      userResponses.forEach(response => {
        expect(response.status).toBe(403);
      });
    });
  });
});
