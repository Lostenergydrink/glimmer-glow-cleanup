/**
 * stock-manager.js - Product stock management functionality for admin panel
 */
import { 
    select, 
    selectAll, 
    addEvent, 
    removeEvent,
    errorHandler 
} from '../../utils/utilities.js';

// Stock level thresholds and visual indicators
export const STOCK_LEVELS = {
    LOW: { max: 5, color: '#ff4d4d', label: 'Low Stock' },     // Red
    MEDIUM: { max: 20, color: '#ffa64d', label: 'Medium Stock' }, // Orange
    HIGH: { color: '#66cc66', label: 'In Stock' }     // Green
};

export class StockManager {
    constructor(apiEndpoint, csrfToken, showMessage) {
        this.apiEndpoint = apiEndpoint;
        this.csrfToken = csrfToken;
        this.showMessage = showMessage;
        this.products = [];
        
        // DOM elements
        this.elements = {
            stockFilterSelect: select('#stockFilter'),
            bulkStockForm: select('#bulkStockForm'),
            lowStockAlert: select('#lowStockAlert')
        };
        
        this.initialize();
    }
    
    initialize() {
        // Set up event listeners for stock management
        if (this.elements.bulkStockForm) {
            addEvent(this.elements.bulkStockForm, 'submit', this.handleBulkStockUpdate.bind(this));
        }
        
        if (this.elements.stockFilterSelect) {
            addEvent(this.elements.stockFilterSelect, 'change', this.filterProductsByStock.bind(this));
        }
        
        // Check for low stock products on initialization
        this.checkLowStockProducts();
    }
    
    setCsrfToken(token) {
        this.csrfToken = token;
    }
    
    // Calculate stock level based on quantity
    getStockLevel(quantity) {
        if (quantity <= STOCK_LEVELS.LOW.max) {
            return { 
                status: 'LOW', 
                color: STOCK_LEVELS.LOW.color,
                label: STOCK_LEVELS.LOW.label
            };
        } else if (quantity <= STOCK_LEVELS.MEDIUM.max) {
            return { 
                status: 'MEDIUM', 
                color: STOCK_LEVELS.MEDIUM.color,
                label: STOCK_LEVELS.MEDIUM.label
            };
        } else {
            return { 
                status: 'HIGH', 
                color: STOCK_LEVELS.HIGH.color,
                label: STOCK_LEVELS.HIGH.label
            };
        }
    }
    
    // Add stock level indicator to product display
    createStockIndicator(product) {
        const stockLevel = product.stockLevel || this.getStockLevel(product.quantity || 0);
        
        return `
            <span class="stock-indicator" 
                  style="background-color: ${stockLevel.color}">
                ${stockLevel.label} (${product.quantity})
            </span>
        `;
    }
    
    // Check for low stock products and display alert if needed
    checkLowStockProducts() {
        const lowStockProducts = this.products.filter(p => 
            (p.quantity || 0) <= STOCK_LEVELS.LOW.max
        );
        
        const lowStockAlert = this.elements.lowStockAlert;
        if (!lowStockAlert) return;
        
        if (lowStockProducts.length > 0) {
            lowStockAlert.innerHTML = `
                <div class="alert alert-warning">
                    <strong>Low Stock Alert:</strong> ${lowStockProducts.length} product(s) have low stock.
                    <a href="#shop" class="stock-filter-link" data-filter="low">View Low Stock Items</a>
                </div>
            `;
            lowStockAlert.style.display = 'block';
            
            // Add event listener to the "View Low Stock Items" link
            const filterLink = lowStockAlert.querySelector('.stock-filter-link');
            if (filterLink) {
                addEvent(filterLink, 'click', (e) => {
                    e.preventDefault();
                    this.showLowStockProducts();
                });
            }
        } else {
            lowStockAlert.style.display = 'none';
        }
    }
    
    // Show only low stock products
    showLowStockProducts() {
        // Navigate to shop section
        const shopLink = select('a[href="#shop"]');
        if (shopLink) {
            shopLink.click();
        }
        
        // Set filter to "Low Stock"
        const stockFilter = this.elements.stockFilterSelect;
        if (stockFilter) {
            stockFilter.value = 'low';
            this.filterProductsByStock({ target: stockFilter });
        }
    }
    
    // Filter products by stock level
    filterProductsByStock(event) {
        const filterValue = event.target.value;
        let filteredProducts = [...this.products];
        
        switch (filterValue) {
            case 'low':
                filteredProducts = this.products.filter(p => 
                    (p.quantity || 0) <= STOCK_LEVELS.LOW.max
                );
                break;
            case 'medium':
                filteredProducts = this.products.filter(p => 
                    (p.quantity || 0) > STOCK_LEVELS.LOW.max && 
                    (p.quantity || 0) <= STOCK_LEVELS.MEDIUM.max
                );
                break;
            case 'high':
                filteredProducts = this.products.filter(p => 
                    (p.quantity || 0) > STOCK_LEVELS.MEDIUM.max
                );
                break;
            // 'all' or default: show all products
        }
        
        // Callback to parent to render the filtered products
        if (typeof this.onProductsFiltered === 'function') {
            this.onProductsFiltered(filteredProducts);
        }
    }
    
