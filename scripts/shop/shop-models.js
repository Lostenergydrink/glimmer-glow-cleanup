/**
 * shop-models.js - Shop data models and operations
 * Using consolidated utility functions from utilities.js
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileLock } from '../utils/file-lock.js';
import NodeCache from 'node-cache';
import { errorHandler, asyncHandler } from '../utils/utilities-node.js';

const dataDir = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(dataDir, 'products.json');
const TRANSACTIONS_FILE = path.join(dataDir, 'transactions.json');
const SUBSCRIPTIONS_FILE = path.join(dataDir, 'subscriptions.json');
const CATEGORIES_FILE = path.join(dataDir, 'categories.json');

// Stock level thresholds
const STOCK_LEVELS = {
    LOW: { max: 5, color: '#ff4d4d' },     // Red
    MEDIUM: { max: 20, color: '#ffa64d' }, // Orange
    HIGH: { color: '#66cc66' }             // Green
};

// Initialize cache
const cache = new NodeCache({ 
    stdTTL: 300, // 5 minutes standard TTL
    checkperiod: 60, // Check for expired entries every minute
    useClones: false // Store references instead of copies
});

// Ensure data directory exists
async function initializeDataStorage() {
    try {
        console.log('Initializing data storage...');
        console.log('Data directory:', dataDir);
        await fs.mkdir(dataDir, { recursive: true });
        
        // Initialize files if they don't exist
        for (const file of [PRODUCTS_FILE, TRANSACTIONS_FILE, SUBSCRIPTIONS_FILE, CATEGORIES_FILE]) {
            try {
                console.log('Checking file:', file);
                await fs.access(file);
                console.log('File exists:', file);
            } catch {
                console.log('Creating file:', file);
                // Initialize categories file with default categories
                if (file === CATEGORIES_FILE) {
                    await fs.writeFile(file, JSON.stringify([
                        { id: crypto.randomUUID(), name: 'Jewelry', slug: 'jewelry', description: 'Handcrafted jewelry items' },
                        { id: crypto.randomUUID(), name: 'Art', slug: 'art', description: 'Original artworks and prints' },
                        { id: crypto.randomUUID(), name: 'Clothing', slug: 'clothing', description: 'Custom designed clothing' },
                        { id: crypto.randomUUID(), name: 'Accessories', slug: 'accessories', description: 'Fashion accessories' }
                    ], null, 2));
                } else {
                    await fs.writeFile(file, '[]');
                }
                console.log('File created:', file);
            }
        }
    } catch (error) {
        errorHandler(error, 'Data storage initialization');
        throw error;
    }
}

/**
 * Calculate stock level (LOW, MEDIUM, HIGH) based on quantity
 * @param {number} quantity - Current product quantity
 * @returns {Object} Stock level info including status and color
 */
export const getStockLevel = (quantity) => {
    if (quantity <= STOCK_LEVELS.LOW.max) {
        return { status: 'LOW', color: STOCK_LEVELS.LOW.color };
    } else if (quantity <= STOCK_LEVELS.MEDIUM.max) {
        return { status: 'MEDIUM', color: STOCK_LEVELS.MEDIUM.color };
    } else {
        return { status: 'HIGH', color: STOCK_LEVELS.HIGH.color };
    }
};

// Products
export const getProducts = asyncHandler(async () => {
    // Try cache first
    const cachedProducts = cache.get('products');
    if (cachedProducts) {
        return cachedProducts;
    }

    const { content: products, version } = await fileLock.readFileWithVersion(PRODUCTS_FILE);
    
    // Add stock level information to each product
    const enhancedProducts = products.map(product => ({
        ...product,
        stockLevel: getStockLevel(product.quantity || 0)
    }));
    
    // Cache the results
    cache.set('products', { products: enhancedProducts, version });
    
    return { products: enhancedProducts, version };
});

export const getProduct = asyncHandler(async (id) => {
    const { products } = await getProducts();
    const product = products.find(p => p.id === id);
    
    if (product) {
        // Add stock level information
        return {
            ...product,
            stockLevel: getStockLevel(product.quantity || 0)
        };
    }
    
    return null;
});

export const createProduct = asyncHandler(async (productData) => {
    console.log('Creating product with data:', productData);
    const { products, version } = await getProducts();
    console.log('Current products:', products);
    
    const newProduct = {
        id: crypto.randomUUID(),
        ...productData,
        quantity: parseInt(productData.quantity || 0, 10),
        createdAt: new Date().toISOString(),
        version: 1
    };
    console.log('New product object:', newProduct);
    
    products.push(newProduct);
    const newVersion = await fileLock.writeFileWithVersion(PRODUCTS_FILE, products.map(p => {
        // Remove computed stockLevel property before saving
        const { stockLevel, ...rest } = p;
        return rest;
    }), version);
    
    // Invalidate cache
    cache.del('products');
    
    console.log('Product saved successfully');
    
    // Return product with stock level
    return {
        ...newProduct,
        stockLevel: getStockLevel(newProduct.quantity || 0)
    };
});

