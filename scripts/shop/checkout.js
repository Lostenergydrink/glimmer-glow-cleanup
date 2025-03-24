/**
 * Checkout Script
 * Handles the checkout process for the shop, including cart review,
 * shipping details, payment processing, and order confirmation.
 */

import { select, selectAll, addEvent, showNotification } from '../utils/utilities.js';
import { formatCurrency } from '../utils/formatting.js';
import { shopService } from '../../client/services/shop.service.js';
import { authService } from '../../client/services/auth.service.js';
import cart from './cart.js';

// State management
const state = {
  currentStep: 'cart',
  cart: {
    items: [],
    subtotal: 0,
    shipping: 5.99, // Default to standard shipping
    tax: 0,
    total: 0
  },
  shipping: {
    firstName: '',
    lastName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    method: 'standard'
  },
  payment: {
    method: 'credit-card',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  },
  order: {
    orderId: '',
    status: '',
    createdAt: null
  },
  user: {
    isAuthenticated: false,
    email: ''
  }
};

// Initialize checkout
async function initCheckout() {
  // Check authentication
  const authStatus = await authService.checkAuthStatus();
  state.user.isAuthenticated = authStatus.isAuthenticated;
  state.user.email = authStatus.user?.email || '';
  
  // If not authenticated, redirect to login
  if (!state.user.isAuthenticated) {
    window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
  
  // Load cart
  loadCart();
  
  // Add event listeners
  setupEventListeners();
  
  // Set up PayPal
  setupPayPal();
}

/**
 * Load cart contents and calculate totals
 */
function loadCart() {
  // Get cart items
  const items = cart.getItems();
  state.cart.items = items;
  
  // Calculate subtotal
  state.cart.subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Calculate tax (assume 8%)
  state.cart.tax = state.cart.subtotal * 0.08;
  
  // Calculate total
  updateCartTotals();
  
  // Render cart items
  renderCartItems();
}

/**
 * Update cart totals based on current state
 */
function updateCartTotals() {
  state.cart.total = state.cart.subtotal + state.cart.shipping + state.cart.tax;
  
  // Update UI
  select('#cart-subtotal').textContent = formatCurrency(state.cart.subtotal);
  select('#cart-shipping').textContent = formatCurrency(state.cart.shipping);
  select('#cart-tax').textContent = formatCurrency(state.cart.tax);
  select('#cart-total').textContent = formatCurrency(state.cart.total);
}

/**
 * Render cart items in the checkout
 */
function renderCartItems() {
  const cartItemsContainer = select('#checkout-cart-items');
  if (!cartItemsContainer) return;
  
  if (state.cart.items.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
    select('#proceed-to-shipping').disabled = true;
    return;
  }
  
  const itemsHtml = state.cart.items.map(item => `
    <div class="checkout-item">
      <div class="item-image">
        <img src="${item.image || '../assets/images/products/placeholder.jpg'}" alt="${item.name}">
      </div>
      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <div class="item-quantity">Quantity: ${item.quantity}</div>
      </div>
      <div class="item-price">${formatCurrency(item.price * item.quantity)}</div>
    </div>
  `).join('');
  
  cartItemsContainer.innerHTML = itemsHtml;
  select('#proceed-to-shipping').disabled = false;
}

/**
 * Set up event listeners for checkout steps
 */
function setupEventListeners() {
  // Step navigation buttons
  addEvent(select('#proceed-to-shipping'), 'click', () => navigateToStep('shipping'));
  addEvent(select('#back-to-cart'), 'click', () => navigateToStep('cart'));
  addEvent(select('#back-to-shipping'), 'click', () => navigateToStep('shipping'));
  addEvent(select('#back-to-shipping-paypal'), 'click', () => navigateToStep('shipping'));
  
  // Shipping form submission
  addEvent(select('#shipping-form'), 'submit', (e) => {
    e.preventDefault();
    handleShippingFormSubmit();
  });
  
  // Payment method selection
  const paymentMethods = selectAll('input[name="paymentMethod"]');
  paymentMethods.forEach(radio => {
    addEvent(radio, 'change', handlePaymentMethodChange);
  });
  
  // Credit card form submission
  addEvent(select('#credit-card-form'), 'submit', (e) => {
    e.preventDefault();
    handleCreditCardSubmit();
  });
  
  // Shipping method selection
  const shippingMethods = selectAll('input[name="shippingMethod"]');
  shippingMethods.forEach(radio => {
    addEvent(radio, 'change', handleShippingMethodChange);
  });
}

/**
 * Navigate to a specific checkout step
 * @param {string} step - Step to navigate to (cart, shipping, payment, confirmation)
 */
function navigateToStep(step) {
  // Hide all sections
  selectAll('.checkout-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show the selected section
  select(`#${step}-section`).classList.add('active');
  
  // Update progress indicator
  selectAll('.checkout-step').forEach(stepEl => {
    stepEl.classList.remove('active');
    stepEl.classList.remove('completed');
    
    const stepName = stepEl.dataset.step;
    
    if (stepName === step) {
      stepEl.classList.add('active');
    } else if (getStepIndex(stepName) < getStepIndex(step)) {
      stepEl.classList.add('completed');
    }
  });
  
  // Update current step
  state.currentStep = step;
}

/**
 * Get the index of a step for ordering
 * @param {string} step - Step name
 * @returns {number} Step index
 */
function getStepIndex(step) {
  const steps = ['cart', 'shipping', 'payment', 'confirmation'];
  return steps.indexOf(step);
}

/**
 * Handle shipping form submission
 */
function handleShippingFormSubmit() {
  const form = select('#shipping-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // Save shipping details to state
  state.shipping.firstName = select('#first-name').value;
  state.shipping.lastName = select('#last-name').value;
  state.shipping.address = select('#address').value;
  state.shipping.address2 = select('#address2').value;
  state.shipping.city = select('#city').value;
  state.shipping.state = select('#state').value;
  state.shipping.zip = select('#zip').value;
  state.shipping.phone = select('#phone').value;
  
  // Navigate to payment step
  navigateToStep('payment');
}

/**
 * Handle shipping method change
 */
function handleShippingMethodChange(e) {
  const method = e.target.value;
  state.shipping.method = method;
  
  // Update shipping cost based on method
  switch (method) {
    case 'express':
      state.cart.shipping = 12.99;
      break;
    case 'overnight':
      state.cart.shipping = 24.99;
      break;
    default: // standard
      state.cart.shipping = 5.99;
      break;
  }
  
  // Update totals
  updateCartTotals();
}

/**
 * Handle payment method change
 */
function handlePaymentMethodChange(e) {
  const method = e.target.value;
  state.payment.method = method;
  
  // Show/hide payment forms
  if (method === 'credit-card') {
    select('#credit-card-form').style.display = 'block';
    select('#paypal-container').style.display = 'none';
  } else if (method === 'paypal') {
    select('#credit-card-form').style.display = 'none';
    select('#paypal-container').style.display = 'block';
  }
}

/**
 * Handle credit card form submission
 */
async function handleCreditCardSubmit() {
  const form = select('#credit-card-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // Save payment details to state
  state.payment.cardNumber = select('#card-number').value;
  state.payment.cardName = select('#card-name').value;
  state.payment.expiryDate = select('#expiry-date').value;
  state.payment.cvv = select('#cvv').value;
  
  // Process order
  await processOrder();
}

/**
 * Set up PayPal buttons
 */
function setupPayPal() {
  if (window.paypal) {
    window.paypal.Buttons({
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: state.cart.total.toFixed(2)
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        // Capture the funds from the transaction
        await actions.order.capture();
        
        // Process our order
        state.payment.method = 'paypal';
        state.payment.paypalOrderId = data.orderID;
        await processOrder();
      }
    }).render('#paypal-button-container');
  }
}

/**
 * Process the order
 */
async function processOrder() {
  try {
    // Show loading state
    showProcessingOverlay(true);
    
    // Create order data
    const orderData = {
      items: state.cart.items,
      shipping: state.shipping,
      payment: {
        method: state.payment.method,
        // Only include necessary payment details
        ...(state.payment.method === 'paypal' ? { paypalOrderId: state.payment.paypalOrderId } : {})
      },
      totals: {
        subtotal: state.cart.subtotal,
        shipping: state.cart.shipping,
        tax: state.cart.tax,
        total: state.cart.total
      }
    };
    
    // Submit order to server
    const response = await shopService.createOrder(orderData);
    
    if (response && response.orderId) {
      // Save order info
      state.order.orderId = response.orderId;
      state.order.status = response.status;
      state.order.createdAt = response.createdAt;
      
      // Update order confirmation page
      select('#order-number').textContent = response.orderId;
      select('#order-email').textContent = state.user.email;
      select('#order-total').textContent = formatCurrency(state.cart.total);
      
      // Render order items
      renderOrderItems();
      
      // Clear the cart
      cart.clearCart();
      
      // Navigate to confirmation
      navigateToStep('confirmation');
    } else {
      throw new Error('Failed to create order');
    }
  } catch (error) {
    console.error('Order processing error:', error);
    showNotification('There was a problem processing your order. Please try again.', 'error');
  } finally {
    showProcessingOverlay(false);
  }
}

/**
 * Render order items on confirmation page
 */
function renderOrderItems() {
  const orderItemsContainer = select('#order-items');
  if (!orderItemsContainer) return;
  
  const itemsHtml = state.cart.items.map(item => `
    <div class="order-item">
      <div class="item-name">${item.name} × ${item.quantity}</div>
      <div class="item-price">${formatCurrency(item.price * item.quantity)}</div>
    </div>
  `).join('');
  
  orderItemsContainer.innerHTML = itemsHtml;
}

/**
 * Show/hide processing overlay during order submission
 * @param {boolean} show - Whether to show the overlay
 */
function showProcessingOverlay(show) {
  let overlay = select('#processing-overlay');
  
  if (!overlay && show) {
    overlay = document.createElement('div');
    overlay.id = 'processing-overlay';
    overlay.innerHTML = `
      <div class="processing-content">
        <div class="spinner"></div>
        <div class="processing-text">Processing your order...</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
  
  if (!show && overlay) {
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  }
}

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', initCheckout); 