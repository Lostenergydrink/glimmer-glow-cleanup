/**
 * Database Service - Provides standardized access to Supabase
 * Centralizes all database operations through a single service
 */
import { createClient } from '@supabase/supabase-js';
import { errorHandler } from '../../scripts/utils/utilities-node.js';

// Initialize Supabase client
let supabaseClient = null;

/**
 * Database Service class to handle all database operations
 * Provides a standardized interface for Supabase access
 */
class DatabaseService {
  constructor(url, key) {
    if (!url || !key) {
      throw new Error('Missing required Supabase configuration');
    }
    
    // Initialize the Supabase client if not already initialized
    if (!supabaseClient) {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false // Don't persist session in browser storage
        }
      });
    }
    
    this.supabase = supabaseClient;
    this.connected = false;
  }
  
  /**
   * Tests the database connection
   * @returns {Promise<Object>} Connection status
   */
  async testConnection() {
    try {
      // A simple query to verify connection
      const { data, error } = await this.supabase
        .from('products')
        .select('count(*)')
        .limit(1);
        
      if (error) throw error;
      
      this.connected = true;
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      this.connected = false;
      errorHandler(error, 'Database connection test');
      return { success: false, message: error.message };
    }
  }
  
  /**
   * Get all products from the database
   * @returns {Promise<Array>} Array of products
   */
  async getProducts() {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      return { 
        products: data || [], 
        version: new Date().toISOString() 
      };
    } catch (error) {
      errorHandler(error, 'Get products');
      throw error;
    }
  }
  
  /**
   * Get a single product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProduct(id) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Get product by ID');
      throw error;
    }
  }
  
  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .insert([{
          ...productData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Create product');
      throw error;
    }
  }
  
  /**
   * Update a product
   * @param {string} id - Product ID
   * @param {Object} updates - Product updates
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(id, updates) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Update product');
      throw error;
    }
  }
  
  /**
   * Delete a product
   * @param {string} id - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProduct(id) {
    try {
      const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      errorHandler(error, 'Delete product');
      throw error;
    }
  }
  
  /**
   * Update product stock
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to subtract
   * @returns {Promise<Object>} Updated product
   */
  async updateProductStock(id, quantity) {
    try {
      // First get the current product
      const product = await this.getProduct(id);
      
      if (!product) throw new Error('Product not found');
      
      const newQuantity = product.quantity - quantity;
      if (newQuantity < 0) throw new Error('Insufficient stock');
      
      // Update the product
      return await this.updateProduct(id, { quantity: newQuantity });
    } catch (error) {
      errorHandler(error, 'Update product stock');
      throw error;
    }
  }
  
  /**
   * Get all transactions
   * @returns {Promise<Array>} Array of transactions
   */
  async getTransactions() {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      errorHandler(error, 'Get transactions');
      throw error;
    }
  }
  
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async createTransaction(transactionData) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Create transaction');
      throw error;
    }
  }
  
  /**
   * Get all subscriptions
   * @returns {Promise<Array>} Array of subscriptions
   */
  async getSubscriptions() {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      errorHandler(error, 'Get subscriptions');
      throw error;
    }
  }
  
  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .insert([{
          ...subscriptionData,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Create subscription');
      throw error;
    }
  }
  
  /**
   * Cancel a subscription
   * @param {string} id - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async cancelSubscription(id) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .update({ active: false, cancelledAt: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Cancel subscription');
      return null;
    }
  }

  /**
   * Gallery Items Functions
   */
  
  async getAllGalleryItems() {
    try {
      const { data, error } = await this.supabase
        .from('gallery')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      errorHandler(error, 'Get all gallery items');
      return [];
    }
  }
  
  async getGalleryItemById(id) {
    try {
      const { data, error } = await this.supabase
        .from('gallery')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, `Get gallery item by id: ${id}`);
      return null;
    }
  }
  
  async createGalleryItem(galleryData) {
    try {
      const { data, error } = await this.supabase
        .from('gallery')
        .insert([{
          ...galleryData,
          createdAt: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Create gallery item');
      return null;
    }
  }
  
  async updateGalleryItem(id, updates) {
    try {
      const { data, error } = await this.supabase
        .from('gallery')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, `Update gallery item: ${id}`);
      return null;
    }
  }
  
  async deleteGalleryItem(id) {
    try {
      const { error } = await this.supabase
        .from('gallery')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      errorHandler(error, `Delete gallery item: ${id}`);
      return false;
    }
  }
  
  /**
   * Events Functions
   */
  
  async getAllEvents() {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      errorHandler(error, 'Get all events');
      return [];
    }
  }
  
  async getEventById(id) {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, `Get event by id: ${id}`);
      return null;
    }
  }
  
  async createEvent(eventData) {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .insert([{
          ...eventData,
          createdAt: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Create event');
      return null;
    }
  }
  
  async updateEvent(id, updates) {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, `Update event: ${id}`);
      return null;
    }
  }
  
  async deleteEvent(id) {
    try {
      const { error } = await this.supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      errorHandler(error, `Delete event: ${id}`);
      return false;
    }
  }
  
  /**
   * Shopping Cart Functions
   */
   
  /**
   * Save a shopping cart for a user
   * @param {string} userId - User ID
   * @param {Array} items - Cart items
   * @returns {Promise<Object>} Saved cart
   */
  async saveCart(userId, items) {
    try {
      // Check if cart exists
      const { data: existingCart } = await this.supabase
        .from('carts')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (existingCart) {
        // Update existing cart
        const { data, error } = await this.supabase
          .from('carts')
          .update({
            items: items,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new cart
        const { data, error } = await this.supabase
          .from('carts')
          .insert([{
            user_id: userId,
            items: items,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      errorHandler(error, 'Save cart');
      return null;
    }
  }
  
  /**
   * Load a shopping cart for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's cart
   */
  async loadCart(userId) {
    try {
      const { data, error } = await this.supabase
        .from('carts')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned" - not an error for us
      
      return data ? data.items : [];
    } catch (error) {
      errorHandler(error, 'Load cart');
      return [];
    }
  }
  
  /**
   * Clear a user's shopping cart
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async clearCart(userId) {
    try {
      const { error } = await this.supabase
        .from('carts')
        .update({ items: [], updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      errorHandler(error, 'Clear cart');
      return false;
    }
  }
  
  /**
   * Wishlist Functions
   */
  
  /**
   * Save a wishlist for a user
   * @param {string} userId - User ID
   * @param {Array} items - Wishlist items
   * @returns {Promise<Object>} Saved wishlist
   */
  async saveWishlist(userId, items) {
    try {
      // Check if wishlist exists
      const { data: existingWishlist } = await this.supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (existingWishlist) {
        // Update existing wishlist
        const { data, error } = await this.supabase
          .from('wishlists')
          .update({
            items: items,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new wishlist
        const { data, error } = await this.supabase
          .from('wishlists')
          .insert([{
            user_id: userId,
            items: items,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      errorHandler(error, 'Save wishlist');
      return null;
    }
  }
  
  /**
   * Load a wishlist for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Wishlist items
   */
  async loadWishlist(userId) {
    try {
      const { data, error } = await this.supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? data.items : [];
    } catch (error) {
      errorHandler(error, 'Load wishlist');
      return [];
    }
  }
  
  /**
   * Order Management Functions
   */
  
  /**
   * Create a new order
   * @param {Object} orderData - Order data including user_id, items, shipping, etc.
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    try {
      // Start a Supabase transaction
      // Note: Supabase doesn't support true transactions yet, so we'll do our best
      // to maintain data consistency with error handling
      
      // 1. Create the order
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .insert([{
          user_id: orderData.userId,
          items: orderData.items,
          total: orderData.total,
          shipping_address: orderData.shippingAddress,
          payment_method: orderData.paymentMethod,
          payment_id: orderData.paymentId,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // 2. Update product stocks
      for (const item of orderData.items) {
        await this.updateProductStock(item.id, item.quantity);
      }
      
      // 3. Create a transaction record
      await this.createTransaction({
        order_id: order.id,
        user_id: orderData.userId,
        amount: orderData.total,
        payment_method: orderData.paymentMethod,
        payment_id: orderData.paymentId,
        status: 'completed'
      });
      
      // 4. Clear the user's cart if successful
      await this.clearCart(orderData.userId);
      
      return order;
    } catch (error) {
      errorHandler(error, 'Create order');
      throw error; // Re-throw to allow caller to handle the error
    }
  }
  
  /**
   * Get all orders for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's orders
   */
  async getUserOrders(userId) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      errorHandler(error, 'Get user orders');
      return [];
    }
  }
  
  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderById(orderId) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Get order by ID');
      return null;
    }
  }
  
  /**
   * Update an order's status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Update order status');
      return null;
    }
  }
  
  /**
   * Category Management Functions - Enhanced
   */
  
  /**
   * Get all product categories
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      errorHandler(error, 'Get categories');
      throw error;
    }
  }
  
  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Products in the category
   */
  async getProductsByCategory(categoryId) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      errorHandler(error, 'Get products by category');
      throw error;
    }
  }
  
  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .insert([{
          ...categoryData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Create category');
      throw error;
    }
  }
  
  /**
   * Update a category
   * @param {string} id - Category ID
   * @param {Object} updates - Category updates
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(id, updates) {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      errorHandler(error, 'Update category');
      throw error;
    }
  }
  
  /**
   * Delete a category
   * @param {string} id - Category ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCategory(id) {
    try {
      const { error } = await this.supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      errorHandler(error, 'Delete category');
      throw error;
    }
  }
  
  /**
   * Helper function to transform database field names from snake_case to camelCase
   * @param {Object|Array} data - Data to transform
   * @returns {Object|Array} Transformed data
   */
  transformDatabaseFields(data) {
    if (!data) return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.transformDatabaseFields(item));
    }
    
    // Handle objects
    if (typeof data === 'object' && data !== null) {
      const transformed = {};
      
      Object.entries(data).forEach(([key, value]) => {
        // Convert snake_case to camelCase
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        
        // Recursively transform nested objects and arrays
        transformed[camelKey] = this.transformDatabaseFields(value);
      });
      
      return transformed;
    }
    
    // Return primitive values as is
    return data;
  }

  /**
   * Helper function to transform JavaScript field names from camelCase to snake_case
   * @param {Object|Array} data - Data to transform
   * @returns {Object|Array} Transformed data
   */
  transformJavaScriptFields(data) {
    if (!data) return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.transformJavaScriptFields(item));
    }
    
    // Handle objects
    if (typeof data === 'object' && data !== null) {
      const transformed = {};
      
      Object.entries(data).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        // Recursively transform nested objects and arrays
        transformed[snakeKey] = this.transformJavaScriptFields(value);
      });
      
      return transformed;
    }
    
    // Return primitive values as is
    return data;
  }
}

// Export singleton instance
export default DatabaseService; 