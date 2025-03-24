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
    cancelSubscription
} from './shop-models.js';
import {
    sendPurchaseNotification,
    sendSubscriptionNotification,
    sendSubscriptionCancelledNotification
} from './email-service.js';
import dotenv from 'dotenv';
import { errorHandler, asyncHandler } from '../../scripts/utils/utilities-node.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Ensure upload directories exist
const uploadDirs = ['public/images/products', 'public/images/temp'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
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
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, X-Requested-With');
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

// Admin Authentication Middleware
const authenticateAdmin = asyncHandler(async (req, res, next) => {
    const adminKey = req.cookies.adminKey;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
    next();
});

// Error handler middleware
app.use(errorHandler);

// Wrap routes with asyncHandler
app.get('/api/admin/products', authenticateAdmin, asyncHandler(async (req, res) => {
    const { products, version } = await getProducts();
    
    // Check If-None-Match header
    const clientVersion = req.header('If-None-Match');
    if (clientVersion === version) {
        return res.status(304).end();
    }
    
    res.set({
        'ETag': version,
        'Cache-Control': 'private, must-revalidate',
        'Last-Modified': new Date().toUTCString()
    });
    
    res.json(products);
}));

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    const token = req.csrfToken();
    console.log('Generated CSRF token:', token);
    res.json({ csrfToken: token });
});

// Admin login routes
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/login.html'));
});

app.post('/api/admin/login', csrfProtection, async (req, res) => {
    const { adminKey } = req.body;
    if (adminKey === process.env.ADMIN_KEY) {
        res.cookie('adminKey', adminKey, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid admin key' });
    }
});

app.get('/api/admin/auth-check', (req, res) => {
    const adminKey = req.cookies.adminKey;
    if (adminKey === process.env.ADMIN_KEY) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = file.fieldname === 'image' ? 'public/images/products' : 'public/images/temp';
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Admin page route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});


app.post('/api/admin/products', csrfProtection, authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        // Log the full request details
        console.log('Product submission headers:', req.headers);
        console.log('Product submission body:', req.body);
        console.log('Product submission file:', req.file);
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            quantity: parseInt(req.body.quantity),
            type: req.body.type || 'package',
            imageUrl: req.file ? `/images/products/${req.file.filename}` : null
        };
        console.log('Processed product data:', productData);
        
        console.log('Creating product with data:', productData);
        const product = await createProduct(productData);
        console.log('Successfully created product:', product);
        res.status(201).json(product);
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/products/:id', csrfProtection, authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            quantity: parseInt(req.body.quantity),
            type: req.body.type // Preserve the type field
        };
        
        if (req.file) {
            updates.imageUrl = `/images/products/${req.file.filename}`;
        }
        
        const product = await updateProduct(req.params.id, updates);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/products/:id', csrfProtection, authenticateAdmin, async (req, res) => {
    try {
        await deleteProduct(req.params.id);
        res.status(204).end();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
