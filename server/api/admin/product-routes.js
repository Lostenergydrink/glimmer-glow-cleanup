/**
 * Admin Product API Routes
 * Handles all product-related admin operations
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateJWT, requirePermission } from '../../auth/middleware/auth.middleware.js';
import * as validation from '../../middleware/validation.middleware.js';
import * as auditLog from '../../services/audit-log.service.js';

const router = express.Router();

// Apply authentication to all product routes
router.use(authenticateJWT);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'repo_cleanup/assets/images/products');
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValidType = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);
    
    if (isValidType && isValidMime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper middleware to log admin product actions
const logProductAction = (action) => {
  return async (req, res, next) => {
    try {
      await auditLog.recordAdminAction(req.user.id, action, {
        ip: req.ip,
        method: req.method,
        path: req.path,
        productId: req.params.id || req.body.id || 'batch',
        productName: req.body.name || 'multiple'
      });
      next();
    } catch (error) {
      console.error('Failed to log product action:', error);
      next(); // Continue even if logging fails
    }
  };
};

// Get all products with optional filtering
router.get('/',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      const { category, search, minPrice, maxPrice, inStock } = req.query;
      
      // TODO: Get products from database with filters
      // For now, return empty array (to be implemented)
      const products = [];
      
      res.json(products);
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

// Get single product by ID
router.get('/:id',
  requirePermission('admin:read'),
  validation.validateParams({
    id: validation.string().required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Get product from database
      // For now, return a not found error
      res.status(404).json({ error: 'Product not found' });
    } catch (error) {
      console.error('Error getting product:', error);
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
});

// Create new product
router.post('/',
  requirePermission('admin:write'),
  logProductAction('create_product'),
  upload.single('image'),
  validation.validateBody({
    name: validation.string().required(),
    description: validation.string().required(),
    price: validation.number().min(0).required(),
    quantity: validation.number().integer().min(0).required(),
    categories: validation.array().items(validation.string()).optional()
  }),
  async (req, res) => {
    try {
      const { name, description, price, quantity, categories } = req.body;
      
      // Process image path
      const imagePath = req.file 
        ? `/assets/images/products/${req.file.filename}`
        : null;
      
      // TODO: Create product in database
      const newProduct = {
        id: Date.now().toString(),
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        categories: categories || [],
        image: imagePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update existing product
router.put('/:id',
  requirePermission('admin:write'),
  logProductAction('update_product'),
  upload.single('image'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    name: validation.string().optional(),
    description: validation.string().optional(),
    price: validation.number().min(0).optional(),
    quantity: validation.number().integer().min(0).optional(),
    categories: validation.array().items(validation.string()).optional()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      
      // Process numeric values
      if (updates.price) updates.price = parseFloat(updates.price);
      if (updates.quantity) updates.quantity = parseInt(updates.quantity, 10);
      
      // Process image if provided
      if (req.file) {
        updates.image = `/assets/images/products/${req.file.filename}`;
      }
      
      // TODO: Update product in database
      // For now, return a simulated updated product
      const updatedProduct = {
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id',
  requirePermission('admin:write'),
  logProductAction('delete_product'),
  validation.validateParams({
    id: validation.string().required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Delete product from database
      // TODO: Also remove the associated image file
      
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Update product stock
router.patch('/:id/stock',
  requirePermission('admin:write'),
  logProductAction('update_product_stock'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    quantity: validation.number().integer().min(0).required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      // TODO: Update product stock in database
      
      res.json({ 
        success: true, 
        message: 'Product stock updated successfully',
        id,
        quantity: parseInt(quantity, 10)
      });
    } catch (error) {
      console.error('Error updating product stock:', error);
      res.status(500).json({ error: 'Failed to update product stock' });
    }
});

// Bulk import products from CSV
router.post('/bulk-import',
  requirePermission('admin:write'),
  logProductAction('bulk_import_products'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // TODO: Process the CSV file and import products
      // This would involve parsing the CSV, validating each row,
      // and creating products in the database
      
      res.json({ 
        success: true, 
        message: 'Bulk import started. Products will be processed in the background.',
        jobId: Date.now().toString() // For tracking the import job
      });
    } catch (error) {
      console.error('Error during bulk import:', error);
      res.status(500).json({ error: 'Failed to process bulk import' });
    }
});

// Get all product categories
router.get('/categories',
  requirePermission('admin:read'),
  async (req, res) => {
    try {
      // TODO: Get categories from database
      const categories = [];
      
      res.json(categories);
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
});

// Create new category
router.post('/categories',
  requirePermission('admin:write'),
  logProductAction('create_category'),
  validation.validateBody({
    name: validation.string().required(),
    slug: validation.string().optional(),
    description: validation.string().optional()
  }),
  async (req, res) => {
    try {
      const { name, slug, description } = req.body;
      
      // Generate slug if not provided
      const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-');
      
      // TODO: Create category in database
      const newCategory = {
        id: Date.now().toString(),
        name,
        slug: categorySlug,
        description: description || '',
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update category
router.put('/categories/:id',
  requirePermission('admin:write'),
  logProductAction('update_category'),
  validation.validateParams({
    id: validation.string().required()
  }),
  validation.validateBody({
    name: validation.string().optional(),
    slug: validation.string().optional(),
    description: validation.string().optional()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Update category in database
      const updatedCategory = {
        id,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/categories/:id',
  requirePermission('admin:write'),
  logProductAction('delete_category'),
  validation.validateParams({
    id: validation.string().required()
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // TODO: Delete category from database
      // TODO: Also update any products using this category
      
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router; 