/**
 * @file products-routes.js
 * @description API routes for product-related operations
 */

const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products-controller');
const authMiddleware = require('../middleware/auth');

// Get all products (public)
router.get('/', productsController.getAllProducts);

// Get a product by ID (public)
router.get('/:id', productsController.getProductById);

// Create a new product (admin only)
router.post('/',
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  productsController.createProduct
);

// Update a product (admin only)
router.put('/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  productsController.updateProduct
);

// Delete a product (admin only)
router.delete('/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  productsController.deleteProduct
);

module.exports = router;
