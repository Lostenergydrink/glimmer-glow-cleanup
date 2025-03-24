import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import fs from 'fs';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getTransactions,
    createTransaction,
    getSubscriptions,
    createSubscription,
    cancelSubscription,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../scripts/shop/shop-models.js';
import {
    sendPurchaseNotification,
    sendSubscriptionNotification,
    sendSubscriptionCancelledNotification
} from '../scripts/utils/email-service.js';
import { errorHandler, asyncHandler } from '../scripts/utils/utilities-node.js';
import dotenv from 'dotenv';
import services from './services/index.js';
import { authenticateUser, authenticateAdmin, optionalAuthentication } from './middleware/auth.middleware.js';
import authRoutes from './api/auth/routes.js';
import adminRoutes from './api/admin/routes.js';
import adminProductRoutes from './api/admin/product-routes.js';
import adminUserRoutes from './api/admin/user-routes.js';
import shopRoutes from './routes/shop.routes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Initialize services
(async () => {
  try {
    await services.initialize();
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    console.log('Server will continue with fallback storage');
  }
})();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../assets')));
app.use('/styles', express.static(path.join(__dirname, '../styles')));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));
app.use('/admin', express.static(path.join(__dirname, '../pages/admin')));

// Ensure upload directories exist
const uploadDirs = ['assets/images/products', 'assets/images/temp'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Route for serving HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/index.html'));
});

app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/shop.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/contact.html'));
});

app.get('/about-us', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/about-us.html'));
});

app.get('/book-a-private-party', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/book-a-private-party.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/login.html'));
});

app.get('/testimonials', (req, res) => {
    res.redirect('/#testimonials-section');
});

// Log product-related requests for debugging
app.use((req, res, next) => {
    if (req.url.includes('/api/admin/products')) {
        console.log('\nProduct API Request:');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Headers:', {
            'content-type': req.headers['content-type'],
            'csrf-token': req.headers['csrf-token'],
            'x-requested-with': req.headers['x-requested-with']
        });
        if (req.body) console.log('Body:', req.body);
        if (req.file) console.log('Uploaded file:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    }
    next();
});

// Enable CORS and preflight for development - must be before CSRF
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, X-Requested-With, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        headers: req.headers,
        cookies: req.cookies,
        body: req.body
    });
    next();
});

// CSRF protection middleware - declare once and reuse
const csrfProtection = csrf({ 
    cookie: {
        key: '_csrf',
        path: '/'
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Error handler middleware
app.use(errorHandler);

// Use auth routes
app.use('/api/auth', authRoutes);

// Use shop routes
app.use('/api/shop', shopRoutes);

// API routes with optional authentication
app.get('/api/products', optionalAuthentication, asyncHandler(async (req, res) => {
    try {
        // Try to use Supabase first (with fallback to file-based)
        let productsData;
        
        try {
            // If connected to Supabase, use it
            const db = services.db();
            if (db.connected) {
                productsData = await db.getProducts();
            } else {
                throw new Error('Database not connected');
            }
        } catch (error) {
            console.log('Falling back to file-based storage for products');
            productsData = await getProducts();
        }
        
        // Check If-None-Match header for caching
        const clientVersion = req.header('If-None-Match');
        if (clientVersion === productsData.version) {
            return res.status(304).end();
        }
        
        res.set({
            'ETag': productsData.version,
            'Cache-Control': 'private, must-revalidate',
            'Last-Modified': new Date().toUTCString()
        });
        
        res.json(productsData.products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
}));

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    const token = req.csrfToken();
    console.log('Generated CSRF token:', token);
    res.json({ csrfToken: token });
});

// Admin login routes - maintained for backward compatibility
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/login.html'));
});

// Legacy admin authentication check - maintained for backward compatibility
app.get('/api/admin/auth-check', (req, res) => {
    const adminKey = req.cookies.adminKey;
    if (adminKey === process.env.ADMIN_KEY) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Admin page route
app.get('/admin', authenticateAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/index.html'));
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = file.fieldname === 'image' ? 'assets/images/products' : 'assets/images/temp';
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Admin API routes with authentication and CSRF protection
app.get('/api/admin/products', authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const products = await db.getAllProducts();
        res.json(products);
    } catch (error) {
        errorHandler(error, 'Get all products');
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
}));

app.post('/api/admin/products', csrfProtection, authenticateAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    try {
        // Log the full request details
        console.log('Product submission details:', {
            headers: req.headers,
            body: req.body,
            file: req.file
        });
        
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            quantity: parseInt(req.body.quantity),
            type: req.body.type || 'package',
            imageUrl: req.file ? `/images/products/${req.file.filename}` : null
        };
        
        // Try to use Supabase first (with fallback to file-based)
        let product;
        
        try {
            // If connected to Supabase, use it
            const db = services.db();
            if (db.connected) {
                product = await db.createProduct(productData);
            } else {
                throw new Error('Database not connected');
            }
        } catch (error) {
            console.log('Falling back to file-based storage for product creation');
            product = await createProduct(productData);
        }
        
        console.log('Successfully created product:', product);
        res.status(201).json(product);
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ error: error.message });
    }
}));

