// Constants and configuration
const CONFIG = {
    MESSAGE_TIMEOUT: 5000,
    DEBOUNCE_DELAY: 300,
    API_ENDPOINTS: {
        PRODUCTS: '/api/admin/products',
        GALLERY: '/api/admin/gallery',
        EVENTS: '/api/admin/events',
        PAYPAL: '/api/admin/paypal-settings'
    },
    STYLES: {
        BUTTON_WRAPPER: 'display: block !important; visibility: visible !important; opacity: 1 !important; position: absolute !important; bottom: 0 !important; left: 0 !important; right: 0 !important; z-index: 100 !important; transform: translateZ(0) !important; -webkit-transform: translateZ(0) !important; will-change: transform !important;',
        BUTTON_ACTIONS: 'display: flex !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 101 !important; transform: translateZ(0) !important; -webkit-transform: translateZ(0) !important;',
        BUTTON: 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 102 !important; pointer-events: auto !important; -webkit-user-select: auto !important; user-select: auto !important;'
    }
};

// Utility functions
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// Enhanced message display with cleanup
const createMessageSystem = () => {
    let currentTimeout;
    const messageQueue = [];

    const displayMessage = (message, type) => {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}-message`;
        
        const container = document.querySelector('.admin-content');
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

// HTML sanitization
const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Main application class
class AdminPanel {
    constructor() {
        this.currentProduct = null;
        this.observer = null;
        this.showMessage = createMessageSystem();
        this.cache = new Map();
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
            console.error('Auth check failed:', error);
            window.location.href = '/admin/login';
            return;
        }

        this.bindElements();
        this.setupEventListeners();
        this.initializeSection();
    }

    bindElements() {
        this.elements = {
            navLinks: document.querySelectorAll('.nav-links a'),
            sections: document.querySelectorAll('.section'),
            productForm: document.getElementById('productForm'),
            productsList: document.getElementById('productsList'),
            paypalForm: document.getElementById('paypalForm'),
            galleryForm: document.getElementById('galleryForm'),
            eventForm: document.getElementById('eventForm'),
            shopSection: document.getElementById('shop')
        };
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        // Navigation
        this.elements.navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
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

                // Load shop data immediately when section becomes visible
                if (targetId === 'shop') {
                    console.log('Shop section activated, loading products...');
                    this.loadProducts().catch(error => {
                        console.error('Failed to load products:', error);
                        this.showMessage('Failed to load products. Please refresh the page.', 'error');
                    });
                    
                    // Set up periodic refresh
                    if (this._productRefreshInterval) {
                        clearInterval(this._productRefreshInterval);
                    }
                    this._productRefreshInterval = setInterval(() => {
                        if (document.visibilityState === 'visible' && this.elements.shopSection?.style.display === 'block') {
                            console.log('Refreshing products data...');
                            this.loadProducts().catch(console.error);
                        }
                    }, 30000); // Refresh every 30 seconds while visible
                } else if (this._productRefreshInterval) {
                    clearInterval(this._productRefreshInterval);
                }
            });
        });

        // Product form
        this.elements.productForm?.addEventListener('submit', 
            debounce(this.handleProductSubmit.bind(this), CONFIG.DEBOUNCE_DELAY)
        );

        // Product list delegation
        this.elements.productsList?.addEventListener('click', this.handleProductActions.bind(this));

        // Initialize MutationObserver for shop section
        if (this.elements.shopSection) {
            this.observer = new MutationObserver(this.handleShopSectionMutation.bind(this));
            this.observer.observe(this.elements.shopSection, {
                attributes: true,
                attributeFilter: ['style']
            });
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
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            validateProduct(formData);
            
            const endpoint = this.currentProduct 
                ? `${CONFIG.API_ENDPOINTS.PRODUCTS}/${this.currentProduct}`
                : CONFIG.API_ENDPOINTS.PRODUCTS;

            // Get CSRF token
            console.log('Getting CSRF token...');
            const tokenResponse = await fetch('/api/csrf-token', {
                credentials: 'same-origin'
            });
            if (!tokenResponse.ok) {
                throw new Error('Failed to get CSRF token');
            }
            const tokenData = await tokenResponse.json();
            console.log('Received CSRF token:', tokenData);
            
            // Log form data for debugging
            console.log('Form data contents:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            // Make the request with CSRF token
            console.log('Submitting to endpoint:', endpoint);
            console.log('Request method:', this.currentProduct ? 'PUT' : 'POST');
            
            const response = await fetch(endpoint, {
                method: this.currentProduct ? 'PUT' : 'POST',
                credentials: 'same-origin',
                headers: {
                    'CSRF-Token': tokenData.csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });
            
            console.log('Response received');
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            
            const responseText = await response.text();
            console.log('Response body:', responseText);
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                console.log('Response was not JSON:', responseText);
                throw new Error('Invalid server response');
            }
            
            if (!response.ok) {
                throw new Error(responseData?.message || responseData?.error || 'Failed to save product');
            }

            // Success
            this.showMessage('Product saved successfully!', 'success');
            this.resetForm();
            await this.loadProducts();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    handleProductActions(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const productCard = button.closest('.product-card');
        if (!productCard) return;

        if (button.classList.contains('edit-btn')) {
            const product = JSON.parse(productCard.dataset.product || '{}');
            this.editProduct(product);
        } else if (button.classList.contains('delete-btn')) {
            this.deleteProduct(productCard.dataset.productId);
        }
    }

    editProduct(product) {
        if (!product?.id || !this.elements.productForm) return;
        
        this.currentProduct = product.id;
        
        const elements = {
            name: document.getElementById('productName'),
            description: document.getElementById('productDescription'),
            price: document.getElementById('productPrice'),
            quantity: document.getElementById('productQuantity'),
            type: document.getElementById('productType'),
            submitBtn: this.elements.productForm.querySelector('button[type="submit"]')
        };
        
        if (elements.name) elements.name.value = product.name || '';
        if (elements.description) elements.description.value = product.description || '';
        if (elements.price) elements.price.value = product.price || '';
        if (elements.quantity) elements.quantity.value = product.quantity || '';
        if (elements.type) elements.type.value = product.type || 'package';
        if (elements.submitBtn) elements.submitBtn.textContent = 'Update Product';
        
        this.elements.shopSection?.scrollIntoView({ behavior: 'smooth' });
    }

    async deleteProduct(productId) {
        if (!productId) return;
        
        try {
            // Get CSRF token
            const tokenResponse = await fetch('/api/csrf-token', {
                credentials: 'same-origin'
            });
            if (!tokenResponse.ok) {
                throw new Error('Failed to get CSRF token');
            }
            const { csrfToken } = await tokenResponse.json();

            const response = await fetch(`${CONFIG.API_ENDPOINTS.PRODUCTS}/${productId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'CSRF-Token': csrfToken
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to delete product');
            }
            
            this.showMessage('Product deleted successfully!', 'success');
            await this.loadProducts();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    createProductCard(product) {
        if (!product?.id) return null;
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        card.dataset.product = JSON.stringify(product);
        card.style.cssText = 'position: relative !important; min-height: 450px !important; transform: translateZ(0) !important;';

        // Create product content container
        const content = document.createElement('div');
        content.style.cssText = 'height: calc(100% - 60px) !important; overflow: hidden !important;';
        
        content.innerHTML = `
            <div class="product-image">
                <img src="${escapeHtml(product.imageUrl) || '/images/placeholder.png'}" 
                     alt="${escapeHtml(product.name)}"
                     onerror="this.src='/images/placeholder.png'">
                <span class="product-type ${product.type}">${product.type.toUpperCase()}</span>
                ${product.type === 'subscription' ? 
                    `<span class="product-interval">${product.interval}</span>` : ''}
            </div>
            <div class="product-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="description">${escapeHtml(product.description)}</p>
                <p class="price">$${parseFloat(product.price).toFixed(2)}</p>
                <p class="quantity">Stock: ${product.quantity === 999999 ? 'Unlimited' : product.quantity}</p>
            </div>
        `;
        card.appendChild(content);

        // Create actions container
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'product-actions-wrapper';
        actionsWrapper.style.cssText = 'position: absolute !important; bottom: 0 !important; left: 0 !important; right: 0 !important; background: white !important; z-index: 1000 !important; padding: 1rem !important; border-top: 1px solid #e2e8f0 !important;';
        
        const actions = document.createElement('div');
        actions.className = 'product-actions';
        actions.style.cssText = 'display: flex !important; justify-content: space-between !important; gap: 0.5rem !important;';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.style.cssText = 'flex: 1 !important; background-color: #4CAF50 !important; color: white !important; border: none !important; padding: 0.75rem !important; border-radius: 4px !important; cursor: pointer !important; font-size: 1rem !important;';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.cssText = 'flex: 1 !important; background-color: #f44336 !important; color: white !important; border: none !important; padding: 0.75rem !important; border-radius: 4px !important; cursor: pointer !important; font-size: 1rem !important;';
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        actionsWrapper.appendChild(actions);
        card.appendChild(actionsWrapper);
        
        return card;
    }

    ensureButtonsVisible() {
        requestAnimationFrame(() => {
            const cards = this.elements.productsList?.querySelectorAll('.product-card');
            if (!cards?.length) return;
            
            cards.forEach(card => {
                // Force a repaint to ensure proper stacking context
                card.style.transform = 'translateZ(0)';
                
                const elements = {
                    wrapper: card.querySelector('.product-actions-wrapper'),
                    actions: card.querySelector('.product-actions'),
                    buttons: card.querySelectorAll('.product-actions button')
                };
                
                if (elements.wrapper) {
                    elements.wrapper.style.cssText = CONFIG.STYLES.BUTTON_WRAPPER;
                }
                
                if (elements.actions) {
                    elements.actions.style.cssText = CONFIG.STYLES.BUTTON_ACTIONS;
                }
                
                elements.buttons?.forEach(button => {
                    button.style.cssText = CONFIG.STYLES.BUTTON;
                    // Ensure click events work
                    button.style.pointerEvents = 'auto';
                });
            });
        });
    }

    async loadProducts() {
        console.log('Loading products...');
        const startTime = Date.now();
        
        try {
            console.log('Fetching products from:', CONFIG.API_ENDPOINTS.PRODUCTS);
            const cachedVersion = this.cache.get('productsVersion');
            
            const response = await fetch(CONFIG.API_ENDPOINTS.PRODUCTS, {
                credentials: 'same-origin',
                headers: {
                    'If-None-Match': cachedVersion || '',
                    'X-Request-Time': new Date().toISOString(),
                    'X-Client-ID': 'admin-panel'
                }
            });
            
            // Handle 304 Not Modified
            if (response.status === 304) {
                console.log('Products not modified, using cached data');
                const cachedProducts = this.cache.get('products');
                if (cachedProducts) {
                    this.renderProducts(cachedProducts);
                    return;
                }
            }
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers));
            
            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to load products');
            }
            
            const products = await response.json();
            
            // Update cache with new data and version
            if (response.headers.has('ETag')) {
                this.cache.set('productsVersion', response.headers.get('ETag'));
                this.cache.set('products', products);
                console.log('Updated cache with new version:', response.headers.get('ETag'));
            }
            
            this.renderProducts(products);
            
            const loadTime = Date.now() - startTime;
            console.log(`Products loaded and rendered in ${loadTime}ms`);
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    renderProducts(products) {
        if (!this.elements.productsList) return;
        
        console.log(`Rendering ${products.length} products`);
        const startTime = performance.now();
        
        const fragment = document.createDocumentFragment();
        
        if (!Array.isArray(products) || products.length === 0) {
            const noProducts = document.createElement('p');
            noProducts.textContent = 'No products found. Add your first product using the form above.';
            fragment.appendChild(noProducts);
        } else {
            products.forEach(product => {
                const card = this.createProductCard(product);
                if (card) fragment.appendChild(card);
            });
        }
        
        this.elements.productsList.innerHTML = '';
        this.elements.productsList.appendChild(fragment);
        
        requestAnimationFrame(() => {
            this.ensureButtonsVisible();
            const renderTime = Math.round(performance.now() - startTime);
            console.log(`Products rendered in ${renderTime}ms`);
        });
    }

    resetForm() {
        if (!this.elements.productForm) return;
        this.elements.productForm.reset();
        this.currentProduct = null;
        const submitBtn = this.elements.productForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add Product';
    }

    initializeSection() {
        // Initial section display
        const currentHash = window.location.hash || '#paypal';
        this.elements.sections?.forEach((section) => {
            if (!section) return;
            
            const shouldDisplay = 
                (currentHash === '#shop' && section.id === 'shop') ||
                (!currentHash && section === this.elements.sections[0]);
            
            section.style.display = shouldDisplay ? 'block' : 'none';
            
            const correspondingLink = document.querySelector(`a[href="#${section.id}"]`);
            if (shouldDisplay && correspondingLink) {
                correspondingLink.classList.add('active');
            }
        });

        // Load initial data
        if (currentHash === '#shop' || !currentHash) {
            this.loadProducts().catch(error => this.showMessage(error.message, 'error'));
        }
    }

    cleanup() {
        console.log('Cleaning up admin panel...');
        
        // Clear all intervals
        if (this._productRefreshInterval) {
            console.log('Clearing product refresh interval');
            clearInterval(this._productRefreshInterval);
            this._productRefreshInterval = null;
        }

        // Disconnect observer
        if (this.observer) {
            console.log('Disconnecting mutation observer');
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Clear cache and pending requests
        if (this.cache?.size > 0) {
            console.log(`Clearing cache (${this.cache.size} items)`);
            this.cache.clear();
        }
        
        // Reset form state
        if (this.elements.productForm) {
            console.log('Resetting product form');
            const newForm = this.elements.productForm.cloneNode(true);
            this.elements.productForm.parentNode?.replaceChild(newForm, this.elements.productForm);
        }

        // Clear any pending messages
        const messages = document.querySelectorAll('.message');
        if (messages.length > 0) {
            console.log(`Removing ${messages.length} message(s)`);
            messages.forEach(msg => msg.remove());
        }

        console.log('Cleanup completed');
    }
}

// Initialize the admin panel
document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();
    window.adminPanel = adminPanel; // Make it available globally
    
    // Cleanup on page hide/visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            adminPanel.cleanup();
        }
    });
});
