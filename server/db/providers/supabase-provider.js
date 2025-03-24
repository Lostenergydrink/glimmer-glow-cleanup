/**
 * @file supabase-provider.js
 * @description Supabase implementation of the DatabaseProvider interface
 *
 * This provider uses the Supabase client to interact with a Supabase backend.
 */

const { createClient } = require('@supabase/supabase-js');
const DatabaseProvider = require('./base-provider');

class SupabaseDatabaseProvider extends DatabaseProvider {
  /**
   * Constructor
   * @param {Object} config - Supabase configuration
   */
  constructor(config) {
    super();

    if (!config || !config.url || !config.key) {
      throw new Error('Supabase configuration missing required fields: url, key');
    }

    this.supabase = createClient(config.url, config.key);
    this.tables = {
      products: 'products',
      subscriptions: 'subscription_plans',
      orders: 'orders',
      users: 'users',
      carts: 'user_carts',
    };
  }

  /**
   * Get all products
   * @returns {Promise<Array>} Array of product objects
   */
  async getProducts() {
    try {
      const { data, error } = await this.supabase
        .from(this.tables.products)
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  /**
   * Get a specific product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProduct(productId) {
    if (!productId) throw new Error('Product ID is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.products)
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Product not found: ${productId}`);

      return data;
    } catch (error) {
      console.error(`Error in getProduct(${productId}):`, error);
      throw error;
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    if (!productData) throw new Error('Product data is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.products)
        .insert([productData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw error;
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

    try {
      const { data, error } = await this.supabase
        .from(this.tables.products)
        .update(productData)
        .eq('id', productId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      return data[0];
    } catch (error) {
      console.error(`Error in updateProduct(${productId}):`, error);
      throw error;
    }
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success indicator
   */
  async deleteProduct(productId) {
    if (!productId) throw new Error('Product ID is required');

    try {
      const { error } = await this.supabase
        .from(this.tables.products)
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error in deleteProduct(${productId}):`, error);
      throw error;
    }
  }

  /**
   * Get all subscription plans
   * @returns {Promise<Array>} Array of subscription plan objects
   */
  async getSubscriptionPlans() {
    try {
      const { data, error } = await this.supabase
        .from(this.tables.subscriptions)
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getSubscriptionPlans:', error);
      throw error;
    }
  }

  /**
   * Get a specific subscription plan by ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Subscription plan object
   */
  async getSubscriptionPlan(planId) {
    if (!planId) throw new Error('Plan ID is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.subscriptions)
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Subscription plan not found: ${planId}`);

      return data;
    } catch (error) {
      console.error(`Error in getSubscriptionPlan(${planId}):`, error);
      throw error;
    }
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    if (!orderData) throw new Error('Order data is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.orders)
        .insert([orderData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  }

  /**
   * Get orders for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of order objects
   */
  async getUserOrders(userId) {
    if (!userId) throw new Error('User ID is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.orders)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error in getUserOrders(${userId}):`, error);
      throw error;
    }
  }

  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order object
   */
  async getOrder(orderId) {
    if (!orderId) throw new Error('Order ID is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.orders)
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Order not found: ${orderId}`);

      return data;
    } catch (error) {
      console.error(`Error in getOrder(${orderId}):`, error);
      throw error;
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

    try {
      const { data, error } = await this.supabase
        .from(this.tables.orders)
        .update({ status })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`Order not found: ${orderId}`);
      }

      return data[0];
    } catch (error) {
      console.error(`Error in updateOrderStatus(${orderId}, ${status}):`, error);
      throw error;
    }
  }

  /**
   * Create a user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    if (!userData) throw new Error('User data is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.users)
        .insert([userData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUser(userId) {
    if (!userId) throw new Error('User ID is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.users)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`User not found: ${userId}`);

      return data;
    } catch (error) {
      console.error(`Error in getUser(${userId}):`, error);
      throw error;
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

    try {
      const { data, error } = await this.supabase
        .from(this.tables.users)
        .update(userData)
        .eq('id', userId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      return data[0];
    } catch (error) {
      console.error(`Error in updateUser(${userId}):`, error);
      throw error;
    }
  }

  /**
   * Get cart for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Cart object
   */
  async getUserCart(userId) {
    if (!userId) throw new Error('User ID is required');

    try {
      const { data, error } = await this.supabase
        .from(this.tables.carts)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
        throw error;
      }

      return data || { user_id: userId, items: [] };
    } catch (error) {
      console.error(`Error in getUserCart(${userId}):`, error);
      throw error;
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

    try {
      // Check if cart exists
      const { data: existingCart } = await this.supabase
        .from(this.tables.carts)
        .select('id')
        .eq('user_id', userId)
        .single();

      let result;
      if (existingCart) {
        // Update existing cart
        const { data, error } = await this.supabase
          .from(this.tables.carts)
          .update(cartData)
          .eq('user_id', userId)
          .select();

        if (error) throw error;
        result = data[0];
      } else {
        // Create new cart
        const { data, error } = await this.supabase
          .from(this.tables.carts)
          .insert([{ ...cartData, user_id: userId }])
          .select();

        if (error) throw error;
        result = data[0];
      }

      return result;
    } catch (error) {
      console.error(`Error in updateUserCart(${userId}):`, error);
      throw error;
    }
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection success
   */
  async testConnection() {
    try {
      // Perform a simple query to test connection
      const { data, error } = await this.supabase.from('health_check').select('*').limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

module.exports = SupabaseDatabaseProvider;
