/**
 * wishlist.js - Wishlist functionality
 * Manages user's wishlist of products
 */
import { select, selectAll, addEvent, showNotification } from '../utils/utilities.js';
import { shopService } from '../../client/services/shop.service.js';
import { authService } from '../../client/services/auth.service.js';
import cart from './cart.js';

class Wishlist {
  constructor() {
    this.items = [];
    this.isInitialized = false;
    this.observers = [];
    this.isAuthenticated = false;
    this.userId = null;
    
    // Bind methods to preserve this context
    this.init = this.init.bind(this);
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
    this.addItem = this.addItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.toggleItem = this.toggleItem.bind(this);
    this.hasItem = this.hasItem.bind(this);
    this.clear = this.clear.bind(this);
    this.moveToCart = this.moveToCart.bind(this);
    this.notifyObservers = this.notifyObservers.bind(this);
    this.synchronizeWishlist = this.synchronizeWishlist.bind(this);
    
    // Initialize wishlist
    this.init();
  }
  
  /**
   * Initialize the wishlist
   */
  async init() {
    if (this.isInitialized) return;
    
    // Check authentication status
    try {
      const authStatus = await authService.checkAuthStatus();
      this.isAuthenticated = authStatus.isAuthenticated;
      this.userId = authStatus.userId;
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
    
    // Load wishlist
    if (this.isAuthenticated && this.userId) {
      // If user is logged in, synchronize with server
      await this.synchronizeWishlist();
    } else {
      // Otherwise just load from local storage
      this.load();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Load wishlist from localStorage
   */
  load() {
    try {
      const savedWishlist = localStorage.getItem('glimmer-glow-wishlist');
      if (savedWishlist) {
        this.items = JSON.parse(savedWishlist);
        this.notifyObservers();
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      this.items = [];
    }
  }
  
  /**
   * Save wishlist to localStorage
   */
  save() {
    try {
      localStorage.setItem('glimmer-glow-wishlist', JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving wishlist:', error);
      showNotification('Unable to save wishlist', 'error');
    }
  }
  
  /**
   * Synchronize wishlist between local storage and server
   */
  async synchronizeWishlist() {
    try {
      // First load local wishlist
      this.load();
      const localItems = [...this.items];
      
      // Then load server wishlist
      const serverItems = await shopService.loadWishlist().catch(() => []);
      const serverItemIds = serverItems.map(item => item.id || item);
      
      if (!serverItemIds.length) {
        // If no server wishlist, save local wishlist to server
        if (localItems.length > 0) {
          await shopService.saveWishlist(localItems);
        }
        return;
      }
      
      // Merge local and server wishlist items
      const mergedItems = [...serverItemIds];
      
      // Add local items not in server wishlist
      for (const localItem of localItems) {
        if (!mergedItems.includes(localItem)) {
          mergedItems.push(localItem);
        }
      }
      
      // Update local wishlist with merged items
      this.items = mergedItems;
      this.save();
      this.notifyObservers();
      
      // Save merged wishlist to server
      await shopService.saveWishlist(mergedItems);
    } catch (error) {
      console.error('Error synchronizing wishlist:', error);
      // Fall back to local wishlist
      this.load();
    }
  }
  
  /**
   * Add an item to the wishlist
   * @param {string} productId - Product ID to add
   * @returns {boolean} Whether the item was added
   */
  async addItem(productId) {
    if (!productId || this.hasItem(productId)) {
      return false;
    }
    
    this.items.push(productId);
    this.save();
    this.notifyObservers();
    
    // If authenticated, also add to server
    if (this.isAuthenticated) {
      try {
        await shopService.addToWishlist(productId);
      } catch (error) {
        console.error('Error adding to server wishlist:', error);
        // Continue with local update even if server fails
      }
    }
    
    showNotification('Added to wishlist', 'success');
    return true;
  }
  
  /**
   * Remove an item from the wishlist
   * @param {string} productId - Product ID to remove
   * @returns {boolean} Whether the item was removed
   */
  async removeItem(productId) {
    const index = this.items.indexOf(productId);
    
    if (index === -1) {
      return false;
    }
    
    this.items.splice(index, 1);
    this.save();
    this.notifyObservers();
    
    // If authenticated, also remove from server
    if (this.isAuthenticated) {
      try {
        await shopService.removeFromWishlist(productId);
      } catch (error) {
        console.error('Error removing from server wishlist:', error);
        // Continue with local update even if server fails
      }
    }
    
    showNotification('Removed from wishlist', 'info');
    return true;
  }
  
  /**
   * Toggle an item in the wishlist
   * @param {string} productId - Product ID to toggle
   * @returns {boolean} Whether the item is in the wishlist after toggling
   */
  toggleItem(productId) {
    if (this.hasItem(productId)) {
      this.removeItem(productId);
      return false;
    } else {
      this.addItem(productId);
      return true;
    }
  }
  
  /**
   * Check if an item is in the wishlist
   * @param {string} productId - Product ID to check
   * @returns {boolean} Whether the item is in the wishlist
   */
  hasItem(productId) {
    return this.items.includes(productId);
  }
  
  /**
   * Clear the wishlist
   */
  clear() {
    this.items = [];
    this.save();
    this.notifyObservers();
    showNotification('Wishlist cleared', 'info');
  }
  
  /**
   * Move an item from wishlist to cart
   * @param {string} productId - Product ID to move
   * @returns {Promise<boolean>} Whether the item was moved
   */
  async moveToCart(productId) {
    try {
      if (!this.hasItem(productId)) {
        return false;
      }
      
      const product = await this.fetchProduct(productId);
      
      if (!product) {
        showNotification('Product not found', 'error');
        return false;
      }
      
      cart.addItem(product);
      this.removeItem(productId);
      return true;
    } catch (error) {
      console.error('Error moving item to cart:', error);
      showNotification('Failed to move item to cart', 'error');
      return false;
    }
  }
  
  /**
   * Fetch a product by ID
   * @param {string} productId - Product ID to fetch
   * @returns {Promise<Object>} Product data
   */
  async fetchProduct(productId) {
    try {
      return await shopService.getProductById(productId);
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }
  
  /**
   * Get all items in the wishlist
   * @returns {Array<string>} Array of product IDs
   */
  getItems() {
    return [...this.items];
  }
  
  /**
   * Add an observer to notify when wishlist changes
   * @param {Function} callback - Function to call when wishlist changes
   */
  addObserver(callback) {
    if (typeof callback === 'function') {
      this.observers.push(callback);
    }
  }
  
  /**
   * Remove an observer
   * @param {Function} callback - Observer to remove
   */
  removeObserver(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }
  
  /**
   * Notify all observers of wishlist changes
   */
  notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.getItems());
      } catch (error) {
        console.error('Error in wishlist observer:', error);
      }
    });
  }
}

// Create singleton instance
const wishlist = new Wishlist();

// Export wishlist methods
export default {
  addItem: wishlist.addItem,
  removeItem: wishlist.removeItem,
  toggleItem: wishlist.toggleItem,
  hasItem: wishlist.hasItem,
  clear: wishlist.clear,
  moveToCart: wishlist.moveToCart,
  getItems: wishlist.getItems,
  addObserver: wishlist.addObserver,
  removeObserver: wishlist.removeObserver
}; 