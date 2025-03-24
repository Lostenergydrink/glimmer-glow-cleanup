/**
 * Cart UI Module
 * Handles the display and interaction with the shopping cart in the UI.
 * Provides methods for rendering the cart, updating quantities, and managing the cart display.
 */

import cart from './cart.js';
import { formatCurrency } from '../utils/formatting.js';
import { showConfirmDialog } from '../utils/dialogs.js';
import { authService } from '../../client/services/auth.service.js'; // Import auth service
import { shopService } from '../../client/services/shop.service.js'; // Import shop service

class CartUI {
  constructor() {
    this.cartContainer = null;
    this.cartItemsContainer = null;
    this.cartSummaryContainer = null;
    this.cartToggleButton = null;
    this.cartCount = null;
    this.isInitialized = false;
    this.isCartOpen = false;
    this.isAuthenticated = false;
    this.userId = null;
  }

  /**
   * Initialize the cart UI
   * @param {Object} options - Configuration options
   */
  init(options = {}) {
    if (this.isInitialized) return;

    // Get cart elements from DOM
    this.cartContainer = document.getElementById(options.cartContainerId || 'cart-container');
    this.cartItemsContainer = document.getElementById(options.cartItemsContainerId || 'cart-items');
    this.cartSummaryContainer = document.getElementById(options.cartSummaryContainerId || 'cart-summary');
    this.cartToggleButton = document.getElementById(options.cartToggleButtonId || 'cart-toggle');
    this.cartCount = document.getElementById(options.cartCountId || 'cart-count');
    this.checkoutButton = document.getElementById(options.checkoutButtonId || 'checkout-button');
    this.clearCartButton = document.getElementById(options.clearCartButtonId || 'clear-cart-button');

    // Check authentication status
    this.checkAuthStatus();

    // Initialize the cart state
    cart.init();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Add observer to cart for updates
    cart.addObserver((items, count, subtotal) => this.updateCartUI(items, count, subtotal));
    
    // Initial render
    this.updateCartUI(cart.getItems(), cart.getTotalCount(), cart.getSubtotal());
    
    this.isInitialized = true;
  }
  