app.put('/api/admin/products/:id', csrfProtection, authenticateAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            quantity: parseInt(req.body.quantity),
            type: req.body.type
        };
        
        if (req.file) {
            updates.imageUrl = `/images/products/${req.file.filename}`;
        }
        
        // Try to use Supabase first (with fallback to file-based)
        let product;
        
        try {
            // If connected to Supabase, use it
            const db = services.db();
            if (db.connected) {
                product = await db.updateProduct(req.params.id, updates);
            } else {
                throw new Error('Database not connected');
            }
        } catch (error) {
            console.log('Falling back to file-based storage for product update');
            product = await updateProduct(req.params.id, updates);
        }
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

app.delete('/api/admin/products/:id', csrfProtection, authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const db = services.db();
        const deleted = await db.deleteProduct(productId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Delete associated image
        const product = await db.getProductById(productId);
        if (product && product.image) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', product.image));
            } catch (err) {
                console.warn(`Could not delete image for product ${productId}: ${err.message}`);
            }
        }
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        errorHandler(error, 'Delete product');
        res.status(500).json({ error: 'Failed to delete product' });
    }
}));

// Gallery API endpoints
app.get('/api/admin/gallery', authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const gallery = await db.getAllGalleryItems();
        res.json(gallery);
    } catch (error) {
        errorHandler(error, 'Get all gallery items');
        res.status(500).json({ error: 'Failed to retrieve gallery items' });
    }
}));

app.post('/api/admin/gallery', csrfProtection, authenticateAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Process and save the image
        const imagePath = `/assets/images/gallery/${req.file.filename}`;
        
        // Create gallery item
        const galleryItem = {
            title,
            description: description || '',
            image: imagePath,
            createdAt: new Date().toISOString()
        };

        const newGalleryItem = await db.createGalleryItem(galleryItem);
        res.status(201).json(newGalleryItem);
    } catch (error) {
        errorHandler(error, 'Create gallery item');
        res.status(500).json({ error: 'Failed to create gallery item' });
    }
}));

app.put('/api/admin/gallery/:id', csrfProtection, authenticateAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    try {
        const galleryId = req.params.id;
        const { title, description } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Get existing gallery item
        const existingItem = await db.getGalleryItemById(galleryId);
        if (!existingItem) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        // Prepare update data
        const updatedItem = {
            title,
            description: description || '',
            updatedAt: new Date().toISOString()
        };

        // Process image if provided
        if (req.file) {
            // Delete old image if it exists
            if (existingItem.image) {
                try {
                    fs.unlinkSync(path.join(__dirname, '..', existingItem.image));
                } catch (err) {
                    console.warn(`Could not delete old image: ${err.message}`);
                }
            }
            
            // Save new image
            updatedItem.image = `/assets/images/gallery/${req.file.filename}`;
        }

        // Update gallery item
        const updated = await db.updateGalleryItem(galleryId, updatedItem);
        
        if (!updated) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }
        
        res.json({ success: true, item: updated });
    } catch (error) {
        errorHandler(error, 'Update gallery item');
        res.status(500).json({ error: 'Failed to update gallery item' });
    }
}));

app.delete('/api/admin/gallery/:id', csrfProtection, authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const galleryId = req.params.id;
        
        // Get gallery item to access the image path
        const galleryItem = await db.getGalleryItemById(galleryId);
        if (!galleryItem) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        // Delete the item
        const deleted = await db.deleteGalleryItem(galleryId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }
        
        // Delete associated image
        if (galleryItem.image) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', galleryItem.image));
            } catch (err) {
                console.warn(`Could not delete image for gallery item ${galleryId}: ${err.message}`);
            }
        }
        
        res.json({ success: true, message: 'Gallery item deleted successfully' });
    } catch (error) {
        errorHandler(error, 'Delete gallery item');
        res.status(500).json({ error: 'Failed to delete gallery item' });
    }
}));

