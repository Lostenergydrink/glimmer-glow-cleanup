/**
 * admin.js - Admin panel functionality
 * Using consolidated utility functions from utilities.js
 */
import {
    select,
    selectAll,
    addEvent,
    removeEvent,
    debounce,
    errorHandler,
    asyncHandler,
    escapeHtml,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock
} from '../utils/utilities.js';

// Constants and configuration
const CONFIG = {
    MESSAGE_TIMEOUT: 5000,
    DEBOUNCE_DELAY: 300,
    API_ENDPOINTS: {
        PRODUCTS: '/api/admin/products',
        GALLERY: '/api/admin/gallery',
        EVENTS: '/api/admin/events',
        PAYPAL: '/api/admin/paypal-settings',
        CATEGORIES: '/api/admin/categories'
    },
    STYLES: {
        BUTTON_WRAPPER: 'display: block !important; visibility: visible !important; opacity: 1 !important; position: absolute !important; bottom: 0 !important; left: 0 !important; right: 0 !important; z-index: 100 !important; transform: translateZ(0) !important; -webkit-transform: translateZ(0) !important; will-change: transform !important;',
        BUTTON_ACTIONS: 'display: flex !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 101 !important; transform: translateZ(0) !important; -webkit-transform: translateZ(0) !important;',
        BUTTON: 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 102 !important; pointer-events: auto !important; -webkit-user-select: auto !important; user-select: auto !important;'
    },
    STOCK_LEVELS: {
        LOW: { max: 5, color: '#ff4d4d' },     // Red
        MEDIUM: { max: 20, color: '#ffa64d' }, // Orange
        HIGH: { color: '#66cc66' }             // Green
    }
};

