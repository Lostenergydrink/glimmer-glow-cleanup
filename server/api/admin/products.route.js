import express from 'express';
import { ProductService } from '../../services/product.service.js';
import { validateProduct } from '../../middleware/validation.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = express.Router();
const productService = new ProductService();

// Get all products (requires read permission)
router.get('/',
  requirePermission(PERMISSIONS.PRODUCT_READ),
  asyncHandler(async (req, res) => {
    const products = await productService.getAllProducts();
    res.json(products);
  })
);

// Get single product (requires read permission)
router.get('/:id',
  requirePermission(PERMISSIONS.PRODUCT_READ),
  asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  })
);

// Create new product (requires create permission)
router.post('/',
  requirePermission(PERMISSIONS.PRODUCT_CREATE),
  validateProduct,
  asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  })
);

// Update product (requires update permission)
router.put('/:id',
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  validateProduct,
  asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  })
);

// Delete product (requires delete permission)
router.delete('/:id',
  requirePermission(PERMISSIONS.PRODUCT_DELETE),
  asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  })
);

// Update product categories (requires category management permission)
router.put('/:id/categories',
  requirePermission(PERMISSIONS.PRODUCT_MANAGE_CATEGORIES),
  asyncHandler(async (req, res) => {
    const product = await productService.updateProductCategories(req.params.id, req.body.categories);
    res.json(product);
  })
);

export default router;
