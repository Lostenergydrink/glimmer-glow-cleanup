/**
 * @file base-provider.js
 * @description Base class for all database providers
 *
 * This class defines the interface that all database providers must implement.
 * It serves as a contract for database operations across different implementations.
 */

class DatabaseProvider {
  /**
   * Get all products
   * @returns {Promise<Array>} Array of product objects
   */
  async getProducts() {
    throw new Error('Method not implemented: getProducts');
  }

  /**
   * Get a specific product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProduct(productId) {
    throw new Error('Method not implemented: getProduct');
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    throw new Error('Method not implemented: createProduct');
  }

  /**
   * Update a product
   * @param {string} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, productData) {
    throw new Error('Method not implemented: updateProduct');
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success indicator
   */
  async deleteProduct(productId) {
    throw new Error('Method not implemented: deleteProduct');
  }

  /**
   * Get all subscription plans
   * @returns {Promise<Array>} Array of subscription plan objects
   */
  async getSubscriptionPlans() {
    throw new Error('Method not implemented: getSubscriptionPlans');
  }

  /**
   * Get a specific subscription plan by ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Subscription plan object
   */
  async getSubscriptionPlan(planId) {
    throw new Error('Method not implemented: getSubscriptionPlan');
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    throw new Error('Method not implemented: createOrder');
  }

  /**
   * Get orders for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of order objects
   */
  async getUserOrders(userId) {
    throw new Error('Method not implemented: getUserOrders');
  }

  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order object
   */
  async getOrder(orderId) {
    throw new Error('Method not implemented: getOrder');
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    throw new Error('Method not implemented: updateOrderStatus');
  }

  /**
   * Create a user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    throw new Error('Method not implemented: createUser');
  }

  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUser(userId) {
    throw new Error('Method not implemented: getUser');
  }

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    throw new Error('Method not implemented: updateUser');
  }

  /**
   * Get cart for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Cart object
   */
  async getUserCart(userId) {
    throw new Error('Method not implemented: getUserCart');
  }

  /**
   * Update user cart
   * @param {string} userId - User ID
   * @param {Object} cartData - Cart data
   * @returns {Promise<Object>} Updated cart
   */
  async updateUserCart(userId, cartData) {
    throw new Error('Method not implemented: updateUserCart');
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection success
   */
  async testConnection() {
    throw new Error('Method not implemented: testConnection');
  }
}

module.exports = DatabaseProvider;