// Calendar/Events API endpoints
app.get('/api/admin/events', authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const events = await db.getAllEvents();
        res.json(events);
    } catch (error) {
        errorHandler(error, 'Get all events');
        res.status(500).json({ error: 'Failed to retrieve events' });
    }
}));

app.post('/api/admin/events', csrfProtection, authenticateAdmin, upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'qr', maxCount: 1 }
]), asyncHandler(async (req, res) => {
    try {
        const { title, date, price, description } = req.body;
        
        if (!title || !date) {
            return res.status(400).json({ error: 'Title and date are required' });
        }

        // Prepare event data
        const eventData = {
            title,
            date,
            price: price || 0,
            description: description || '',
            createdAt: new Date().toISOString()
        };

        // Process icon if provided
        if (req.files && req.files.icon && req.files.icon[0]) {
            eventData.icon = `/assets/images/events/icons/${req.files.icon[0].filename}`;
        }

        // Process QR code if provided
        if (req.files && req.files.qr && req.files.qr[0]) {
            eventData.qrCode = `/assets/images/events/qr/${req.files.qr[0].filename}`;
        }

        // Create event
        const newEvent = await db.createEvent(eventData);
        res.status(201).json(newEvent);
    } catch (error) {
        errorHandler(error, 'Create event');
        res.status(500).json({ error: 'Failed to create event' });
    }
}));

app.put('/api/admin/events/:id', csrfProtection, authenticateAdmin, upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'qr', maxCount: 1 }
]), asyncHandler(async (req, res) => {
    try {
        const eventId = req.params.id;
        const { title, date, price, description } = req.body;
        
        if (!title || !date) {
            return res.status(400).json({ error: 'Title and date are required' });
        }

        // Get existing event
        const existingEvent = await db.getEventById(eventId);
        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Prepare update data
        const updatedEvent = {
            title,
            date,
            price: price || 0,
            description: description || '',
            updatedAt: new Date().toISOString()
        };

        // Process icon if provided
        if (req.files && req.files.icon && req.files.icon[0]) {
            // Delete old icon if it exists
            if (existingEvent.icon) {
                try {
                    fs.unlinkSync(path.join(__dirname, '..', existingEvent.icon));
                } catch (err) {
                    console.warn(`Could not delete old icon: ${err.message}`);
                }
            }
            
            // Save new icon
            updatedEvent.icon = `/assets/images/events/icons/${req.files.icon[0].filename}`;
        }

        // Process QR code if provided
        if (req.files && req.files.qr && req.files.qr[0]) {
            // Delete old QR code if it exists
            if (existingEvent.qrCode) {
                try {
                    fs.unlinkSync(path.join(__dirname, '..', existingEvent.qrCode));
                } catch (err) {
                    console.warn(`Could not delete old QR code: ${err.message}`);
                }
            }
            
            // Save new QR code
            updatedEvent.qrCode = `/assets/images/events/qr/${req.files.qr[0].filename}`;
        }

        // Update event
        const updated = await db.updateEvent(eventId, updatedEvent);
        
        if (!updated) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ success: true, event: updated });
    } catch (error) {
        errorHandler(error, 'Update event');
        res.status(500).json({ error: 'Failed to update event' });
    }
}));

app.delete('/api/admin/events/:id', csrfProtection, authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Get event to access file paths
        const event = await db.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Delete the event
        const deleted = await db.deleteEvent(eventId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // Delete associated files
        if (event.icon) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', event.icon));
            } catch (err) {
                console.warn(`Could not delete icon for event ${eventId}: ${err.message}`);
            }
        }
        
        if (event.qrCode) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', event.qrCode));
            } catch (err) {
                console.warn(`Could not delete QR code for event ${eventId}: ${err.message}`);
            }
        }
        
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        errorHandler(error, 'Delete event');
        res.status(500).json({ error: 'Failed to delete event' });
    }
}));

