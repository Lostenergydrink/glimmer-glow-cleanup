/**
 * category-manager.js - Category management functionality for admin panel
 */
import { 
    select, 
    selectAll, 
    addEvent, 
    removeEvent,
    errorHandler 
} from '../../utils/utilities.js';

export class CategoryManager {
    constructor(apiEndpoint, csrfToken, showMessage) {
        this.apiEndpoint = apiEndpoint;
        this.csrfToken = csrfToken;
        this.showMessage = showMessage;
        this.categories = [];
        this.currentCategory = null;
        
        // DOM elements
        this.elements = {
            categoryForm: select('#categoryForm'),
            categoryList: select('#categoryList'),
            productCategories: select('#productCategories'),
            bulkCategory: select('#bulkCategory')
        };
        
        this.initialize();
    }
    
    initialize() {
        // Set up event listeners
        if (this.elements.categoryForm) {
            addEvent(this.elements.categoryForm, 'submit', this.handleSubmit.bind(this));
        }
        
        if (this.elements.categoryList) {
            addEvent(this.elements.categoryList, 'click', this.handleActions.bind(this));
        }
    }
    
    setCsrfToken(token) {
        this.csrfToken = token;
    }
    
    async loadCategories() {
        try {
            console.log('Loading categories...');
            const response = await fetch(this.apiEndpoint, {
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
            this.populateDropdowns(categories);
            
            // Render categories list in the Categories tab
            this.renderCategories(categories);
            
            return categories;
            
        } catch (error) {
            errorHandler(error, 'Load categories');
            this.showMessage('Failed to load categories. Please try again.', 'error');
            return [];
        }
    }
    
    populateDropdowns(categories) {
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
                    <h3>${this.escapeHtml(category.name)}</h3>
                    <p class="category-slug">Slug: ${this.escapeHtml(category.slug)}</p>
                    <p>${this.escapeHtml(category.description || '')}</p>
                </div>
                <div class="category-actions">
                    <button class="edit-category" data-id="${category.id}">Edit</button>
                    <button class="delete-category" data-id="${category.id}">Delete</button>
                </div>
            </div>
        `).join('');
        
        categoryList.innerHTML = categoriesHtml;
    }
    
    async handleSubmit(event) {
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
            
            let url = this.apiEndpoint;
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
    
    handleActions(event) {
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
            const response = await fetch(`${this.apiEndpoint}/${categoryId}`, {
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
    
    resetForm(form) {
        if (!form) return;
        
        form.reset();
        
        this.currentCategory = null;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Add Category';
        }
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // Helper to get category names from IDs
    getCategoryNames(categoryIds) {
        if (!categoryIds || !Array.isArray(categoryIds)) return '';
        
        return categoryIds
            .map(id => {
                const category = this.categories.find(c => c.id === id);
                return category ? category.name : 'Unknown';
            })
            .join(', ');
    }
} 