export const updateProduct = asyncHandler(async (id, updates) => {
    let retries = 3;
    while (retries > 0) {
        try {
            const { products, version } = await getProducts();
            const index = products.findIndex(p => p.id === id);
            
            if (index === -1) throw new Error('Product not found');
            
            // Ensure quantity is always a number
            if (updates.quantity !== undefined) {
                updates.quantity = parseInt(updates.quantity, 10);
            }
            
            products[index] = {
                ...products[index],
                ...updates,
                updatedAt: new Date().toISOString(),
                version: (products[index].version || 0) + 1
            };
            
            // Calculate stock level for the updated product
            const updatedProduct = {
                ...products[index],
                stockLevel: getStockLevel(products[index].quantity || 0)
            };
            
            // Remove computed stockLevel property before saving
            const productsToSave = products.map(p => {
                const { stockLevel, ...rest } = p;
                return rest;
            });
            
            await fileLock.writeFileWithVersion(PRODUCTS_FILE, productsToSave, version);
            
            // Invalidate cache
            cache.del('products');
            
            return updatedProduct;
        } catch (error) {
            if (error.message === 'Stale data - file was modified' && retries > 1) {
                console.log('Retrying update due to concurrent modification');
                retries--;
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Failed to update product after retries');
});

export const deleteProduct = asyncHandler(async (id) => {
    let retries = 3;
    while (retries > 0) {
        try {
            const { products, version } = await getProducts();
            const filtered = products.filter(p => p.id !== id);
            
            // Remove computed stockLevel property before saving
            const productsToSave = filtered.map(p => {
                const { stockLevel, ...rest } = p;
                return rest;
            });
            
            await fileLock.writeFileWithVersion(PRODUCTS_FILE, productsToSave, version);
            
            // Invalidate cache
            cache.del('products');
            
            return true;
        } catch (error) {
            if (error.message === 'Stale data - file was modified' && retries > 1) {
                console.log('Retrying delete due to concurrent modification');
                retries--;
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Failed to delete product after retries');
});

export const updateProductStock = asyncHandler(async (id, quantity) => {
    let retries = 3;
    while (retries > 0) {
        try {
            const { products, version } = await getProducts();
            const product = products.find(p => p.id === id);
            
            if (!product) throw new Error('Product not found');
            
            const newQuantity = product.quantity - quantity;
            if (newQuantity < 0) throw new Error('Insufficient stock');
            
            const updates = {
                quantity: newQuantity,
                version: (product.version || 0) + 1
            };
            
            return await updateProduct(id, updates);
        } catch (error) {
            if (error.message === 'Stale data - file was modified' && retries > 1) {
                console.log('Retrying stock update due to concurrent modification');
                retries--;
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Failed to update stock after retries');
});

// Categories
export const getCategories = asyncHandler(async () => {
    // Try cache first
    const cachedCategories = cache.get('categories');
    if (cachedCategories) {
        return cachedCategories;
    }

    try {
        const data = await fs.readFile(CATEGORIES_FILE, 'utf-8');
        const categories = JSON.parse(data);
        
        // Cache the results
        cache.set('categories', categories);
        
        return categories;
    } catch (error) {
        console.error('Error reading categories:', error);
        return [];
    }
});

export const createCategory = asyncHandler(async (categoryData) => {
    const categories = await getCategories();
    
    // Create slug from name if not provided
    if (!categoryData.slug) {
        categoryData.slug = categoryData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    
    const newCategory = {
        id: crypto.randomUUID(),
        ...categoryData,
        createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    
    // Invalidate cache
    cache.del('categories');
    
    return newCategory;
});

export const updateCategory = asyncHandler(async (id, updates) => {
    const categories = await getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) throw new Error('Category not found');
    
    // Update slug if name was changed and slug wasn't explicitly provided
    if (updates.name && !updates.slug) {
        updates.slug = updates.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    
    categories[index] = {
        ...categories[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    
    // Invalidate cache
    cache.del('categories');
    
    return categories[index];
});

export const deleteCategory = asyncHandler(async (id) => {
    const categories = await getCategories();
    const filtered = categories.filter(c => c.id !== id);
    
    if (filtered.length === categories.length) {
        throw new Error('Category not found');
    }
    
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(filtered, null, 2));
    
    // Invalidate cache
    cache.del('categories');
    
    return true;
});

// Transactions
export const getTransactions = asyncHandler(async () => {
    const data = await fs.readFile(TRANSACTIONS_FILE, 'utf-8');
    return JSON.parse(data);
});

export const createTransaction = asyncHandler(async (transactionData) => {
    const transactions = await getTransactions();
    const newTransaction = {
        id: crypto.randomUUID(),
        ...transactionData,
        timestamp: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
    return newTransaction;
});

export const getTransaction = asyncHandler(async (id) => {
    const transactions = await getTransactions();
    return transactions.find(t => t.id === id);
});

// Subscriptions
export const getSubscriptions = asyncHandler(async () => {
    const data = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(data);
});

export const createSubscription = asyncHandler(async (subscriptionData) => {
    const subscriptions = await getSubscriptions();
    const newSubscription = {
        id: crypto.randomUUID(),
        ...subscriptionData,
        status: 'active',
        startDate: new Date().toISOString()
    };
    
    subscriptions.push(newSubscription);
    await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
    return newSubscription;
});

export const cancelSubscription = asyncHandler(async (id) => {
    const subscriptions = await getSubscriptions();
    const index = subscriptions.findIndex(s => s.id === id);
    
    if (index === -1) throw new Error('Subscription not found');
    
    subscriptions[index] = {
        ...subscriptions[index],
        status: 'cancelled',
        cancelDate: new Date().toISOString()
    };
    
    await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
    return subscriptions[index];
});

export const getSubscription = asyncHandler(async (id) => {
    const subscriptions = await getSubscriptions();
    return subscriptions.find(s => s.id === id);
});

// Initialize data storage on module load
initializeDataStorage().catch(err => console.error('Failed to initialize data storage:', err));
