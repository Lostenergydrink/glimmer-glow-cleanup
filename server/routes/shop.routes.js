/**
 * Shop Routes
 * 
 * Defines API endpoints for the shop system:
 * - Product management
 * - Category management
 * - Shopping cart
 * - Wishlist
 * - Orders and checkout
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateSchema } = require('../middleware/validation.middleware');
const { databaseService } = require('../services/database.service');
const { schemas } = require('../schemas/shop.schemas');

/**
 * Product Routes
 */

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await databaseService.getProducts();
    res.json(databaseService.transformDatabaseFields(products));
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await databaseService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(databaseService.transformDatabaseFields(product));
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

/**
 * Category Routes
 */

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await databaseService.getCategories();
    res.json(databaseService.transformDatabaseFields(categories));
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get products by category
router.get('/categories/:id/products', async (req, res) => {
  try {
    const products = await databaseService.getProductsByCategory(req.params.id);
    res.json(databaseService.transformDatabaseFields(products));
  } catch (error) {
    console.error('Error getting category products:', error);
    res.status(500).json({ error: 'Failed to get category products' });
  }
});

/**
 * Cart Routes
 */

// Get user's cart
router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const cart = await databaseService.loadCart(req.user.id);
    res.json({ items: cart });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// Save cart
router.post('/cart', authenticateToken, validateSchema(schemas.cartSchema), async (req, res) => {
  try {
    const savedCart = await databaseService.saveCart(req.user.id, req.body.items);
    res.json({ success: true, cart: databaseService.transformDatabaseFields(savedCart) });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

// Clear cart
router.delete('/cart', authenticateToken, async (req, res) => {
  try {
    await databaseService.clearCart(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Add item to cart
router.post('/cart/items', authenticateToken, validateSchema(schemas.cartItemSchema), async (req, res) => {
  try {
    // Get current cart
    const currentCart = await databaseService.loadCart(req.user.id);
    
    // Check if product exists
    const product = await databaseService.getProductById(req.body.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if item already in cart
    const existingItemIndex = currentCart.findIndex(item => item.id === req.body.productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      currentCart[existingItemIndex].quantity += req.body.quantity;
    } else {
      // Add new item to cart
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: req.body.quantity,
        image: product.image_url
      });
    }
    
    // Save updated cart
    const updatedCart = await databaseService.saveCart(req.user.id, currentCart);
    
    res.json({ 
      success: true, 
      cart: databaseService.transformDatabaseFields(updatedCart)
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Remove item from cart
router.delete('/cart/items/:productId', authenticateToken, async (req, res) => {
  try {
    // Get current cart
    const currentCart = await databaseService.loadCart(req.user.id);
    
    // Remove item
    const updatedItems = currentCart.filter(item => item.id !== req.params.productId);
    
    // Save updated cart
    const updatedCart = await databaseService.saveCart(req.user.id, updatedItems);
    
    res.json({ 
      success: true, 
      cart: databaseService.transformDatabaseFields(updatedCart)
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Update cart item quantity
router.put('/cart/items/:productId', authenticateToken, validateSchema(schemas.cartItemUpdateSchema), async (req, res) => {
  try {
    // Get current cart
    const currentCart = await databaseService.loadCart(req.user.id);
    
    // Find item
    const itemIndex = currentCart.findIndex(item => item.id === req.params.productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    // Update quantity
    currentCart[itemIndex].quantity = req.body.quantity;
    
    // Remove item if quantity is 0
    if (req.body.quantity <= 0) {
      currentCart.splice(itemIndex, 1);
    }
    
    // Save updated cart
    const updatedCart = await databaseService.saveCart(req.user.id, currentCart);
    
    res.json({ 
      success: true, 
      cart: databaseService.transformDatabaseFields(updatedCart)
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

/**
 * Wishlist Routes
 */

// Get user's wishlist
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlist = await databaseService.loadWishlist(req.user.id);
    res.json({ items: wishlist });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({ error: 'Failed to get wishlist' });
  }
});

// Save wishlist
router.post('/wishlist', authenticateToken, validateSchema(schemas.wishlistSchema), async (req, res) => {
  try {
    const savedWishlist = await databaseService.saveWishlist(req.user.id, req.body.items);
    res.json({ 
      success: true, 
      wishlist: databaseService.transformDatabaseFields(savedWishlist)
    });
  } catch (error) {
    console.error('Error saving wishlist:', error);
    res.status(500).json({ error: 'Failed to save wishlist' });
  }
});

// Add item to wishlist
router.post('/wishlist/items', authenticateToken, validateSchema(schemas.wishlistItemSchema), async (req, res) => {
  try {
    // Get current wishlist
    const currentWishlist = await databaseService.loadWishlist(req.user.id);
    
    // Check if product exists
    const product = await databaseService.getProductById(req.body.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if item already in wishlist
    const existingItem = currentWishlist.find(item => item.id === req.body.productId);
    
    if (!existingItem) {
      // Add new item to wishlist
      currentWishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url
      });
      
      // Save updated wishlist
      const updatedWishlist = await databaseService.saveWishlist(req.user.id, currentWishlist);
      
      res.json({ 
        success: true, 
        wishlist: databaseService.transformDatabaseFields(updatedWishlist)
      });
    } else {
      // Item already in wishlist
      res.json({ 
        success: true, 
        message: 'Item already in wishlist',
        wishlist: databaseService.transformDatabaseFields({ items: currentWishlist })
      });
    }
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/wishlist/items/:productId', authenticateToken, async (req, res) => {
  try {
    // Get current wishlist
    const currentWishlist = await databaseService.loadWishlist(req.user.id);
    
    // Remove item
    const updatedItems = currentWishlist.filter(item => item.id !== req.params.productId);
    
    // Save updated wishlist
    const updatedWishlist = await databaseService.saveWishlist(req.user.id, updatedItems);
    
    res.json({ 
      success: true, 
      wishlist: databaseService.transformDatabaseFields(updatedWishlist)
    });
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
});

/**
 * Order Routes
 */

// Get user's orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await databaseService.getUserOrders(req.user.id);
    res.json(databaseService.transformDatabaseFields(orders));
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get order by ID
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await databaseService.getOrderById(req.params.id);
    
    // Check if order exists and belongs to user
    if (!order || order.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(databaseService.transformDatabaseFields(order));
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Create order
router.post('/orders', authenticateToken, validateSchema(schemas.orderSchema), async (req, res) => {
  try {
    // Get current cart
    const cart = await databaseService.loadCart(req.user.id);
    
    if (cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order data
    const orderData = {
      userId: req.user.id,
      items: cart,
      total,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      paymentId: req.body.paymentId
    };
    
    // Create order
    const order = await databaseService.createOrder(orderData);
    
    res.json({ 
      success: true, 
      order: databaseService.transformDatabaseFields(order)
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * Checkout Route
 */

// Process checkout
router.post('/checkout', authenticateToken, validateSchema(schemas.checkoutSchema), async (req, res) => {
  try {
    // Get current cart
    const cart = await databaseService.loadCart(req.user.id);
    
    if (cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Process payment - in a real application, you would integrate with a payment processor here
    // For this example, we'll simulate a successful payment
    const paymentId = `payment_${Date.now()}`;
    
    // Create order data
    const orderData = {
      userId: req.user.id,
      items: cart,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      paymentId
    };
    
    // Create order
    const order = await databaseService.createOrder(orderData);
    
    res.json({ 
      success: true, 
      order: databaseService.transformDatabaseFields(order),
      paymentId
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

module.exports = router; 