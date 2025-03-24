/**
 * Shopping Cart Module
 * Manages the shopping cart functionality including adding, removing, 
 * and updating items, as well as persistence between page loads.
 */

import { showNotification } from '../utils/notifications.js';
import { shopService } from '../../client/services/shop.service.js';

class ShoppingCart {
  constructor() {
    this.items = [];
    this.initialized = false;
    this.observers = [];
  }

  /**
   * Initialize the cart by loading from localStorage if available
   */
  init() {
    if (this.initialized) return;
    
    this.loadCart();
    this.initialized = true;
    this.notifyObservers();
  }

  /**
   * Load cart data from localStorage
   */
  loadCart() {
    try {
      const savedCart = localStorage.getItem('glimmerGlowCart');
      if (savedCart) {
        this.items = JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      this.items = [];
    }
  }

  /**
   * Save cart data to localStorage
   */
  saveCart() {
    try {
      localStorage.setItem('glimmerGlowCart', JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
      showNotification('Unable to save cart data', 'error');
    }
  }

  /**
   * Add an item to the cart
   * @param {Object} product - The product to add
   * @param {number} quantity - The quantity to add
   * @returns {boolean} Whether the operation was successful
   */
  addItem(product, quantity = 1) {
    if (!product || !product.id) {
      console.error('Invalid product:', product);
      return false;
    }

    quantity = parseInt(quantity);
    
    if (isNaN(quantity) || quantity < 1) {
      console.error('Invalid quantity:', quantity);
      return false;
    }

    const existingItemIndex = this.items.findIndex(item => item.id === product.id);

    if (existingItemIndex >= 0) {
      // If item already exists, increase quantity
      this.items[existingItemIndex].quantity += quantity;
      showNotification(`Updated ${product.name} quantity in cart`, 'success');
    } else {
      // If item is new, add it
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity
      });
      showNotification(`Added ${product.name} to cart`, 'success');
    }

    this.saveCart();
    this.notifyObservers();
    return true;
  }

  /**
   * Remove an item from the cart
   * @param {string} productId - The ID of the product to remove
   * @returns {boolean} Whether the operation was successful
   */
  removeItem(productId) {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== productId);
    
    if (this.items.length < initialLength) {
      this.saveCart();
      this.notifyObservers();
      showNotification('Item removed from cart', 'success');
      return true;
    }
    
    return false;
  }

  /**
   * Update the quantity of an item in the cart
   * @param {string} productId - The ID of the product to update
   * @param {number} quantity - The new quantity
   * @returns {boolean} Whether the operation was successful
   */
  updateQuantity(productId, quantity) {
    quantity = parseInt(quantity);
    
    if (isNaN(quantity)) {
      console.error('Invalid quantity:', quantity);
      return false;
    }

    const itemIndex = this.items.findIndex(item => item.id === productId);
    
    if (itemIndex === -1) {
      console.error('Item not found in cart:', productId);
      return false;
    }

    if (quantity <= 0) {
      return this.removeItem(productId);
    }

    this.items[itemIndex].quantity = quantity;
    this.saveCart();
    this.notifyObservers();
    showNotification('Cart updated', 'success');
    return true;
  }

  /**
   * Clear all items from the cart
   */
  clearCart() {
    this.items = [];
    this.saveCart();
    this.notifyObservers();
    showNotification('Cart cleared', 'success');
  }

  /**
   * Get all items in the cart
   * @returns {Array} Array of cart items
   */
  getItems() {
    return [...this.items];
  }

  /**
   * Get the total number of items in the cart
   * @returns {number} Total item count
   */
  getTotalCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get the subtotal price of all items in the cart
   * @returns {number} Subtotal price
   */
  getSubtotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Check if the cart has a specific item
   * @param {string} productId - The ID of the product to check
   * @returns {boolean} Whether the item is in the cart
   */
  hasItem(productId) {
    return this.items.some(item => item.id === productId);
  }

  /**
   * Get the quantity of a specific item in the cart
   * @param {string} productId - The ID of the product to check
   * @returns {number} The quantity (0 if not in cart)
   */
  getItemQuantity(productId) {
    const item = this.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }

  /**
   * Save the cart for a logged-in user
   * @param {string} userId - The user ID to save the cart for
   * @returns {Promise} Promise that resolves when cart is saved
   */
  async saveForUser(userId) {
    try {
      const result = await shopService.saveCart(this.items);
      
      if (result) {
        showNotification('Cart saved to your account', 'success');
        return true;
      } else {
        showNotification('Failed to save cart to your account', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error saving cart for user:', error);
      showNotification('Error saving cart to your account', 'error');
      return false;
    }
  }

  /**
   * Load the cart for a logged-in user
   * @param {string} userId - The user ID to load the cart for
   * @returns {Promise} Promise that resolves when cart is loaded
   */
  async loadForUser(userId) {
    try {
      const cartItems = await shopService.loadCart();
      
      if (cartItems && cartItems.length > 0) {
        this.items = cartItems;
        this.saveCart(); // Also save to localStorage for offline access
        this.notifyObservers();
        showNotification('Cart loaded from your account', 'success');
        return true;
      } else {
        showNotification('No saved cart found for your account', 'info');
        return false;
      }
    } catch (error) {
      console.error('Error loading cart for user:', error);
      showNotification('Error loading your saved cart', 'error');
      return false;
    }
  }

  /**
   * Synchronize cart between local storage and server (for logged-in users)
   * This merges items from server and local storage to ensure no items are lost
   * @param {string} userId - The user ID to synchronize for
   * @returns {Promise} Promise that resolves when cart is synchronized
   */
  async synchronizeCart(userId) {
    try {
      // First load the local cart
      this.loadCart();
      const localItems = [...this.items];
      
      // Then load the server cart
      const serverItems = await shopService.loadCart();
      
      if (!serverItems || serverItems.length === 0) {
        // If no server cart, save local cart to server
        if (localItems.length > 0) {
          await shopService.saveCart(localItems);
          showNotification('Your cart has been saved to your account', 'success');
        }
        return true;
      }
      
      // Merge server and local items
      const mergedItems = [...serverItems];
      
      // Add local items that aren't in the server cart
      for (const localItem of localItems) {
        const existingItemIndex = mergedItems.findIndex(item => item.id === localItem.id);
        
        if (existingItemIndex >= 0) {
          // If item exists in both, use the higher quantity
          mergedItems[existingItemIndex].quantity = Math.max(
            mergedItems[existingItemIndex].quantity,
            localItem.quantity
          );
        } else {
          // If item only in local cart, add it
          mergedItems.push(localItem);
        }
      }
      
      // Update local cart with merged items
      this.items = mergedItems;
      this.saveCart();
      this.notifyObservers();
      
      // Save merged cart to server
      await shopService.saveCart(mergedItems);
      
      showNotification('Your cart has been synchronized with your account', 'success');
      return true;
    } catch (error) {
      console.error('Error synchronizing cart:', error);
      showNotification('Failed to synchronize your cart', 'error');
      return false;
    }
  }

  /**
   * Add an observer to be notified of cart changes
   * @param {Function} callback - Function to call when cart changes
   */
  addObserver(callback) {
    if (typeof callback === 'function' && !this.observers.includes(callback)) {
      this.observers.push(callback);
    }
  }

  /**
   * Remove an observer
   * @param {Function} callback - The observer function to remove
   */
  removeObserver(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notify all observers of cart changes
   */
  notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.getItems(), this.getTotalCount(), this.getSubtotal());
      } catch (error) {
        console.error('Error in cart observer:', error);
      }
    });
  }
}

// Export a singleton instance
const cart = new ShoppingCart();
export default cart; 