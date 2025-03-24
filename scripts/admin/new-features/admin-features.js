/**
 * admin-features.js - Integration module for admin panel features
 * 
 * This module integrates the category and stock management functionality
 * and provides initialization functions for the AdminPanel class.
 */
import { CategoryManager } from './category-manager.js';
import { StockManager, STOCK_LEVELS } from './stock-manager.js';
import { select, addEvent } from '../../utils/utilities.js';

// API endpoint configuration
const API_ENDPOINTS = {
    PRODUCTS: '/api/admin/products',
    CATEGORIES: '/api/admin/categories',
    STOCK_LEVELS: '/api/admin/stock-levels'
};

// Initialize admin panel features
export function initAdminFeatures(adminPanel) {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setupFeatures(adminPanel));
    } else {
        setupFeatures(adminPanel);
    }
}

// Set up admin panel features
function setupFeatures(adminPanel) {
    if (!adminPanel) {
        console.error('Admin panel instance is required for feature initialization');
        return;
    }
    
    // Set up category manager
    const categoryManager = new CategoryManager(
        API_ENDPOINTS.CATEGORIES,
        adminPanel.csrfToken,
        adminPanel.messageSystem.displayMessage.bind(adminPanel.messageSystem)
    );
    
    // Set up stock manager
    const stockManager = new StockManager(
        API_ENDPOINTS.PRODUCTS,
        adminPanel.csrfToken,
        adminPanel.messageSystem.displayMessage.bind(adminPanel.messageSystem)
    );
    
    // Set up callback to reload products after stock update
    stockManager.onStockUpdated = () => {
        adminPanel.loadProducts();
    };
    
    // Set up callback to filter products by stock level
    stockManager.onProductsFiltered = (filteredProducts) => {
        adminPanel.renderProducts(filteredProducts);
    };
    
    // Add features to admin panel for access
    adminPanel.categoryManager = categoryManager;
    adminPanel.stockManager = stockManager;
    
    // Set up UI elements for stock management
    addStockManagementUI(adminPanel, stockManager);
    
    // Add low stock alert container
    addLowStockAlert();
    
    // Add stock filter to shop section
    addStockFilter(stockManager);
    
    // Initialize the features
    categoryManager.loadCategories();
    
    // Add to product rendering to include stock indicators
    const originalCreateProductCard = adminPanel.createProductCard;
    adminPanel.createProductCard = function(product) {
        const card = originalCreateProductCard.call(this, product);
        
        // Add stock level indicator
        const stockIndicator = stockManager.createStockIndicator(product);
        const productDetails = card.querySelector('.product-details');
        if (productDetails) {
            const productName = productDetails.querySelector('h3');
            if (productName) {
                productName.innerHTML += stockIndicator;
            }
        }
        
        return card;
    };
    
    // Override product loading to update stock manager
    const originalLoadProducts = adminPanel.loadProducts;
    adminPanel.loadProducts = async function() {
        const result = await originalLoadProducts.call(this);
        
        // Update stock manager with loaded products
        if (result && result.products) {
            stockManager.setProducts(result.products);
        }
        
        return result;
    };
    
    // Add quick stock update buttons to product cards
    const productList = select('#productList');
    if (productList) {
        addEvent(productList, 'click', handleQuickStockUpdate.bind(null, adminPanel, stockManager));
    }
    
    return {
        categoryManager,
        stockManager
    };
}

