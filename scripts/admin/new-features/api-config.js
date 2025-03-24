/**
 * api-config.js - API configuration for admin features
 * 
 * This module centralizes all API endpoint definitions to make
 * maintenance and updates easier.
 */

// Base API URL - can be updated for different environments
const API_BASE = '/api';
const ADMIN_API_BASE = `${API_BASE}/admin`;

// API endpoints configuration
export const API_ENDPOINTS = {
    // Admin authentication
    AUTH: {
        CHECK: `${ADMIN_API_BASE}/auth-check`,
        LOGIN: `${API_BASE}/auth/login`,
        LOGOUT: `${API_BASE}/auth/logout`,
        RESET_PASSWORD: `${API_BASE}/auth/reset-password`
    },
    
    // CSRF token
    CSRF: `${API_BASE}/csrf-token`,
    
    // Product management
    PRODUCTS: {
        BASE: `${ADMIN_API_BASE}/products`,
        DETAIL: (id) => `${ADMIN_API_BASE}/products/${id}`,
        BULK_UPLOAD: `${ADMIN_API_BASE}/products/bulk`,
        CATEGORIES: (productId) => `${ADMIN_API_BASE}/products/${productId}/categories`,
        STOCK: (productId) => `${ADMIN_API_BASE}/products/${productId}/stock`
    },
    
    // Category management
    CATEGORIES: {
        BASE: `${ADMIN_API_BASE}/categories`,
        DETAIL: (id) => `${ADMIN_API_BASE}/categories/${id}`,
        PRODUCTS: (categoryId) => `${ADMIN_API_BASE}/categories/${categoryId}/products`
    },
    
    // Gallery management
    GALLERY: {
        BASE: `${ADMIN_API_BASE}/gallery`,
        DETAIL: (id) => `${ADMIN_API_BASE}/gallery/${id}`,
        COLLECTIONS: `${ADMIN_API_BASE}/gallery-collections`
    },
    
    // Calendar/Events management
    EVENTS: {
        BASE: `${ADMIN_API_BASE}/events`,
        DETAIL: (id) => `${ADMIN_API_BASE}/events/${id}`,
        RECURRING: `${ADMIN_API_BASE}/events/recurring`,
        ATTENDEES: (eventId) => `${ADMIN_API_BASE}/events/${eventId}/attendees`
    },
    
    // Subscription management
    SUBSCRIPTIONS: {
        BASE: `${ADMIN_API_BASE}/subscriptions`,
        DETAIL: (id) => `${ADMIN_API_BASE}/subscriptions/${id}`,
        GROUPS: `${ADMIN_API_BASE}/subscription-groups`,
        EXPORT: `${ADMIN_API_BASE}/subscriptions/export`
    },
    
    // Transaction management
    TRANSACTIONS: {
        BASE: `${ADMIN_API_BASE}/transactions`,
        DETAIL: (id) => `${ADMIN_API_BASE}/transactions/${id}`,
        EXPORT: `${ADMIN_API_BASE}/transactions/export`,
        REFUND: (id) => `${ADMIN_API_BASE}/transactions/${id}/refund`
    },
    
    // PayPal settings
    PAYPAL: {
        SETTINGS: `${ADMIN_API_BASE}/paypal-settings`
    },
    
    // Common public endpoints
    PUBLIC: {
        PRODUCTS: `${API_BASE}/products`,
        CATEGORIES: `${API_BASE}/categories`,
        PRODUCTS_BY_CATEGORY: (slug) => `${API_BASE}/categories/${slug}/products`,
        GALLERY: `${API_BASE}/gallery`,
        EVENTS: `${API_BASE}/events`,
        SUBSCRIBE: `${API_BASE}/subscribe`,
        CHECKOUT: `${API_BASE}/checkout`
    }
};

// Export utility functions for API interaction
export const ApiUtils = {
    /**
     * Build query string from parameters object
     * @param {Object} params - Query parameters
     * @returns {string} Formatted query string
     */
    buildQueryString(params) {
        if (!params || Object.keys(params).length === 0) return '';
        
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(v => queryParams.append(`${key}[]`, v));
                } else {
                    queryParams.append(key, value);
                }
            }
        });
        
        return `?${queryParams.toString()}`;
    },
    
    /**
     * Create request headers with CSRF token
     * @param {string} csrfToken - CSRF token
     * @param {Object} additionalHeaders - Additional headers to include
     * @returns {Object} Headers object
     */
    createHeaders(csrfToken, additionalHeaders = {}) {
        return {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            ...additionalHeaders
        };
    }
};

// Export default config
export default API_ENDPOINTS; 