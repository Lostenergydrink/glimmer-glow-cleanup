/**
 * Wishlist Tests
 * 
 * Tests for the wishlist functionality including:
 * - Adding items
 * - Removing items
 * - Toggling items
 * - Moving to cart
 * - Synchronizing with server
 */

import wishlist from '../../scripts/shop/wishlist.js';
import { shopService } from '../../client/services/shop.service.js';
import { authService } from '../../client/services/auth.service.js';
import cart from '../../scripts/shop/cart.js';

// Mock dependencies
jest.mock('../../client/services/shop.service.js', () => ({
  shopService: {
    getProductById: jest.fn(),
    loadWishlist: jest.fn(),
    saveWishlist: jest.fn(),
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn()
  }
}));

jest.mock('../../client/services/auth.service.js', () => ({
  authService: {
    checkAuthStatus: jest.fn()
  }
}));

jest.mock('../../scripts/shop/cart.js', () => ({
  addItem: jest.fn()
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

describe('Wishlist', () => {
  const mockProduct = {
    id: 'product1',
    name: 'Test Product',
    price: 19.99,
    image: '../images/products/test.jpg'
  };

  // Reset module between tests since it's a singleton
  let originalWishlist;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Save original wishlist methods
    originalWishlist = { ...wishlist };
    
    // Mock unauthenticated user by default
    authService.checkAuthStatus.mockResolvedValue({
      isAuthenticated: false,
      userId: null,
      user: null
    });
  });

  afterEach(() => {
    // Restore original wishlist methods
    Object.keys(originalWishlist).forEach(key => {
      wishlist[key] = originalWishlist[key];
    });
  });

  describe('Wishlist Initialization', () => {
    test('should load wishlist from localStorage when not authenticated', async () => {
      // Arrange
      const wishlistItems = ['product1', 'product2'];
      localStorageMock.setItem('glimmer-glow-wishlist', JSON.stringify(wishlistItems));
      
      // Act - force reinitialization
      await wishlist.init();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('glimmer-glow-wishlist');
      expect(wishlist.getItems()).toEqual(wishlistItems);
      expect(shopService.loadWishlist).not.toHaveBeenCalled();
    });

    test('should synchronize wishlist with server when authenticated', async () => {
      // Arrange
      const localItems = ['product1', 'product2'];
      const serverItems = ['product2', 'product3'];
      localStorageMock.setItem('glimmer-glow-wishlist', JSON.stringify(localItems));
      
      // Mock authenticated user
      authService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: true,
        userId: 'user123',
        user: { email: 'test@example.com' }
      });
      
      // Mock server wishlist
      shopService.loadWishlist.mockResolvedValue(serverItems);
      
      // Act - force reinitialization
      await wishlist.init();
      
      // Assert
      expect(shopService.loadWishlist).toHaveBeenCalled();
      
      // Should have merged local and server items
      const mergedItems = wishlist.getItems();
      expect(mergedItems).toContain('product1');
      expect(mergedItems).toContain('product2');
      expect(mergedItems).toContain('product3');
      
      // Should save merged wishlist to server
      expect(shopService.saveWishlist).toHaveBeenCalled();
    });
  });

  describe('Wishlist Operations', () => {
    test('should add item to wishlist', async () => {
      // Arrange
      const productId = 'product1';
      shopService.addToWishlist.mockResolvedValue(true);
      
      // Act
      const result = await wishlist.addItem(productId);
      
      // Assert
      expect(result).toBe(true);
      expect(wishlist.hasItem(productId)).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Should not call server API when not authenticated
      expect(shopService.addToWishlist).not.toHaveBeenCalled();
    });

    test('should add item to server wishlist when authenticated', async () => {
      // Arrange
      const productId = 'product1';
      
      // Mock authenticated user
      authService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: true,
        userId: 'user123'
      });
      
      // Force reinitialization with authenticated user
      await wishlist.init();
      
      shopService.addToWishlist.mockResolvedValue(true);
      
      // Act
      const result = await wishlist.addItem(productId);
      
      // Assert
      expect(result).toBe(true);
      expect(wishlist.hasItem(productId)).toBe(true);
      expect(shopService.addToWishlist).toHaveBeenCalledWith(productId);
    });

    test('should remove item from wishlist', async () => {
      // Arrange
      const productId = 'product1';
      await wishlist.addItem(productId);
      shopService.removeFromWishlist.mockResolvedValue(true);
      
      // Act
      const result = await wishlist.removeItem(productId);
      
      // Assert
      expect(result).toBe(true);
      expect(wishlist.hasItem(productId)).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Should not call server API when not authenticated
      expect(shopService.removeFromWishlist).not.toHaveBeenCalled();
    });

    test('should remove item from server wishlist when authenticated', async () => {
      // Arrange
      const productId = 'product1';
      
      // Mock authenticated user
      authService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: true,
        userId: 'user123'
      });
      
      // Force reinitialization with authenticated user
      await wishlist.init();
      
      await wishlist.addItem(productId);
      shopService.removeFromWishlist.mockResolvedValue(true);
      
      // Act
      const result = await wishlist.removeItem(productId);
      
      // Assert
      expect(result).toBe(true);
      expect(wishlist.hasItem(productId)).toBe(false);
      expect(shopService.removeFromWishlist).toHaveBeenCalledWith(productId);
    });

    test('should toggle item in wishlist', async () => {
      // Arrange
      const productId = 'product1';
      
      // Act - add via toggle
      const addResult = await wishlist.toggleItem(productId);
      
      // Assert
      expect(addResult).toBe(true);
      expect(wishlist.hasItem(productId)).toBe(true);
      
      // Act - remove via toggle
      const removeResult = await wishlist.toggleItem(productId);
      
      // Assert
      expect(removeResult).toBe(false);
      expect(wishlist.hasItem(productId)).toBe(false);
    });

    test('should check if item exists in wishlist', async () => {
      // Arrange
      const productId = 'product1';
      await wishlist.addItem(productId);
      
      // Act & Assert
      expect(wishlist.hasItem(productId)).toBe(true);
      expect(wishlist.hasItem('nonexistent')).toBe(false);
    });

    test('should clear the wishlist', () => {
      // Arrange
      wishlist.addItem('product1');
      wishlist.addItem('product2');
      
      // Act
      wishlist.clear();
      
      // Assert
      expect(wishlist.getItems()).toHaveLength(0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('glimmer-glow-wishlist', '[]');
    });
  });

  describe('Move to Cart', () => {
    test('should move item from wishlist to cart', async () => {
      // Arrange
      const productId = 'product1';
      await wishlist.addItem(productId);
      
      shopService.getProductById.mockResolvedValue(mockProduct);
      cart.addItem.mockReturnValue(true);
      
      // Act
      const result = await wishlist.moveToCart(productId);
      
      // Assert
      expect(result).toBe(true);
      expect(shopService.getProductById).toHaveBeenCalledWith(productId);
      expect(cart.addItem).toHaveBeenCalledWith(mockProduct);
      expect(wishlist.hasItem(productId)).toBe(false);
    });

    test('should handle errors when fetching product', async () => {
      // Arrange
      const productId = 'product1';
      await wishlist.addItem(productId);
      
      shopService.getProductById.mockRejectedValue(new Error('Product not found'));
      
      // Act
      const result = await wishlist.moveToCart(productId);
      
      // Assert
      expect(result).toBe(false);
      expect(cart.addItem).not.toHaveBeenCalled();
      expect(wishlist.hasItem(productId)).toBe(true); // Item should remain in wishlist
    });
  });

  describe('Observer Pattern', () => {
    test('should notify observers when wishlist changes', async () => {
      // Arrange
      const observer = jest.fn();
      wishlist.addObserver(observer);
      
      // Act
      await wishlist.addItem('product1');
      
      // Assert
      expect(observer).toHaveBeenCalled();
      expect(observer).toHaveBeenCalledWith(wishlist.getItems());
    });

    test('should allow removing observers', async () => {
      // Arrange
      const observer = jest.fn();
      wishlist.addObserver(observer);
      
      // Act
      wishlist.removeObserver(observer);
      await wishlist.addItem('product1');
      
      // Assert
      expect(observer).not.toHaveBeenCalled();
    });
  });
}); 