/**
 * Shopping Cart Tests
 * 
 * Tests for the cart functionality including:
 * - Adding items
 * - Removing items
 * - Updating quantities
 * - Calculating totals
 * - Synchronizing with server
 */

import cart from '../../scripts/shop/cart.js';
import { shopService } from '../../client/services/shop.service.js';

// Mock dependencies
jest.mock('../../client/services/shop.service.js', () => ({
  shopService: {
    saveCart: jest.fn(),
    loadCart: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Shopping Cart', () => {
  // Mock product data
  const mockProduct = {
    id: 'product1',
    name: 'Test Product',
    price: 19.99,
    image: '../images/products/test.jpg'
  };

  // Mock cart items for server
  const mockServerItems = [
    {
      id: 'product2',
      name: 'Server Product',
      price: 29.99,
      quantity: 1
    }
  ];

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset cart state
    cart.clearCart();
    
    // Force initialization
    cart.initialized = false;
    cart.init();
  });

  describe('Cart Initialization', () => {
    test('should initialize cart from localStorage', () => {
      // Arrange
      const cartItems = [{ id: 'product1', name: 'Test', price: 10, quantity: 1 }];
      localStorageMock.setItem('glimmerGlowCart', JSON.stringify(cartItems));
      
      // Act
      cart.initialized = false;
      cart.init();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('glimmerGlowCart');
      expect(cart.getItems()).toEqual(cartItems);
    });
  });

  describe('Cart Operations', () => {
    test('should add a new item to the cart', () => {
      // Act
      const result = cart.addItem(mockProduct);
      
      // Assert
      expect(result).toBe(true);
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].id).toBe(mockProduct.id);
      expect(cart.getItems()[0].quantity).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should increase quantity when adding existing item', () => {
      // Arrange
      cart.addItem(mockProduct);
      
      // Act
      cart.addItem(mockProduct, 2);
      
      // Assert
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].quantity).toBe(3);
    });

    test('should handle adding item with custom quantity', () => {
      // Act
      cart.addItem(mockProduct, 5);
      
      // Assert
      expect(cart.getItems()[0].quantity).toBe(5);
    });

    test('should remove item from cart', () => {
      // Arrange
      cart.addItem(mockProduct);
      
      // Act
      const result = cart.removeItem(mockProduct.id);
      
      // Assert
      expect(result).toBe(true);
      expect(cart.getItems()).toHaveLength(0);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should update item quantity', () => {
      // Arrange
      cart.addItem(mockProduct);
      
      // Act
      const result = cart.updateQuantity(mockProduct.id, 3);
      
      // Assert
      expect(result).toBe(true);
      expect(cart.getItems()[0].quantity).toBe(3);
    });

    test('should remove item when updating quantity to zero', () => {
      // Arrange
      cart.addItem(mockProduct);
      
      // Act
      cart.updateQuantity(mockProduct.id, 0);
      
      // Assert
      expect(cart.getItems()).toHaveLength(0);
    });

    test('should clear the cart', () => {
      // Arrange
      cart.addItem(mockProduct);
      
      // Act
      cart.clearCart();
      
      // Assert
      expect(cart.getItems()).toHaveLength(0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('glimmerGlowCart', '[]');
    });
  });

  describe('Cart Calculations', () => {
    test('should calculate total item count', () => {
      // Arrange
      cart.addItem(mockProduct, 2);
      cart.addItem({ ...mockProduct, id: 'product2' }, 3);
      
      // Act
      const totalCount = cart.getTotalCount();
      
      // Assert
      expect(totalCount).toBe(5);
    });

    test('should calculate subtotal', () => {
      // Arrange
      cart.addItem(mockProduct, 2); // 2 * 19.99 = 39.98
      cart.addItem({ ...mockProduct, id: 'product2', price: 25.50 }, 1); // 1 * 25.50 = 25.50
      
      // Act
      const subtotal = cart.getSubtotal();
      
      // Assert
      expect(subtotal).toBeCloseTo(65.48, 2);
    });

    test('should check if item exists in cart', () => {
      // Arrange
      cart.addItem(mockProduct);
      
      // Act & Assert
      expect(cart.hasItem(mockProduct.id)).toBe(true);
      expect(cart.hasItem('nonexistent')).toBe(false);
    });

    test('should get item quantity', () => {
      // Arrange
      cart.addItem(mockProduct, 3);
      
      // Act & Assert
      expect(cart.getItemQuantity(mockProduct.id)).toBe(3);
      expect(cart.getItemQuantity('nonexistent')).toBe(0);
    });
  });

  describe('Cart Synchronization', () => {
    test('should save cart for logged-in user', async () => {
      // Arrange
      cart.addItem(mockProduct);
      shopService.saveCart.mockResolvedValueOnce(true);
      
      // Act
      const result = await cart.saveForUser('user123');
      
      // Assert
      expect(result).toBe(true);
      expect(shopService.saveCart).toHaveBeenCalledWith(cart.getItems());
    });

    test('should load cart for logged-in user', async () => {
      // Arrange
      shopService.loadCart.mockResolvedValueOnce(mockServerItems);
      
      // Act
      const result = await cart.loadForUser('user123');
      
      // Assert
      expect(result).toBe(true);
      expect(cart.getItems()).toEqual(mockServerItems);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should merge local and server cart during synchronization', async () => {
      // Arrange
      cart.addItem(mockProduct, 2); // Local cart has product1 with quantity 2
      shopService.loadCart.mockResolvedValueOnce([
        { id: 'product1', name: 'Test Product', price: 19.99, quantity: 1 }, // Server has product1 with quantity 1
        { id: 'product3', name: 'Server Only', price: 39.99, quantity: 1 } // Server has unique product3
      ]);
      shopService.saveCart.mockResolvedValueOnce(true);
      
      // Act
      await cart.synchronizeCart('user123');
      
      // Assert
      const cartItems = cart.getItems();
      expect(cartItems).toHaveLength(2);
      
      // Should keep the higher quantity for product1
      const product1 = cartItems.find(item => item.id === 'product1');
      expect(product1.quantity).toBe(2);
      
      // Should add the server-only product
      const product3 = cartItems.find(item => item.id === 'product3');
      expect(product3).toBeDefined();
      
      // Should save the merged cart back to the server
      expect(shopService.saveCart).toHaveBeenCalled();
    });
  });

  describe('Observer Pattern', () => {
    test('should notify observers when cart changes', () => {
      // Arrange
      const observer = jest.fn();
      cart.addObserver(observer);
      
      // Act
      cart.addItem(mockProduct);
      
      // Assert
      expect(observer).toHaveBeenCalled();
      expect(observer).toHaveBeenCalledWith(
        cart.getItems(),
        cart.getTotalCount(),
        cart.getSubtotal()
      );
    });

    test('should allow removing observers', () => {
      // Arrange
      const observer = jest.fn();
      cart.addObserver(observer);
      
      // Act
      cart.removeObserver(observer);
      cart.addItem(mockProduct);
      
      // Assert
      expect(observer).not.toHaveBeenCalled();
    });
  });
}); 