// Add stock management UI
function addStockManagementUI(adminPanel, stockManager) {
    // Find the bulk-upload-tab
    const bulkUploadTab = select('#bulk-upload-tab');
    if (bulkUploadTab) {
        // Create bulk stock management tab
        const stockTab = document.createElement('div');
        stockTab.id = 'stock-management-tab';
        stockTab.className = 'tab-content';
        
        stockTab.innerHTML = `
            <h3>Stock Management</h3>
            <p>Update stock levels for multiple products at once.</p>
        `;
        
        // Insert after bulk upload tab
        bulkUploadTab.parentNode.insertBefore(stockTab, bulkUploadTab.nextSibling);
        
        // Create bulk stock form and add it to the stock tab
        const bulkStockForm = stockManager.createBulkStockUpdateForm();
        stockTab.appendChild(bulkStockForm);
        
        // Add tab button
        const tabsContainer = select('.tabs');
        if (tabsContainer) {
            const stockTabButton = document.createElement('div');
            stockTabButton.className = 'tab';
            stockTabButton.setAttribute('data-tab', 'stock-management');
            stockTabButton.textContent = 'Stock Management';
            
            // Add it after bulk-upload tab button
            const bulkUploadTabButton = tabsContainer.querySelector('[data-tab="bulk-upload"]');
            if (bulkUploadTabButton) {
                tabsContainer.insertBefore(stockTabButton, bulkUploadTabButton.nextSibling);
            } else {
                tabsContainer.appendChild(stockTabButton);
            }
            
            // Add event listener to show the tab content
            addEvent(stockTabButton, 'click', () => {
                // Hide all tab content
                const allTabContent = document.querySelectorAll('.tab-content');
                allTabContent.forEach(tab => tab.classList.remove('active'));
                
                // Remove active class from all tab buttons
                const allTabButtons = document.querySelectorAll('.tab');
                allTabButtons.forEach(tab => tab.classList.remove('active'));
                
                // Show this tab content
                stockTab.classList.add('active');
                stockTabButton.classList.add('active');
            });
        }
    }
}

// Add low stock alert container
function addLowStockAlert() {
    const adminContainer = select('.admin-container');
    if (adminContainer) {
        const lowStockAlert = document.createElement('div');
        lowStockAlert.id = 'lowStockAlert';
        lowStockAlert.className = 'low-stock-alert';
        lowStockAlert.style.display = 'none';
        
        // Insert at the top of the admin container
        adminContainer.insertBefore(lowStockAlert, adminContainer.firstChild);
    }
}

// Add stock level filter to shop section
function addStockFilter(stockManager) {
    const productList = select('#productList');
    if (productList && productList.parentNode) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        
        filterContainer.innerHTML = `
            <div class="form-group">
                <label for="stockFilter">Filter by Stock Level:</label>
                <select id="stockFilter">
                    <option value="all">All Products</option>
                    <option value="low">Low Stock</option>
                    <option value="medium">Medium Stock</option>
                    <option value="high">High Stock</option>
                </select>
            </div>
        `;
        
        // Insert before the product list
        productList.parentNode.insertBefore(filterContainer, productList);
        
        // Update stock manager's reference to the filter
        stockManager.elements.stockFilterSelect = select('#stockFilter');
        
        // Add event listener
        const stockFilter = select('#stockFilter');
        if (stockFilter) {
            addEvent(stockFilter, 'change', (event) => {
                stockManager.filterProductsByStock(event);
            });
        }
    }
}

// Handle quick stock update buttons
function handleQuickStockUpdate(adminPanel, stockManager, event) {
    const target = event.target;
    
    if (target.classList.contains('quick-stock-add')) {
        const productId = target.getAttribute('data-id');
        quickUpdateStock(adminPanel, stockManager, productId, 'add', 1);
    } else if (target.classList.contains('quick-stock-subtract')) {
        const productId = target.getAttribute('data-id');
        quickUpdateStock(adminPanel, stockManager, productId, 'subtract', 1);
    }
}

// Perform quick stock update
async function quickUpdateStock(adminPanel, stockManager, productId, action, amount) {
    try {
        const product = adminPanel.products.find(p => p.id === productId);
        if (!product) return;
        
        let newQuantity;
        
        switch (action) {
            case 'add':
                newQuantity = (product.quantity || 0) + amount;
                break;
            case 'subtract':
                newQuantity = Math.max(0, (product.quantity || 0) - amount);
                break;
            default:
                return;
        }
        
        // Update product in the database
        const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQuantity }),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': adminPanel.csrfToken
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update product stock: ${response.statusText}`);
        }
        
        // Reload products to show updated stock levels
        adminPanel.loadProducts();
        
    } catch (error) {
        console.error('Error updating stock:', error);
        adminPanel.messageSystem.displayMessage(error.message, 'error');
    }
}

// Export any constants or utility functions
export { STOCK_LEVELS, API_ENDPOINTS }; 