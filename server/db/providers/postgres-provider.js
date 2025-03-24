/**
 * @file postgres-provider.js
 * @description PostgreSQL implementation of the DatabaseProvider interface
 *
 * This provider uses direct PostgreSQL connections for database operations.
 */

const { Pool } = require('pg');
const DatabaseProvider = require('./base-provider');

class PostgresqlDatabaseProvider extends DatabaseProvider {
  /**
   * Constructor
   * @param {Object} config - PostgreSQL configuration
   */
  constructor(config) {
    super();

    if (!config || !config.connectionString) {
      throw new Error('PostgreSQL configuration missing required field: connectionString');
    }

    this.pool = new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl || { rejectUnauthorized: false }
    });
  }

  /**
   * Get all products
   * @returns {Promise<Array>} Array of product objects
   */
  async getProducts() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM products');
      return result.rows;
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProduct(productId) {
    if (!productId) throw new Error('Product ID is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM products WHERE id = $1', [productId]);

      if (result.rows.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in getProduct(${productId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    if (!productData) throw new Error('Product data is required');

    const client = await this.pool.connect();
    try {
      // Extract keys and values for dynamic query construction
      const keys = Object.keys(productData);
      const values = Object.values(productData);

      // Create parameterized query
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const query = `
        INSERT INTO products (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update a product
   * @param {string} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, productData) {
    if (!productId) throw new Error('Product ID is required');
    if (!productData) throw new Error('Product data is required');

    const client = await this.pool.connect();
    try {
      // Extract keys and values for dynamic query construction
      const keys = Object.keys(productData);
      const values = Object.values(productData);

      // Create SET clause for UPDATE statement
      const setClause = keys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');

      const query = `
        UPDATE products
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *
      `;

      const result = await client.query(query, [...values, productId]);

      if (result.rows.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in updateProduct(${productId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success indicator
   */
  async deleteProduct(productId) {
    if (!productId) throw new Error('Product ID is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM products WHERE id = $1', [productId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error in deleteProduct(${productId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all subscription plans
   * @returns {Promise<Array>} Array of subscription plan objects
   */
  async getSubscriptionPlans() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM subscription_plans');
      return result.rows;
    } catch (error) {
      console.error('Error in getSubscriptionPlans:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific subscription plan by ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Subscription plan object
   */
  async getSubscriptionPlan(planId) {
    if (!planId) throw new Error('Plan ID is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);

      if (result.rows.length === 0) {
        throw new Error(`Subscription plan not found: ${planId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in getSubscriptionPlan(${planId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    if (!orderData) throw new Error('Order data is required');

    const client = await this.pool.connect();
    try {
      // Extract keys and values for dynamic query construction
      const keys = Object.keys(orderData);
      const values = Object.values(orderData);

      // Create parameterized query
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const query = `
        INSERT INTO orders (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get orders for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of order objects
   */
  async getUserOrders(userId) {
    if (!userId) throw new Error('User ID is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error(`Error in getUserOrders(${userId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order object
   */
  async getOrder(orderId) {
    if (!orderId) throw new Error('Order ID is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);

      if (result.rows.length === 0) {
        throw new Error(`Order not found: ${orderId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in getOrder(${orderId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    if (!orderId) throw new Error('Order ID is required');
    if (!status) throw new Error('Status is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [status, orderId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Order not found: ${orderId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in updateOrderStatus(${orderId}, ${status}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    if (!userData) throw new Error('User data is required');

    const client = await this.pool.connect();
    try {
      // Extract keys and values for dynamic query construction
      const keys = Object.keys(userData);
      const values = Object.values(userData);

      // Create parameterized query
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const query = `
        INSERT INTO users (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUser(userId) {
    if (!userId) throw new Error('User ID is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);

      if (result.rows.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in getUser(${userId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    if (!userId) throw new Error('User ID is required');
    if (!userData) throw new Error('User data is required');

    const client = await this.pool.connect();
    try {
      // Extract keys and values for dynamic query construction
      const keys = Object.keys(userData);
      const values = Object.values(userData);

      // Create SET clause for UPDATE statement
      const setClause = keys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');

      const query = `
        UPDATE users
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        RETURNING *
      `;

      const result = await client.query(query, [...values, userId]);

      if (result.rows.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in updateUser(${userId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get cart for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Cart object
   */
  async getUserCart(userId) {
    if (!userId) throw new Error('User ID is required');

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM user_carts WHERE user_id = $1', [userId]);

      return result.rows.length > 0
        ? result.rows[0]
        : { user_id: userId, items: [] };
    } catch (error) {
      console.error(`Error in getUserCart(${userId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user cart
   * @param {string} userId - User ID
   * @param {Object} cartData - Cart data
   * @returns {Promise<Object>} Updated cart
   */
  async updateUserCart(userId, cartData) {
    if (!userId) throw new Error('User ID is required');
    if (!cartData) throw new Error('Cart data is required');

    const client = await this.pool.connect();
    try {
      // Check if cart exists
      const checkResult = await client.query(
        'SELECT id FROM user_carts WHERE user_id = $1',
        [userId]
      );

      let result;
      if (checkResult.rows.length > 0) {
        // Extract keys and values for dynamic query construction
        const keys = Object.keys(cartData);
        const values = Object.values(cartData);

        // Create SET clause for UPDATE statement
        const setClause = keys
          .map((key, i) => `${key} = $${i + 1}`)
          .join(', ');

        const query = `
          UPDATE user_carts
          SET ${setClause}
          WHERE user_id = $${keys.length + 1}
          RETURNING *
        `;

        result = await client.query(query, [...values, userId]);
      } else {
        // Insert new cart with user_id
        const allData = { ...cartData, user_id: userId };
        const keys = Object.keys(allData);
        const values = Object.values(allData);

        // Create parameterized query
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.join(', ');

        const query = `
          INSERT INTO user_carts (${columns})
          VALUES (${placeholders})
          RETURNING *
        `;

        result = await client.query(query, values);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error in updateUserCart(${userId}):`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection success
   */
  async testConnection() {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.pool.end();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database connection pool:', error);
      throw error;
    }
  }
}

module.exports = PostgresqlDatabaseProvider;