  /**
   * Check authentication status and load appropriate cart
   */
  async checkAuthStatus() {
    try {
      const authStatus = await authService.checkAuthStatus();
      this.isAuthenticated = authStatus.isAuthenticated;
      this.userId = authStatus.userId;
      
      if (this.isAuthenticated && this.userId) {
        // If user is authenticated, synchronize cart
        await cart.synchronizeCart(this.userId);
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      // Continue with local cart if auth check fails
    }
  }

  /**
   * Set up event listeners for cart UI elements
   */
  setupEventListeners() {
    // Toggle cart visibility when cart button is clicked
    if (this.cartToggleButton) {
      this.cartToggleButton.addEventListener('click', () => this.toggleCartVisibility());
    }

    // Setup checkout button
    if (this.checkoutButton) {
      this.checkoutButton.addEventListener('click', () => this.handleCheckout());
    }

    // Setup clear cart button
    if (this.clearCartButton) {
      this.clearCartButton.addEventListener('click', () => this.handleClearCart());
    }

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isCartOpen && 
          this.cartContainer && 
          !this.cartContainer.contains(e.target) && 
          this.cartToggleButton && 
          !this.cartToggleButton.contains(e.target)) {
        this.toggleCartVisibility(false);
      }
    });
  }

  /**
   * Toggle the visibility of the cart panel
   * @param {boolean} [force] - Force a specific state (open/closed)
   */
  toggleCartVisibility(force) {
    const newState = force !== undefined ? force : !this.isCartOpen;
    
    if (this.cartContainer) {
      if (newState) {
        this.cartContainer.classList.add('active');
      } else {
        this.cartContainer.classList.remove('active');
      }
    }
    
    this.isCartOpen = newState;
  }

  /**
   * Update the cart UI with new data
   * @param {Array} items - Cart items
   * @param {number} count - Total item count
   * @param {number} subtotal - Cart subtotal
   */
  updateCartUI(items, count, subtotal) {
    // Update cart count
    if (this.cartCount) {
      this.cartCount.textContent = count;
      
      // Show or hide the count indicator
      if (count > 0) {
        this.cartCount.classList.add('has-items');
      } else {
        this.cartCount.classList.remove('has-items');
      }
    }

    // Update cart items
    if (this.cartItemsContainer) {
      this.renderCartItems(items);
    }

    // Update cart summary
    if (this.cartSummaryContainer) {
      this.renderCartSummary(subtotal);
    }

    // Update checkout button state
    if (this.checkoutButton) {
      this.checkoutButton.disabled = count === 0;
    }

    // Update clear cart button state
    if (this.clearCartButton) {
      this.clearCartButton.disabled = count === 0;
    }
  }

  /**
   * Render the cart items
   * @param {Array} items - Cart items to render
   */
  renderCartItems(items) {
    if (!this.cartItemsContainer) return;

    if (items.length === 0) {
      this.cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
      return;
    }

    const itemsHtml = items.map(item => `
      <div class="cart-item" data-product-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image || '/images/products/placeholder.jpg'}" alt="${item.name}">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <div class="cart-item-price">${formatCurrency(item.price)}</div>
          <div class="cart-item-quantity">
            <button class="quantity-btn quantity-decrease" data-product-id="${item.id}">-</button>
            <input type="number" min="1" value="${item.quantity}" class="quantity-input" data-product-id="${item.id}">
            <button class="quantity-btn quantity-increase" data-product-id="${item.id}">+</button>
          </div>
        </div>
        <div class="cart-item-subtotal">
          ${formatCurrency(item.price * item.quantity)}
        </div>
        <button class="remove-item-btn" data-product-id="${item.id}">×</button>
      </div>
    `).join('');

    this.cartItemsContainer.innerHTML = itemsHtml;

    // Add event listeners to the newly created elements
    this.addCartItemEventListeners();
  }

  /**
   * Add event listeners to cart item elements
   */
  addCartItemEventListeners() {
    // Event listener for remove buttons
    const removeButtons = this.cartItemsContainer.querySelectorAll('.remove-item-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        this.handleRemoveItem(productId);
      });
    });

    // Event listener for quantity decrease buttons
    const decreaseButtons = this.cartItemsContainer.querySelectorAll('.quantity-decrease');
    decreaseButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        const currentQty = cart.getItemQuantity(productId);
        if (currentQty > 1) {
          cart.updateQuantity(productId, currentQty - 1);
        } else {
          this.handleRemoveItem(productId);
        }
      });
    });

    // Event listener for quantity increase buttons
    const increaseButtons = this.cartItemsContainer.querySelectorAll('.quantity-increase');
    increaseButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        const currentQty = cart.getItemQuantity(productId);
        cart.updateQuantity(productId, currentQty + 1);
      });
    });

    // Event listener for quantity input fields
    const quantityInputs = this.cartItemsContainer.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const productId = e.target.dataset.productId;
        const newQuantity = parseInt(e.target.value);
        if (!isNaN(newQuantity) && newQuantity > 0) {
          cart.updateQuantity(productId, newQuantity);
        } else {
          // Reset to current quantity if invalid
          e.target.value = cart.getItemQuantity(productId);
        }
      });
    });
  }

  /**
   * Render the cart summary
   * @param {number} subtotal - Cart subtotal
   */
  renderCartSummary(subtotal) {
    if (!this.cartSummaryContainer) return;

    this.cartSummaryContainer.innerHTML = `
      <div class="cart-summary-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      <div class="cart-summary-row">
        <span>Shipping:</span>
        <span>${subtotal > 0 ? 'Calculated at checkout' : '-'}</span>
      </div>
      <div class="cart-summary-row cart-total">
        <span>Estimated Total:</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
    `;
  }

  /**
   * Handle removing an item from the cart
   * @param {string} productId - Product ID to remove
   */
  async handleRemoveItem(productId) {
    // Find the item in the cart
    const items = cart.getItems();
    const itemToRemove = items.find(item => item.id === productId);
    
    if (!itemToRemove) return;

    // For single quantity items, confirm removal
    if (itemToRemove.quantity === 1) {
      const confirmed = await showConfirmDialog(
        'Remove Item', 
        `Are you sure you want to remove ${itemToRemove.name} from your cart?`,
        'Remove',
        'Cancel'
      );
      
      if (confirmed) {
        cart.removeItem(productId);
      }
    } else {
      // For multiple quantity items, just reduce by one
      cart.updateQuantity(productId, itemToRemove.quantity - 1);
    }
  }

  /**
   * Handle the checkout process
   */
  handleCheckout() {
    if (cart.getTotalCount() === 0) {
      alert('Your cart is empty.');
      return;
    }
    
    if (!this.isAuthenticated) {
      // Prompt user to login before checkout
      if (confirm('Please login to complete your purchase. Would you like to login now?')) {
        // Store cart in localStorage before redirecting
        cart.saveCart();
        // Redirect to login page with return URL
        window.location.href = `/login?returnUrl=${encodeURIComponent('/pages/checkout.html')}`;
      }
      return;
    }
    
    // For authenticated users, proceed to checkout
    window.location.href = '/pages/checkout.html';
  }

  /**
   * Handle clearing the cart
   */
  async handleClearCart() {
    const confirmed = await showConfirmDialog('Are you sure you want to clear your cart?');
    
    if (confirmed) {
      cart.clearCart();
      
      // If authenticated, clear cart on server too
      if (this.isAuthenticated && this.userId) {
        try {
          await shopService.clearCart();
        } catch (error) {
          console.error('Error clearing server cart:', error);
          // Local cart was already cleared, just log the error
        }
      }
    }
  }
}

// Export a singleton instance
const cartUI = new CartUI();
export default cartUI; 