    // Handle bulk stock update
    async handleBulkStockUpdate(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const formData = new FormData(form);
            
            const updateType = formData.get('updateType'); // 'set', 'add', or 'subtract'
            const quantity = parseInt(formData.get('quantity'), 10);
            
            if (isNaN(quantity) || quantity < 0) {
                throw new Error('Please enter a valid quantity');
            }
            
            const selectedProducts = Array.from(
                formData.getAll('selectedProducts')
            );
            
            if (selectedProducts.length === 0) {
                throw new Error('Please select at least one product');
            }
            
            let successCount = 0;
            let failCount = 0;
            
            // Process each selected product
            for (const productId of selectedProducts) {
                try {
                    const product = this.products.find(p => p.id === productId);
                    
                    if (!product) continue;
                    
                    let newQuantity;
                    
                    switch (updateType) {
                        case 'set':
                            newQuantity = quantity;
                            break;
                        case 'add':
                            newQuantity = (product.quantity || 0) + quantity;
                            break;
                        case 'subtract':
                            newQuantity = Math.max(0, (product.quantity || 0) - quantity);
                            break;
                        default:
                            continue;
                    }
                    
                    const response = await fetch(`${this.apiEndpoint}/${productId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ quantity: newQuantity }),
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': this.csrfToken
                        },
                        credentials: 'same-origin'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Failed to update product ${product.name}: ${response.statusText}`);
                    }
                    
                    successCount++;
                    
                } catch (error) {
                    console.error(error);
                    failCount++;
                }
            }
            
            // Show results
            if (successCount > 0) {
                this.showMessage(`Successfully updated ${successCount} product(s)`, 'success');
            }
            
            if (failCount > 0) {
                this.showMessage(`Failed to update ${failCount} product(s)`, 'error');
            }
            
            // Reset form and reload products
            form.reset();
            
            // Trigger reload of products
            if (typeof this.onStockUpdated === 'function') {
                this.onStockUpdated();
            }
            
        } catch (error) {
            errorHandler(error, 'Bulk stock update');
            this.showMessage(error.message, 'error');
        }
    }
    
    // Update the products array
    setProducts(products) {
        this.products = products;
        this.checkLowStockProducts();
    }
    
    // Update stock alert section based on latest product data
    updateStockAlerts() {
        this.checkLowStockProducts();
    }
    
    // Create a new bulk stock update form
    createBulkStockUpdateForm() {
        const form = document.createElement('form');
        form.id = 'bulkStockForm';
        form.className = 'bulk-stock-form';
        
        form.innerHTML = `
            <h3>Bulk Stock Update</h3>
            <div class="form-group">
                <label>Update Type:</label>
                <select name="updateType" required>
                    <option value="set">Set Quantity</option>
                    <option value="add">Add Quantity</option>
                    <option value="subtract">Subtract Quantity</option>
                </select>
            </div>
            <div class="form-group">
                <label>Quantity:</label>
                <input type="number" name="quantity" min="0" required>
            </div>
            <div class="form-group">
                <label>Select Products:</label>
                <div class="product-selection">
                    ${this.createProductCheckboxes()}
                </div>
            </div>
            <div class="form-actions">
                <button type="submit">Update Stock</button>
                <button type="button" class="select-all">Select All</button>
                <button type="button" class="deselect-all">Deselect All</button>
            </div>
        `;
        
        // Add event listeners for select/deselect all buttons
        const selectAllBtn = form.querySelector('.select-all');
        const deselectAllBtn = form.querySelector('.deselect-all');
        
        if (selectAllBtn) {
            addEvent(selectAllBtn, 'click', () => {
                const checkboxes = form.querySelectorAll('input[name="selectedProducts"]');
                checkboxes.forEach(cb => cb.checked = true);
            });
        }
        
        if (deselectAllBtn) {
            addEvent(deselectAllBtn, 'click', () => {
                const checkboxes = form.querySelectorAll('input[name="selectedProducts"]');
                checkboxes.forEach(cb => cb.checked = false);
            });
        }
        
        // Add form submit handler
        addEvent(form, 'submit', this.handleBulkStockUpdate.bind(this));
        
        return form;
    }
    
    // Create checkboxes for each product to select for bulk update
    createProductCheckboxes() {
        if (!this.products.length) {
            return '<p>No products available.</p>';
        }
        
        return this.products.map(product => `
            <div class="product-checkbox">
                <input type="checkbox" name="selectedProducts" value="${product.id}" id="product-${product.id}">
                <label for="product-${product.id}">
                    ${this.escapeHtml(product.name)}
                    ${this.createStockIndicator(product)}
                </label>
            </div>
        `).join('');
    }
    
    // Helper to escape HTML
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
} 