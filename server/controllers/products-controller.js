/**
 * @file products-controller.js
 * @description Controller for product-related operations
 *
 * This controller handles product-related API endpoints using the database provider.
 */

const { getProvider } = require('../db/connection');

/**
 * Get all products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getAllProducts(req, res) {
  try {
    const db = getProvider();
    const products = await db.getProducts();

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve products',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get a product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getProductById(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Product ID is required'
    });
  }

  try {
    const db = getProvider();
    const product = await db.getProduct(id);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(`Error in getProductById(${id}):`, error);

    // Check if it's a "not found" error
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: `Product not found: ${id}`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Create a new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function createProduct(req, res) {
  const productData = req.body;

  if (!productData || Object.keys(productData).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Product data is required'
    });
  }

  try {
    const db = getProvider();
    const product = await db.createProduct(productData);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function updateProduct(req, res) {
  const { id } = req.params;
  const productData = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Product ID is required'
    });
  }

  if (!productData || Object.keys(productData).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Product data is required'
    });
  }

  try {
    const db = getProvider();
    const product = await db.updateProduct(id, productData);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(`Error in updateProduct(${id}):`, error);

    // Check if it's a "not found" error
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: `Product not found: ${id}`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Delete a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function deleteProduct(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Product ID is required'
    });
  }

  try {
    const db = getProvider();
    const success = await db.deleteProduct(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Product not found: ${id}`
      });
    }

    res.status(200).json({
      success: true,
      message: `Product deleted: ${id}`
    });
  } catch (error) {
    console.error(`Error in deleteProduct(${id}):`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
