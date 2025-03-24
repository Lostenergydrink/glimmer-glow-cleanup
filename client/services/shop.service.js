/**
 * Shop Service
 * 
 * Handles all shop-related API calls to the server,
 * including cart, wishlist, orders, and products management.
 */

import { apiService } from './api.service.js';

class ShopService {
  constructor() {
    this.apiBase = '/api/shop';
  }

  /**
   * Product Methods
   */
  
  /**
   * Get all products
   * @returns {Promise<Array>} Array of products
   */
  async getProducts() {
    return apiService.get(`${this.apiBase}/products`);
  }
  
  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product details
   */
  async getProductById(id) {
    return apiService.get(`${this.apiBase}/products/${id}`);
  }
  
  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Products in category
   */
  async getProductsByCategory(categoryId) {
    return apiService.get(`${this.apiBase}/categories/${categoryId}/products`);
  }

  /**
   * Category Methods
   */
  
  /**
   * Get all categories
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    return apiService.get(`${this.apiBase}/categories`);
  }

  /**
   * Cart Methods
   */
  
  /**
   * Save cart to server (for logged in users)
   * @param {Array} items - Cart items
   * @returns {Promise<Object>} Saved cart
   */
  async saveCart(items) {
    return apiService.post(`${this.apiBase}/cart`, { items });
  }
  
  /**
   * Load cart from server (for logged in users)
   * @returns {Promise<Array>} Cart items
   */
  async loadCart() {
    return apiService.get(`${this.apiBase}/cart`);
  }
  
  /**
   * Clear cart on server (for logged in users)
   * @returns {Promise<boolean>} Success status
   */
  async clearCart() {
    return apiService.delete(`${this.apiBase}/cart`);
  }
  
  /**
   * Add item to cart
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Updated cart
   */
  async addToCart(productId, quantity = 1) {
    return apiService.post(`${this.apiBase}/cart/items`, { 
      productId, 
      quantity 
    });
  }
  
  /**
   * Remove item from cart
   * @param {string} productId - Product ID to remove
   * @returns {Promise<Object>} Updated cart
   */
  async removeFromCart(productId) {
    return apiService.delete(`${this.apiBase}/cart/items/${productId}`);
  }
  
  /**
   * Update cart item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  async updateCartItemQuantity(productId, quantity) {
    return apiService.put(`${this.apiBase}/cart/items/${productId}`, { 
      quantity 
    });
  }

  /**
   * Wishlist Methods
   */
  
  /**
   * Save wishlist to server (for logged in users)
   * @param {Array} items - Wishlist items
   * @returns {Promise<Object>} Saved wishlist
   */
  async saveWishlist(items) {
    return apiService.post(`${this.apiBase}/wishlist`, { items });
  }
  
  /**
   * Load wishlist from server (for logged in users)
   * @returns {Promise<Array>} Wishlist items
   */
  async loadWishlist() {
    return apiService.get(`${this.apiBase}/wishlist`);
  }
  
  /**
   * Add item to wishlist
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated wishlist
   */
  async addToWishlist(productId) {
    return apiService.post(`${this.apiBase}/wishlist/items`, { productId });
  }
  
  /**
   * Remove item from wishlist
   * @param {string} productId - Product ID to remove
   * @returns {Promise<Object>} Updated wishlist
   */
  async removeFromWishlist(productId) {
    return apiService.delete(`${this.apiBase}/wishlist/items/${productId}`);
  }

  /**
   * Order Methods
   */
  
  /**
   * Create an order from cart
   * @param {Object} orderData - Order data (shipping, payment, etc.)
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    return apiService.post(`${this.apiBase}/orders`, orderData);
  }
  
  /**
   * Get all orders for current user
   * @returns {Promise<Array>} User's orders
   */
  async getUserOrders() {
    return apiService.get(`${this.apiBase}/orders`);
  }
  
  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderById(orderId) {
    return apiService.get(`${this.apiBase}/orders/${orderId}`);
  }

  /**
   * Checkout Methods
   */
  
  /**
   * Process checkout from cart
   * @param {Object} checkoutData - Checkout data
   * @returns {Promise<Object>} Checkout result
   */
  async checkout(checkoutData) {
    return apiService.post(`${this.apiBase}/checkout`, checkoutData);
  }
}

// Export singleton instance
const shopService = new ShopService();
export { shopService }; 