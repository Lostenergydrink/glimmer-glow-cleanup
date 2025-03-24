/**
 * User Management Tests
 * Testing the user management functionality in the admin panel
 */

import { AdminPanel } from '../../scripts/admin/admin.js';

describe('User Management', () => {
  let adminPanel;
  let mockFetch;

  // Mock user data
  const mockUsers = [
    { id: 1, email: 'admin@test.com', role: 'admin', status: 'active', last_login: '2024-03-19T10:00:00Z' },
    { id: 2, email: 'manager@test.com', role: 'manager', status: 'active', last_login: '2024-03-19T09:00:00Z' },
    { id: 3, email: 'user@test.com', role: 'user', status: 'inactive', last_login: '2024-03-18T15:00:00Z' }
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup DOM elements required by AdminPanel
    document.body.innerHTML = `
      <div class="admin-container">
        <nav class="admin-nav">
          <div class="nav-links">
            <a href="#users">Users</a>
          </div>
        </nav>
        <main class="admin-content">
          <section id="users" class="section">
            <form id="userForm">
              <input type="hidden" name="userId">
              <input type="email" name="email" id="email">
              <select name="role" id="userRole">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
              <select name="status" id="userStatus">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button type="submit">Save User</button>
            </form>
            <div id="userList"></div>
          </section>
        </main>
      </div>
    `;

    // Mock fetch responses
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Initialize AdminPanel
    adminPanel = new AdminPanel();
  });

  afterEach(() => {
    // Cleanup
    document.body.innerHTML = '';
  });

  describe('loadUsers', () => {
    it('should load and display users', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });

      // Call loadUsers
      await adminPanel.loadUsers();

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users'),
        expect.any(Object)
      );

      // Verify users are displayed
      const userList = document.getElementById('userList');
      expect(userList.innerHTML).toContain('admin@test.com');
      expect(userList.innerHTML).toContain('manager@test.com');
      expect(userList.innerHTML).toContain('user@test.com');
    });

    it('should handle API errors', async () => {
      // Mock failed API response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Spy on showMessage
      const showMessageSpy = jest.spyOn(adminPanel, 'showMessage');

      // Call loadUsers
      await adminPanel.loadUsers();

      // Verify error message
      expect(showMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load users'),
        'error'
      );
    });
  });

  describe('handleUserSubmit', () => {
    it('should create a new user', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 4, email: 'new@test.com', role: 'user', status: 'active' })
      });

      // Fill form
      const form = document.getElementById('userForm');
      const emailInput = form.querySelector('#email');
      const roleSelect = form.querySelector('#userRole');
      const statusSelect = form.querySelector('#userStatus');

      emailInput.value = 'new@test.com';
      roleSelect.value = 'user';
      statusSelect.value = 'active';

      // Submit form
      const event = new Event('submit');
      event.preventDefault = jest.fn();
      await adminPanel.handleUserSubmit(event);

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );

      // Verify success message
      expect(adminPanel.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('User created successfully'),
        'success'
      );
    });

    it('should handle validation errors', async () => {
      // Submit empty form
      const form = document.getElementById('userForm');
      const event = new Event('submit');
      event.preventDefault = jest.fn();
      await adminPanel.handleUserSubmit(event);

      // Verify error message
      expect(adminPanel.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('Email and role are required'),
        'error'
      );
    });
  });

  describe('handleUserActions', () => {
    beforeEach(() => {
      // Mock loadUsers to populate the list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });
      return adminPanel.loadUsers();
    });

    it('should handle edit user action', async () => {
      // Mock user data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers[0])
      });

      // Click edit button
      const editButton = document.querySelector('.edit-user');
      editButton.click();

      // Verify form is populated
      const form = document.getElementById('userForm');
      expect(form.querySelector('#email').value).toBe('admin@test.com');
      expect(form.querySelector('#userRole').value).toBe('admin');
    });

    it('should handle delete user action', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);

      // Mock successful delete
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      // Click delete button
      const deleteButton = document.querySelector('.delete-user');
      deleteButton.click();

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      // Verify success message
      expect(adminPanel.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('User deleted successfully'),
        'success'
      );
    });

    it('should handle toggle status action', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);

      // Mock successful status update
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      // Click toggle status button
      const toggleButton = document.querySelector('.toggle-status');
      toggleButton.click();

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/status/'),
        expect.objectContaining({
          method: 'PUT'
        })
      );

      // Verify success message
      expect(adminPanel.showMessage).toHaveBeenCalledWith(
        expect.stringContaining('User status updated successfully'),
        'success'
      );
    });
  });
});
