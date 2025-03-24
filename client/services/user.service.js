import { apiClient } from '../utils/api-client';

class UserService {
  /**
   * Get a list of users with optional filters
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search term for email or name
   * @param {string} [params.role] - Filter by role
   * @param {string} [params.status] - Filter by status
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @returns {Promise<Object>} - Paginated list of users
   */
  async listUsers(params = {}) {
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} - User details
   */
  async getUserById(id) {
    const response = await apiClient.get(`/api/admin/users/${id}`);
    return response.data;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} [userData.displayName] - User's display name
   * @param {string} [userData.firstName] - User's first name
   * @param {string} [userData.lastName] - User's last name
   * @param {string} [userData.role='user'] - User's role
   * @param {string} [userData.status='active'] - User's status
   * @returns {Promise<Object>} - Created user
   */
  async createUser(userData) {
    const response = await apiClient.post('/api/admin/users', userData);
    return response.data;
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @param {string} [userData.displayName] - User's display name
   * @param {string} [userData.firstName] - User's first name
   * @param {string} [userData.lastName] - User's last name
   * @param {string} [userData.role] - User's role
   * @param {string} [userData.status] - User's status
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, userData) {
    const response = await apiClient.put(`/api/admin/users/${id}`, userData);
    return response.data;
  }

  /**
   * Update a user's password
   * @param {string} id - User ID
   * @param {string} password - New password
   * @returns {Promise<Object>} - Success response
   */
  async updateUserPassword(id, password) {
    const response = await apiClient.patch(`/api/admin/users/${id}/password`, { password });
    return response.data;
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<Object>} - Success response
   */
  async deleteUser(id) {
    const response = await apiClient.delete(`/api/admin/users/${id}`);
    return response.data;
  }

  /**
   * Change a user's role
   * @param {string} id - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>} - Success response
   */
  async changeUserRole(id, role) {
    const response = await apiClient.patch(`/api/admin/users/${id}/role`, { role });
    return response.data;
  }
}

export const userService = new UserService();