// Enhanced message display with cleanup
const createMessageSystem = () => {
    let currentTimeout;
    const messageQueue = [];

    const displayMessage = (message, type) => {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}-message`;

        const container = select('.admin-content');
        if (!container) return;

        container.insertBefore(messageDiv, container.firstChild);

        clearTimeout(currentTimeout);
        currentTimeout = setTimeout(() => {
            messageDiv.remove();
            if (messageQueue.length > 0) {
                const nextMessage = messageQueue.shift();
                displayMessage(nextMessage.text, nextMessage.type);
            }
        }, CONFIG.MESSAGE_TIMEOUT);
    };

    return (message, type) => {
        if (currentTimeout) {
            messageQueue.push({ text: message, type });
        } else {
            displayMessage(message, type);
        }
    };
};

// Form validation
const validateProduct = (formData) => {
    const validators = {
        name: (value) => ({
            isValid: value?.trim().length > 0,
            message: 'Product name is required'
        }),
        price: (value) => ({
            isValid: !isNaN(value) && value >= 0,
            message: 'Price must be a positive number'
        }),
        quantity: (value) => ({
            isValid: !isNaN(value) && parseInt(value) >= 0,
            message: 'Quantity must be a positive number'
        })
    };

    for (const [field, validator] of Object.entries(validators)) {
        const value = formData.get(field);
        const { isValid, message } = validator(value);
        if (!isValid) throw new Error(message);
    }
    return true;
};

/**
 * Calculate stock level (LOW, MEDIUM, HIGH) based on quantity
 * @param {number} quantity - Current product quantity
 * @returns {Object} Stock level info including status and color
 */
const getStockLevel = (quantity) => {
    if (quantity <= CONFIG.STOCK_LEVELS.LOW.max) {
        return { status: 'LOW', color: CONFIG.STOCK_LEVELS.LOW.color };
    } else if (quantity <= CONFIG.STOCK_LEVELS.MEDIUM.max) {
        return { status: 'MEDIUM', color: CONFIG.STOCK_LEVELS.MEDIUM.color };
    } else {
        return { status: 'HIGH', color: CONFIG.STOCK_LEVELS.HIGH.color };
    }
};

// Main application class
class AdminPanel {
    constructor() {
        this.apiEndpoints = CONFIG.API_ENDPOINTS;
        this.showMessage = createMessageSystem();
        this.currentProduct = null;
        this.currentGalleryItem = null;
        this.currentEvent = null;
        this.currentCategory = null;
        this.csrfToken = null;
        this.categories = [];

        // Initialize elements
        this.elements = {
            // Navigation
            navLinks: selectAll('.admin-nav a'),
            sections: selectAll('.section'),

            // Shop tabs
            shopTabs: selectAll('.tab'),
            tabContents: selectAll('.tab-content'),

            // Shop
            productForm: select('#productForm'),
            productList: select('#productList'),
            productCategories: select('#productCategories'),

            // Bulk upload
            bulkUploadForm: select('#bulkUploadForm'),
            bulkCategory: select('#bulkCategory'),
            downloadTemplate: select('#downloadTemplate'),

            // Categories
            categoryForm: select('#categoryForm'),
            categoryList: select('#categoryList'),

            // Gallery
            galleryForm: select('#galleryForm'),
            galleryList: select('#galleryList'),

            // Calendar
            eventForm: select('#eventForm'),
            eventsList: select('#eventsList'),

            // Subscriptions
            subscriptionsList: select('#subscriptionsList'),
            exportSubscriptionsBtn: select('#exportSubscriptions'),

            // Transactions
            transactionsList: select('#transactionsList'),
            filterTransactionsBtn: select('#filterTransactions'),
            startDateInput: select('#startDate'),
            endDateInput: select('#endDate'),

            // PayPal Settings
            paypalForm: select('#paypalForm'),

            // User Management
            userForm: select('#userForm'),
            userList: select('#userList'),
            userRoleSelect: select('#userRole'),
            userStatusSelect: select('#userStatus')
        };

        // Get CSRF token before initializing
        this.fetchCsrfToken();

        // Add new endpoints for user management
        this.apiEndpoints = {
            ...this.apiEndpoints,
            USERS: '/api/admin/users',
            USER_ROLES: '/api/admin/users/roles',
            USER_STATUS: '/api/admin/users/status'
        };

        this.init();
    }

    async init() {
        console.log('Initializing admin panel...');
        // Check authentication first
        try {
            console.log('Checking authentication...');
            const response = await fetch('/api/admin/auth-check', {
                credentials: 'same-origin',
                headers: {
                    'X-Request-Time': new Date().toISOString(),
                    'X-Client-ID': 'admin-panel'
                }
            });
            console.log('Auth check response:', {
                status: response.status,
                headers: Object.fromEntries(response.headers)
            });
            if (!response.ok) {
                window.location.href = '/admin/login';
                return;
            }
            const data = await response.json();
            if (!data.authenticated) {
                window.location.href = '/admin/login';
                return;
            }
        } catch (error) {
            errorHandler(error, 'Authentication check');
            window.location.href = '/admin/login';
            return;
        }

        this.bindElements();
        this.setupEventListeners();
        this.initializeSection();
    }

    bindElements() {
        this.elements = {
            navLinks: selectAll('.nav-links a'),
            sections: selectAll('.section'),
            productForm: select('#productForm'),
            productsList: select('#productsList'),
            paypalForm: select('#paypalForm'),
            galleryForm: select('#galleryForm'),
            eventForm: select('#eventForm'),
            shopSection: select('#shop')
        };
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        // Navigation
        this.elements.navLinks?.forEach(link => {
            addEvent(link, 'click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href')?.slice(1);
                console.log('Navigation clicked:', {
                    targetId,
                    currentHash: window.location.hash,
                    timestamp: new Date().toISOString()
                });

                if (!targetId) return;

                this.elements.sections?.forEach(section => {
                    if (section) {
                        section.style.display = section.id === targetId ? 'block' : 'none';
                    }
                });

                this.elements.navLinks?.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Load appropriate data when section becomes visible
                if (targetId === 'shop') {
                    console.log('Shop section activated, loading products...');
                    this.loadCategories().then(() => {
                        this.loadProducts().catch(error => {
                            errorHandler(error, 'Loading products');
                            this.showMessage('Failed to load products. Please refresh the page.', 'error');
                        });
                    });
                } else if (targetId === 'categories') {
                    console.log('Categories section activated, loading categories...');
                    this.loadCategories().catch(error => {
                        errorHandler(error, 'Loading categories');
                        this.showMessage('Failed to load categories. Please refresh the page.', 'error');
                    });
                } else if (targetId === 'gallery') {
                    console.log('Gallery section activated, loading gallery items...');
                    this.loadGalleryItems().catch(error => {
                        errorHandler(error, 'Loading gallery items');
                        this.showMessage('Failed to load gallery items. Please refresh the page.', 'error');
                    });
                } else if (targetId === 'calendar') {
                    console.log('Calendar section activated, loading events...');
                    this.loadEvents().catch(error => {
                        errorHandler(error, 'Loading events');
                        this.showMessage('Failed to load events. Please refresh the page.', 'error');
                    });
                } else if (targetId === 'subscriptions') {
                    console.log('Subscriptions section activated, loading subscriptions...');
                    this.loadSubscriptions().catch(error => {
                        errorHandler(error, 'Loading subscriptions');
                        this.showMessage('Failed to load subscriptions. Please refresh the page.', 'error');
                    });
                } else if (targetId === 'transactions') {
                    console.log('Transactions section activated, loading transactions...');
                    this.loadTransactions().catch(error => {
                        errorHandler(error, 'Loading transactions');
                        this.showMessage('Failed to load transactions. Please refresh the page.', 'error');
                    });
                }
            });
        });

        // Shop tabs
        this.elements.shopTabs?.forEach(tab => {
            addEvent(tab, 'click', (e) => {
                const tabName = tab.getAttribute('data-tab');

                // Update active tab
                this.elements.shopTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show corresponding content
                this.elements.tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabName}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });

        // Product form
        if (this.elements.productForm) {
            addEvent(this.elements.productForm, 'submit', this.handleProductSubmit.bind(this));
        }

        // Product list click delegation
        if (this.elements.productsList) {
            addEvent(this.elements.productsList, 'click', this.handleProductActions.bind(this));
        }

        // Category form
        if (this.elements.categoryForm) {
            addEvent(this.elements.categoryForm, 'submit', this.handleCategorySubmit.bind(this));
        }

        // Category list click delegation
        if (this.elements.categoryList) {
            addEvent(this.elements.categoryList, 'click', this.handleCategoryActions.bind(this));
        }

        // Bulk upload form
        if (this.elements.bulkUploadForm) {
            addEvent(this.elements.bulkUploadForm, 'submit', this.handleBulkUpload.bind(this));
        }

        // Download template link
        if (this.elements.downloadTemplate) {
            addEvent(this.elements.downloadTemplate, 'click', this.downloadCsvTemplate.bind(this));
        }

        // Initialize MutationObserver for shop section
        if (this.elements.shopSection) {
            this.observer = new MutationObserver(this.handleShopSectionMutation.bind(this));
            this.observer.observe(this.elements.shopSection, {
                attributes: true,
                attributeFilter: ['style']
            });
        }

        // Add user management event listeners
        if (this.elements.userForm) {
            addEvent(this.elements.userForm, 'submit', this.handleUserSubmit.bind(this));
        }
    }

    handleShopSectionMutation(mutations) {
        mutations.forEach((mutation) => {
            if (mutation.target === this.elements.shopSection &&
                mutation.type === 'attributes' &&
                mutation.attributeName === 'style' &&
                this.elements.shopSection.style.display === 'block') {
                this.ensureButtonsVisible();
            }
        });
    }

    async handleProductSubmit(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const formData = new FormData(form);

            // Validate the form data
            validateProduct(formData);

            // Get selected categories
            const categorySelect = select('#productCategories');
            const selectedCategories = Array.from(categorySelect.selectedOptions).map(option => option.value);

            // Add selected categories to form data
            formData.append('categoryIds', JSON.stringify(selectedCategories));

            let url = this.apiEndpoints.PRODUCTS;
            let method = 'POST';

            // If editing, use PUT and append the ID
            if (this.currentProduct) {
                url = `${url}/${this.currentProduct.id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                body: formData,
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': this.csrfToken
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to ${this.currentProduct ? 'update' : 'create'} product: ${response.statusText}`);
            }

            const product = await response.json();

            this.showMessage(`Product ${this.currentProduct ? 'updated' : 'created'} successfully!`, 'success');
            this.currentProduct = null;
            this.resetForm(form);
            this.loadProducts();

        } catch (error) {
            errorHandler(error, 'Product submission');
            this.showMessage(error.message, 'error');
        }
    }

    handleProductActions(event) {
        const editButton = event.target.closest('.edit-product');
        const deleteButton = event.target.closest('.delete-product');

        if (editButton) {
            const productId = editButton.dataset.productId;
            const product = JSON.parse(editButton.dataset.product);
            this.editProduct(product);
        } else if (deleteButton) {
            const productId = deleteButton.dataset.productId;
            if (confirm('Are you sure you want to delete this product?')) {
                this.deleteProduct(productId);
            }
        }
    }

    editProduct(product) {
        this.currentProduct = product;

        const form = this.elements.productForm;
        form.querySelector('#productName').value = product.name || '';
        form.querySelector('#productDescription').value = product.description || '';
        form.querySelector('#productPrice').value = product.price || '';
        form.querySelector('#productQuantity').value = product.quantity || 0;

        // Set selected categories
        const categorySelect = form.querySelector('#productCategories');
        if (categorySelect) {
            Array.from(categorySelect.options).forEach(option => {
                option.selected = product.categoryIds && product.categoryIds.includes(option.value);
            });
        }

        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Product';
        }

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    async deleteProduct(productId) {
        try {
            const response = await fetch(`${this.apiEndpoints.PRODUCTS}/${productId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': this.csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete product: ${response.statusText}`);
            }

            this.showMessage('Product deleted successfully!', 'success');

            if (this.currentProduct && this.currentProduct.id === productId) {
                this.currentProduct = null;
                this.resetForm(this.elements.productForm);
            }

            this.loadProducts();

        } catch (error) {
            errorHandler(error, 'Delete product');
            this.showMessage(error.message, 'error');
        }
    }

    createProductCard(product) {
        const stockLevel = product.stockLevel || getStockLevel(product.quantity || 0);
        const categoryNames = (product.categoryIds || [])
            .map(id => {
                const category = this.categories.find(c => c.id === id);
                return category ? category.name : 'Unknown';
            })
            .join(', ');

        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-details">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>${escapeHtml(product.description || '')}</p>
                    <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                    <p class="product-stock">
                        Stock: ${product.quantity || 0}
                        <span class="stock-indicator" style="background-color: ${stockLevel.color}">
                            ${stockLevel.status}
                        </span>
                    </p>
                    ${categoryNames ? `<p class="product-categories">Categories: ${escapeHtml(categoryNames)}</p>` : ''}
                </div>
                <div class="product-actions">
                    <button class="edit-product" data-id="${product.id}">Edit</button>
                    <button class="delete-product" data-id="${product.id}">Delete</button>
                </div>
            </div>
        `;
    }

    ensureButtonsVisible() {
        console.log('Ensuring buttons are visible...');
        // Some payment buttons can be hidden by third-party code
        // This function makes them visible again

        const buttonContainer = select('.payment-buttons');
        if (!buttonContainer) return;

        // Wait until PayPal buttons are initialized
        setTimeout(() => {
            // Check all payment buttons
            const paypalButtons = selectAll('[data-funding-source]');
            console.log('Payment buttons found:', paypalButtons.length);

            paypalButtons.forEach(btn => {
                // Fix visibility issues by setting explicit styles
                if (btn.style.display === 'none' ||
                    btn.style.visibility === 'hidden' ||
                    btn.style.opacity === '0') {
                    console.log('Fixing payment button visibility...');

                    // Set styles to ensure visibility
                    const wrapper = btn.closest('[data-payment-button-container]');
                    if (wrapper) wrapper.style.cssText += CONFIG.STYLES.BUTTON_WRAPPER;

                    const actions = btn.querySelector('[data-funding-button-actions]');
                    if (actions) actions.style.cssText += CONFIG.STYLES.BUTTON_ACTIONS;

                    btn.style.cssText += CONFIG.STYLES.BUTTON;
                }
            });
        }, 2000);
    }

    async loadProducts() {
        try {
            // Load categories first if not already loaded
            if (this.categories.length === 0) {
                await this.loadCategories();
            }

            console.log('Loading products...');
            const response = await fetch(this.apiEndpoints.PRODUCTS, {
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to load products: ${response.statusText}`);
            }

            const products = await response.json();
            console.log('Products loaded:', products);

            // Store products data
            this.productsData = products;

            // Render products
            this.renderProducts(products);

            // Return the products for further processing
            return products;

        } catch (error) {
            errorHandler(error, 'Load products');
            this.showMessage('Failed to load products. Please try again.', 'error');
        }
    }

    renderProducts(products) {
        if (!this.elements.productsList) return;

        if (!products.length) {
            this.elements.productsList.innerHTML = '<p>No products found. Add a new product to get started.</p>';
            return;
        }

        const productsHtml = products.map(product => this.createProductCard(product)).join('');
        this.elements.productsList.innerHTML = productsHtml;

        // Ensure buttons are visible
        this.ensureButtonsVisible();
    }

    async loadCategories() {
        try {
            console.log('Loading categories...');
            const response = await fetch(this.apiEndpoints.CATEGORIES, {
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to load categories: ${response.statusText}`);
            }

            const categories = await response.json();
            console.log('Categories loaded:', categories);

            // Store categories data
            this.categories = categories;

            // Populate category dropdowns
            this.populateCategoryDropdowns(categories);

            // Render categories list in the Categories tab
            this.renderCategories(categories);

            return categories;

        } catch (error) {
            errorHandler(error, 'Load categories');
            this.showMessage('Failed to load categories. Please try again.', 'error');
        }
    }

    populateCategoryDropdowns(categories) {
        // Populate product categories dropdown
        const productCategoriesSelect = this.elements.productCategories;
        if (productCategoriesSelect) {
            productCategoriesSelect.innerHTML = '';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                productCategoriesSelect.appendChild(option);
            });
        }

        // Populate bulk upload category dropdown
        const bulkCategorySelect = this.elements.bulkCategory;
        if (bulkCategorySelect) {
            // Keep the first option (-- Select Category --)
            bulkCategorySelect.innerHTML = '<option value="">-- Select Category --</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                bulkCategorySelect.appendChild(option);
            });
        }
    }

    renderCategories(categories) {
        const categoryList = this.elements.categoryList;
        if (!categoryList) return;

        if (!categories.length) {
            categoryList.innerHTML = '<p>No categories found. Add a new category to get started.</p>';
            return;
        }

        const categoriesHtml = categories.map(category => `
            <div class="category-card" data-id="${category.id}">
                <div class="category-details">
                    <h3>${escapeHtml(category.name)}</h3>
                    <p class="category-slug">Slug: ${escapeHtml(category.slug)}</p>
                    <p>${escapeHtml(category.description || '')}</p>
                </div>
                <div class="category-actions">
                    <button class="edit-category" data-id="${category.id}">Edit</button>
                    <button class="delete-category" data-id="${category.id}">Delete</button>
                </div>
            </div>
        `).join('');

        categoryList.innerHTML = categoriesHtml;
    }

    async handleCategorySubmit(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const formData = new FormData(form);

            // Convert FormData to JSON
            const categoryData = {
                name: formData.get('name'),
                description: formData.get('description'),
                slug: formData.get('slug')
            };

            let url = this.apiEndpoints.CATEGORIES;
            let method = 'POST';

            // If editing, use PUT and append the ID
            if (this.currentCategory) {
                url = `${url}/${this.currentCategory.id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                body: JSON.stringify(categoryData),
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': this.csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to ${this.currentCategory ? 'update' : 'create'} category: ${response.statusText}`);
            }

            const category = await response.json();

            this.showMessage(`Category ${this.currentCategory ? 'updated' : 'created'} successfully!`, 'success');
            this.currentCategory = null;
            this.resetForm(form);

            // Reload categories to update both the category list and dropdowns
            this.loadCategories();

        } catch (error) {
            errorHandler(error, 'Category submission');
            this.showMessage(error.message, 'error');
        }
    }

    handleCategoryActions(event) {
        if (event.target.classList.contains('edit-category')) {
            const categoryId = event.target.getAttribute('data-id');
            const category = this.categories.find(c => c.id === categoryId);
            if (category) {
                this.editCategory(category);
            }
        } else if (event.target.classList.contains('delete-category')) {
            const categoryId = event.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this category?')) {
                this.deleteCategory(categoryId);
            }
        }
    }

    editCategory(category) {
        this.currentCategory = category;

        const form = this.elements.categoryForm;
        form.querySelector('#categoryName').value = category.name || '';
        form.querySelector('#categorySlug').value = category.slug || '';
        form.querySelector('#categoryDescription').value = category.description || '';

        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Category';
        }

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    async deleteCategory(categoryId) {
        try {
            const response = await fetch(`${this.apiEndpoints.CATEGORIES}/${categoryId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': this.csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete category: ${response.statusText}`);
            }

            this.showMessage('Category deleted successfully!', 'success');

            if (this.currentCategory && this.currentCategory.id === categoryId) {
                this.currentCategory = null;
                this.resetForm(this.elements.categoryForm);
            }

            // Reload categories to update both the category list and dropdowns
            this.loadCategories();

        } catch (error) {
            errorHandler(error, 'Delete category');
            this.showMessage(error.message, 'error');
        }
    }

    async handleBulkUpload(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const formData = new FormData(form);

            const file = formData.get('bulkFile');
            if (!file) {
                throw new Error('Please select a CSV file to upload');
            }

            // Read the file content
            const fileContent = await this.readFileAsText(file);

            // Parse CSV content
            const products = this.parseCSV(fileContent);

            if (products.length === 0) {
                throw new Error('No valid products found in the CSV file');
            }

            // Get selected category if any
            const categoryId = formData.get('bulkCategory');

            // Create all products
            let created = 0;
            let errors = 0;

            for (const productData of products) {
                try {
                    // Add category if selected
                    if (categoryId) {
                        productData.categoryIds = [categoryId];
                    }

                    // Convert string to FormData
                    const productFormData = new FormData();
                    Object.entries(productData).forEach(([key, value]) => {
                        productFormData.append(key, value);
                    });

                    const response = await fetch(this.apiEndpoints.PRODUCTS, {
                        method: 'POST',
                        body: productFormData,
                        credentials: 'same-origin',
                        headers: {
                            'X-CSRF-Token': this.csrfToken
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to create product: ${response.statusText}`);
                    }

                    created++;

                } catch (error) {
                    console.error(`Error creating product: ${error.message}`);
                    errors++;
                }
            }

            this.showMessage(`Bulk upload completed. Created ${created} products. ${errors > 0 ? `Failed to create ${errors} products.` : ''}`, 'success');

            // Reset form
            this.resetForm(form);

            // Reload products
            this.loadProducts();

        } catch (error) {
            errorHandler(error, 'Bulk upload');
            this.showMessage(error.message, 'error');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseCSV(text) {
        // Simple CSV parser - can be enhanced for more robust parsing
        const lines = text.split('\n');
        if (lines.length <= 1) {
            throw new Error('CSV file must have at least a header row and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['name', 'price', 'description'];

        // Check if all required headers are present
        for (const header of requiredHeaders) {
            if (!headers.includes(header)) {
                throw new Error(`CSV file must include a "${header}" column`);
            }
        }

        // Parse data rows
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines

            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) {
                console.warn(`Row ${i} has ${values.length} columns but should have ${headers.length}. Skipping.`);
                continue;
            }

            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index];
            });

            // Convert numeric fields
            if (product.price) product.price = parseFloat(product.price);
            if (product.quantity) product.quantity = parseInt(product.quantity, 10);

            products.push(product);
        }

        return products;
    }

    downloadCsvTemplate(event) {
        event.preventDefault();

        // Create CSV template content
        const csvContent = [
            'name,description,price,quantity',
            'Example Product,"This is an example product description",19.99,10',
            'Another Product,"Another product description",29.99,5'
        ].join('\n');

        // Create a Blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_template.csv';
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    resetForm(form) {
        if (!form) return;

        form.reset();

        // Reset product edit state
        if (form === this.elements.productForm) {
            this.currentProduct = null;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Add Product';
            }
        }

        // Reset category edit state
        if (form === this.elements.categoryForm) {
            this.currentCategory = null;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Add Category';
            }
        }
    }

    cleanup() {
        // Remove event listeners
        this.elements.navLinks?.forEach(link => {
            removeEvent(link, 'click');
        });

        if (this.elements.productForm) {
            removeEvent(this.elements.productForm, 'submit');
        }

        if (this.elements.productsList) {
            removeEvent(this.elements.productsList, 'click');
        }

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Clear intervals
        if (this._productRefreshInterval) {
            clearInterval(this._productRefreshInterval);
        }
    }

    // Gallery management
    async loadGalleryItems() {
        try {
            const response = await fetch(this.apiEndpoints.GALLERY);
            if (!response.ok) throw new Error('Failed to load gallery items');

            const galleryItems = await response.json();
            this.renderGalleryItems(galleryItems);
        } catch (error) {
            errorHandler(error, 'Loading gallery items');
            this.showMessage('Failed to load gallery items: ' + error.message, 'error');
        }
    }

    renderGalleryItems(items) {
        if (!this.elements.galleryList) return;

        if (items.length === 0) {
            this.elements.galleryList.innerHTML = '<p>No gallery items found.</p>';
            return;
        }

        const html = items.map(item => `
            <div class="gallery-item">
                <div class="gallery-image">
                    <img src="${item.image}" alt="${escapeHtml(item.title)}">
                </div>
                <div class="gallery-details">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description || '')}</p>
                    <div class="item-actions">
                        <button class="edit-gallery-item" data-item-id="${item.id}" data-item='${JSON.stringify(item)}'>Edit</button>
                        <button class="delete-gallery-item" data-item-id="${item.id}">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.galleryList.innerHTML = html;

        // Add event listeners
        const editButtons = selectAll('.edit-gallery-item', this.elements.galleryList);
        const deleteButtons = selectAll('.delete-gallery-item', this.elements.galleryList);

        editButtons.forEach(button => {
            addEvent(button, 'click', () => {
                const item = JSON.parse(button.dataset.item);
                this.editGalleryItem(item);
            });
        });

        deleteButtons.forEach(button => {
            addEvent(button, 'click', () => {
                if (confirm('Are you sure you want to delete this gallery item?')) {
                    this.deleteGalleryItem(button.dataset.itemId);
                }
            });
        });
    }

    async submitGalleryItem(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const formData = new FormData(form);

            // Validate required fields
            if (!formData.get('title')) {
                throw new Error('Title is required');
            }

            if (!this.currentGalleryItem && !formData.get('image').size) {
                throw new Error('Image is required');
            }

            // Determine if this is a create or update operation
            let url = this.apiEndpoints.GALLERY;
            let method = 'POST';

            if (this.currentGalleryItem) {
                url = `${this.apiEndpoints.GALLERY}/${this.currentGalleryItem}`;
                method = 'PUT';
            }

            // Send the request
            const response = await fetch(url, {
                method,
                headers: {
                    'X-CSRF-Token': this.csrfToken
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save gallery item');
            }

            this.showMessage(`Gallery item ${this.currentGalleryItem ? 'updated' : 'added'} successfully`, 'success');
            this.resetGalleryForm();
            this.loadGalleryItems();
        } catch (error) {
            errorHandler(error, 'Gallery item submission');
            this.showMessage(error.message, 'error');
        }
    }

    editGalleryItem(item) {
        this.currentGalleryItem = item.id;

        // Populate the form
        const form = this.elements.galleryForm;
        if (!form) return;

        form.elements.title.value = item.title || '';
        form.elements.description.value = item.description || '';

        // Update button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Update Gallery Item';
        }

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    resetGalleryForm() {
        const form = this.elements.galleryForm;
        if (!form) return;

        form.reset();
        this.currentGalleryItem = null;

        // Reset button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Add Gallery Item';
        }
    }

    async deleteGalleryItem(itemId) {
        try {
            const response = await fetch(`${this.apiEndpoints.GALLERY}/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete gallery item');
            }

            this.showMessage('Gallery item deleted successfully', 'success');
            this.loadGalleryItems();
        } catch (error) {
            errorHandler(error, 'Delete gallery item');
            this.showMessage('Failed to delete gallery item: ' + error.message, 'error');
        }
    }

    // Calendar/Events management
    async loadEvents() {
        try {
            const response = await fetch(this.apiEndpoints.EVENTS);
            if (!response.ok) throw new Error('Failed to load events');

            const events = await response.json();
            this.renderEvents(events);
        } catch (error) {
            errorHandler(error, 'Loading events');
            this.showMessage('Failed to load events: ' + error.message, 'error');
        }
    }

    renderEvents(events) {
        if (!this.elements.eventsList) return;

        if (events.length === 0) {
            this.elements.eventsList.innerHTML = '<p>No events found.</p>';
            return;
        }

        const formatDate = dateString => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const html = events.map(event => `
            <div class="event-item">
                <div class="event-icon">
                    ${event.icon ? `<img src="${event.icon}" alt="Event icon">` : ''}
                </div>
                <div class="event-details">
                    <h3>${escapeHtml(event.title)}</h3>
                    <p class="event-date">${formatDate(event.date)}</p>
                    <p class="event-price">$${event.price || '0'}</p>
                    <p>${escapeHtml(event.description || '')}</p>
                    <div class="item-actions">
                        <button class="edit-event" data-event-id="${event.id}" data-event='${JSON.stringify(event)}'>Edit</button>
                        <button class="delete-event" data-event-id="${event.id}">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.eventsList.innerHTML = html;

        // Add event listeners
        const editButtons = selectAll('.edit-event', this.elements.eventsList);
        const deleteButtons = selectAll('.delete-event', this.elements.eventsList);

        editButtons.forEach(button => {
            addEvent(button, 'click', () => {
                const event = JSON.parse(button.dataset.event);
                this.editEvent(event);
            });
        });

        deleteButtons.forEach(button => {
            addEvent(button, 'click', () => {
                if (confirm('Are you sure you want to delete this event?')) {
                    this.deleteEvent(button.dataset.eventId);
                }
            });
        });
    }

    async submitEvent(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const formData = new FormData(form);

            // Validate required fields
            if (!formData.get('title')) {
                throw new Error('Title is required');
            }

            if (!formData.get('date')) {
                throw new Error('Date is required');
            }

            // Determine if this is a create or update operation
            let url = this.apiEndpoints.EVENTS;
            let method = 'POST';

            if (this.currentEvent) {
                url = `${this.apiEndpoints.EVENTS}/${this.currentEvent}`;
                method = 'PUT';
            }

            // Send the request
            const response = await fetch(url, {
                method,
                headers: {
                    'X-CSRF-Token': this.csrfToken
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save event');
            }

            this.showMessage(`Event ${this.currentEvent ? 'updated' : 'created'} successfully`, 'success');
            this.resetEventForm();
            this.loadEvents();
        } catch (error) {
            errorHandler(error, 'Event submission');
            this.showMessage(error.message, 'error');
        }
    }

    editEvent(event) {
        this.currentEvent = event.id;

        // Populate the form
        const form = this.elements.eventForm;
        if (!form) return;

        form.elements.title.value = event.title || '';
        form.elements.date.value = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
        form.elements.price.value = event.price || '';
        form.elements.description.value = event.description || '';

        // Update button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Update Event';
        }

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    resetEventForm() {
        const form = this.elements.eventForm;
        if (!form) return;

        form.reset();
        this.currentEvent = null;

        // Reset button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Create Event';
        }
    }

    async deleteEvent(eventId) {
        try {
            const response = await fetch(`${this.apiEndpoints.EVENTS}/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete event');
            }

            this.showMessage('Event deleted successfully', 'success');
            this.loadEvents();
        } catch (error) {
            errorHandler(error, 'Delete event');
            this.showMessage('Failed to delete event: ' + error.message, 'error');
        }
    }

    // Subscription management
    async loadSubscriptions() {
        try {
            const response = await fetch('/api/admin/subscriptions');
            if (!response.ok) throw new Error('Failed to load subscriptions');

            const subscriptions = await response.json();
            this.renderSubscriptions(subscriptions);
        } catch (error) {
            errorHandler(error, 'Loading subscriptions');
            this.showMessage('Failed to load subscriptions: ' + error.message, 'error');
        }
    }

    renderSubscriptions(subscriptions) {
        if (!this.elements.subscriptionsList) return;

        if (subscriptions.length === 0) {
            this.elements.subscriptionsList.innerHTML = '<p>No subscriptions found.</p>';
            return;
        }

        const formatDate = dateString => {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${subscriptions.map(sub => `
                        <tr>
                            <td>${escapeHtml(sub.customer?.email || '')}</td>
                            <td>${escapeHtml(sub.customer?.name || '')}</td>
                            <td>${escapeHtml(sub.plan || '')}</td>
                            <td>${sub.active ? 'Active' : 'Cancelled'}</td>
                            <td>${formatDate(sub.created_at)}</td>
                            <td>
                                ${sub.active ?
                `<button class="cancel-subscription" data-sub-id="${sub.id}">Cancel</button>` :
                `<span>Cancelled on ${sub.cancelledAt ? formatDate(sub.cancelledAt) : 'N/A'}</span>`
            }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        this.elements.subscriptionsList.innerHTML = html;

        // Add event listeners for cancel buttons
        const cancelButtons = selectAll('.cancel-subscription', this.elements.subscriptionsList);
        cancelButtons.forEach(button => {
            addEvent(button, 'click', () => {
                if (confirm('Are you sure you want to cancel this subscription?')) {
                    this.cancelSubscription(button.dataset.subId);
                }
            });
        });
    }

    async cancelSubscription(subscriptionId) {
        try {
            const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel subscription');
            }

            this.showMessage('Subscription cancelled successfully', 'success');
            this.loadSubscriptions();
        } catch (error) {
            errorHandler(error, 'Cancel subscription');
            this.showMessage('Failed to cancel subscription: ' + error.message, 'error');
        }
    }

    exportSubscriptions() {
        try {
            const table = select('table', this.elements.subscriptionsList);
            if (!table) throw new Error('No subscription data to export');

            const rows = selectAll('tbody tr', table);
            if (rows.length === 0) throw new Error('No subscription data to export');

            let csvContent = 'Email,Name,Plan,Status,Created At\n';

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 5) return;

                const email = cells[0].textContent;
                const name = cells[1].textContent;
                const plan = cells[2].textContent;
                const status = cells[3].textContent;
                const created = cells[4].textContent;

                csvContent += `"${email}","${name}","${plan}","${status}","${created}"\n`;
            });

            // Create a blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `subscriptions-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showMessage('Subscriptions exported successfully', 'success');
        } catch (error) {
            errorHandler(error, 'Export subscriptions');
            this.showMessage('Failed to export subscriptions: ' + error.message, 'error');
        }
    }

    // Transaction management
    async loadTransactions(filters = {}) {
        try {
            let url = '/api/admin/transactions';

            // Apply filters if provided
            if (filters.startDate || filters.endDate) {
                const params = new URLSearchParams();
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load transactions');

            const transactions = await response.json();
            this.renderTransactions(transactions);
        } catch (error) {
            errorHandler(error, 'Loading transactions');
            this.showMessage('Failed to load transactions: ' + error.message, 'error');
        }
    }

    renderTransactions(transactions) {
        if (!this.elements.transactionsList) return;

        if (transactions.length === 0) {
            this.elements.transactionsList.innerHTML = '<p>No transactions found.</p>';
            return;
        }

        const formatDate = dateString => {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const formatCurrency = amount => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        };

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(transaction => `
                        <tr>
                            <td>${escapeHtml(transaction.id || '')}</td>
                            <td>${escapeHtml(transaction.customer?.name || '')}${transaction.customer?.email ?
                `<br><span class="email">${escapeHtml(transaction.customer.email)}</span>` :
                ''
            }</td>
                            <td>${Array.isArray(transaction.items) ?
                transaction.items.map(item => `
                                    <div class="transaction-item">
                                        ${escapeHtml(item.name || 'Unknown item')} x ${item.quantity || 1}
                                    </div>
                                `).join('') :
                'No items'
            }</td>
                            <td>${formatCurrency(transaction.amount || 0)}</td>
                            <td>${escapeHtml(transaction.status || 'completed')}</td>
                            <td>${formatDate(transaction.created_at)}</td>
                            <td>
                                <button class="view-transaction-details" data-transaction-id="${transaction.id}">View Details</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        this.elements.transactionsList.innerHTML = html;

        // Add event listeners for view details buttons
        const detailButtons = selectAll('.view-transaction-details', this.elements.transactionsList);
        detailButtons.forEach(button => {
            addEvent(button, 'click', () => {
                this.viewTransactionDetails(button.dataset.transactionId);
            });
        });
    }

    filterTransactions() {
        const startDate = this.elements.startDateInput?.value;
        const endDate = this.elements.endDateInput?.value;

        this.loadTransactions({ startDate, endDate });
    }

    viewTransactionDetails(transactionId) {
        // This could be enhanced to show a modal with detailed transaction information
        alert(`Viewing details for transaction ${transactionId} - Feature in development`);
    }

    async fetchCsrfToken() {
        try {
            const response = await fetch('/api/csrf-token', {
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('Failed to get CSRF token');
            }

            const data = await response.json();
            console.log('CSRF token retrieved');
            this.csrfToken = data.csrfToken;

        } catch (error) {
            console.error('Failed to get CSRF token:', error);
            this.showMessage('Failed to get security token. Some operations may not work.', 'error');
        }
    }

    /**
     * Load and render users
     */
    async loadUsers() {
        try {
            const response = await fetch(this.apiEndpoints.USERS, {
                headers: {
                    'X-CSRF-Token': this.csrfToken
                }
            });
            if (!response.ok) throw new Error('Failed to load users');
            const users = await response.json();
            this.renderUsers(users);
        } catch (error) {
            errorHandler(error, 'Loading users');
            this.showMessage('Failed to load users', 'error');
        }
    }

    /**
     * Render user list
     */
    renderUsers(users) {
        if (!this.elements.userList) return;

        this.elements.userList.innerHTML = users.map(user => `
            <div class="user-card" data-id="${escapeHtml(user.id)}">
                <div class="user-info">
                    <h3>${escapeHtml(user.email)}</h3>
                    <p>Role: ${escapeHtml(user.role)}</p>
                    <p>Status: ${escapeHtml(user.status)}</p>
                    <p>Last Login: ${new Date(user.last_login).toLocaleString()}</p>
                </div>
                <div class="user-actions">
                    <button class="edit-user" data-action="edit">Edit</button>
                    ${user.role !== 'admin' ? `
                        <button class="delete-user" data-action="delete">Delete</button>
                    ` : ''}
                    <button class="toggle-status" data-action="toggle-status">
                        ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to user actions
        addEvent(this.elements.userList, 'click', this.handleUserActions.bind(this));
    }

    /**
     * Handle user form submission
     */
    async handleUserSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        try {
            // Validate form data
            if (!formData.get('email') || !formData.get('role')) {
                throw new Error('Email and role are required');
            }

            const userData = {
                email: formData.get('email'),
                role: formData.get('role'),
                status: formData.get('status')
            };

            const userId = formData.get('userId');
            const method = userId ? 'PUT' : 'POST';
            const url = userId ?
                `${this.apiEndpoints.USERS}/${userId}` :
                this.apiEndpoints.USERS;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error('Failed to save user');

            this.showMessage(`User ${userId ? 'updated' : 'created'} successfully`, 'success');
            this.resetForm(this.elements.userForm);
            this.loadUsers();
        } catch (error) {
            errorHandler(error, 'User submission');
            this.showMessage(error.message, 'error');
        }
    }

    /**
     * Handle user action clicks (edit, delete, toggle status)
     */
    async handleUserActions(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const userCard = button.closest('.user-card');
        if (!userCard) return;

        const userId = userCard.dataset.id;
        const action = button.dataset.action;

        try {
            switch (action) {
                case 'edit':
                    await this.editUser(userId);
                    break;
                case 'delete':
                    if (await this.confirmAction('Are you sure you want to delete this user?')) {
                        await this.deleteUser(userId);
                    }
                    break;
                case 'toggle-status':
                    if (await this.confirmAction('Are you sure you want to change this user\'s status?')) {
                        await this.toggleUserStatus(userId);
                    }
                    break;
            }
        } catch (error) {
            errorHandler(error, 'User action');
            this.showMessage(error.message, 'error');
        }
    }

    /**
     * Load user data into form for editing
     */
    async editUser(userId) {
        try {
            const response = await fetch(`${this.apiEndpoints.USERS}/${userId}`, {
                headers: {
                    'X-CSRF-Token': this.csrfToken
                }
            });
            if (!response.ok) throw new Error('Failed to load user data');

            const user = await response.json();

            if (this.elements.userForm) {
                this.elements.userForm.elements.userId.value = user.id;
                this.elements.userForm.elements.email.value = user.email;
                this.elements.userForm.elements.role.value = user.role;
                this.elements.userForm.elements.status.value = user.status;
            }
        } catch (error) {
            errorHandler(error, 'Edit user');
            this.showMessage('Failed to load user data', 'error');
        }
    }

    /**
     * Delete a user
     */
    async deleteUser(userId) {
        try {
            const response = await fetch(`${this.apiEndpoints.USERS}/${userId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to delete user');

            this.showMessage('User deleted successfully', 'success');
            this.loadUsers();
        } catch (error) {
            errorHandler(error, 'Delete user');
            this.showMessage('Failed to delete user', 'error');
        }
    }

    /**
     * Toggle user status (active/inactive)
     */
    async toggleUserStatus(userId) {
        try {
            const response = await fetch(`${this.apiEndpoints.USER_STATUS}/${userId}`, {
                method: 'PUT',
                headers: {
                    'X-CSRF-Token': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to update user status');

            this.showMessage('User status updated successfully', 'success');
            this.loadUsers();
        } catch (error) {
            errorHandler(error, 'Toggle user status');
            this.showMessage('Failed to update user status', 'error');
        }
    }

    // Add confirmation dialog utility
    async confirmAction(message) {
        return window.confirm(message);
    }

    initializeSection() {
        // ... existing code ...

        // Initialize user management if on users section
        if (window.location.hash === '#users') {
            this.loadUsers();
        }
    }
}

// Initialize admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing admin panel...');
    new AdminPanel();
});