app.get('/api/admin/transactions', authenticateAdmin, async (req, res) => {
    try {
        const transactions = await getTransactions();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/checkout', csrfProtection, async (req, res) => {
    try {
        const { items, customer, paymentDetails } = req.body;
        let totalAmount = 0;

        
        // Update stock for each item
        for (const item of items) {
            await updateProductStock(item.id, item.quantity);
            const product = await getProduct(item.id);
            totalAmount += product.price * item.quantity;
        }
        
        // Create transaction record
        const transaction = await createTransaction({
            customer,
            items,
            amount: totalAmount,
            paymentDetails
        });
        
        // Send email notification
        await sendPurchaseNotification(transaction);
        
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/subscriptions', authenticateAdmin, async (req, res) => {
    try {
        const subscriptions = await getSubscriptions();
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/subscribe', csrfProtection, async (req, res) => {
    try {
        const { customer, plan, amount, paymentDetails } = req.body;
        

        const subscription = await createSubscription({
            customer,
            plan,
            amount,
            paymentDetails
        });
        
        await sendSubscriptionNotification(subscription);
        
        res.status(201).json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/subscriptions/:id', csrfProtection, authenticateAdmin, async (req, res) => {
    try {
        const subscription = await cancelSubscription(req.params.id);
        await sendSubscriptionCancelledNotification(subscription);

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PayPal Settings
app.post('/api/admin/paypal-settings', csrfProtection, authenticateAdmin, async (req, res) => {
    try {
        const { clientId, clientSecret } = req.body;
        // TODO: Securely store PayPal credentials

        res.json({ message: 'PayPal settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Category routes with authentication and CSRF protection
app.get('/api/admin/categories', authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const categories = await getCategories();
        res.json(categories);
    } catch (error) {
        errorHandler(error, 'Get all categories');
        res.status(500).json({ error: 'Failed to retrieve categories' });
    }
}));

app.post('/api/admin/categories', csrfProtection, authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const { name, description, slug } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const newCategory = await createCategory({ name, description, slug });
        res.status(201).json(newCategory);
    } catch (error) {
        errorHandler(error, 'Create category');
        res.status(500).json({ error: 'Failed to create category' });
    }
}));

app.put('/api/admin/categories/:id', csrfProtection, authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, slug } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        const updatedCategory = await updateCategory(id, { name, description, slug });
        res.json(updatedCategory);
    } catch (error) {
        if (error.message === 'Category not found') {
            return res.status(404).json({ error: 'Category not found' });
        }
        errorHandler(error, 'Update category');
        res.status(500).json({ error: 'Failed to update category' });
    }
}));

app.delete('/api/admin/categories/:id', csrfProtection, authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        await deleteCategory(id);
        res.status(204).end();
    } catch (error) {
        if (error.message === 'Category not found') {
            return res.status(404).json({ error: 'Category not found' });
        }
        errorHandler(error, 'Delete category');
        res.status(500).json({ error: 'Failed to delete category' });
    }
}));

// Product's categories association routes
app.post('/api/admin/products/:productId/categories', csrfProtection, authenticateAdmin, asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        const { categoryIds } = req.body;
        
        if (!Array.isArray(categoryIds)) {
            return res.status(400).json({ error: 'categoryIds must be an array' });
        }
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Associate categories with the product
        const updatedProduct = await updateProduct(productId, { 
            categoryIds,
            updatedAt: new Date().toISOString()
        });
        
        res.json(updatedProduct);
    } catch (error) {
        errorHandler(error, 'Associate product categories');
        res.status(500).json({ error: 'Failed to associate product with categories' });
    }
}));

// Public API to get categories
app.get('/api/categories', asyncHandler(async (req, res) => {
    try {
        const categories = await getCategories();
        res.json(categories);
    } catch (error) {
        errorHandler(error, 'Get public categories');
        res.status(500).json({ error: 'Failed to retrieve categories' });
    }
}));

// Public API to get products by category
app.get('/api/categories/:categorySlug/products', asyncHandler(async (req, res) => {
    try {
        const { categorySlug } = req.params;
        const categories = await getCategories();
        const category = categories.find(c => c.slug === categorySlug);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const { products } = await getProducts();
        const categoryProducts = products.filter(p => 
            p.categoryIds && p.categoryIds.includes(category.id)
        );
        
        res.json(categoryProducts);
    } catch (error) {
        errorHandler(error, 'Get products by category');
        res.status(500).json({ error: 'Failed to retrieve products by category' });
    }
}));

// Admin routes
app.use('/api/admin', csrfProtection, authenticateJWT, adminRoutes);
app.use('/api/admin/products', csrfProtection, authenticateJWT, adminProductRoutes);
app.use('/api/admin/users', csrfProtection, authenticateJWT, adminUserRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Admin interface at http://localhost:${port}/admin`);
});
