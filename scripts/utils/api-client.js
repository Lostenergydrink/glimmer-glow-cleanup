import { eventBus, EVENTS } from './utilities.js';

class ApiClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.csrfToken = null;
        this.pendingRequests = new Map();
    }

    async fetchWithRetry(url, options = {}, retries = 3) {
        const requestKey = `${options.method || 'GET'}-${url}-${Date.now()}`;
        
        try {
            // Cancel any pending duplicate requests
            if (this.pendingRequests.has(requestKey)) {
                const controller = this.pendingRequests.get(requestKey);
                controller.abort();
            }

            // Setup new request
            const controller = new AbortController();
            this.pendingRequests.set(requestKey, controller);
            options.signal = controller.signal;

            // Ensure credentials and headers
            options.credentials = 'same-origin';
            options.headers = {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest'
            };

            // Add CSRF token if available
            if (this.csrfToken) {
                options.headers['CSRF-Token'] = this.csrfToken;
            }

            const response = await fetch(this.baseURL + url, options);
            
            // Handle 401 unauthorized
            if (response.status === 401) {
                eventBus.emit(EVENTS.AUTH_CHANGED, { authenticated: false });
                window.location.href = '/admin/login';
                return null;
            }

            // Update CSRF token if present
            const newToken = response.headers.get('CSRF-Token');
            if (newToken) {
                this.csrfToken = newToken;
            }

            // Handle 304 Not Modified
            if (response.status === 304) {
                return { notModified: true };
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request aborted:', requestKey);
                return null;
            }

            if (retries > 0 && !options.signal?.aborted) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.fetchWithRetry(url, options, retries - 1);
            }

            eventBus.emit(EVENTS.ERROR_OCCURRED, {
                context: url,
                error: error.message
            });
            throw error;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    async getProducts(eTag) {
        const options = {
            headers: eTag ? { 'If-None-Match': eTag } : {}
        };
        return this.fetchWithRetry('/api/admin/products', options);
    }

    async createProduct(formData) {
        await this.ensureCsrfToken();
        return this.fetchWithRetry('/api/admin/products', {
            method: 'POST',
            body: formData
        });
    }

    async updateProduct(id, formData) {
        await this.ensureCsrfToken();
        return this.fetchWithRetry(`/api/admin/products/${id}`, {
            method: 'PUT',
            body: formData
        });
    }

    async deleteProduct(id) {
        await this.ensureCsrfToken();
        return this.fetchWithRetry(`/api/admin/products/${id}`, {
            method: 'DELETE'
        });
    }

    async ensureCsrfToken() {
        if (!this.csrfToken) {
            const response = await this.fetchWithRetry('/api/csrf-token');
            if (response?.csrfToken) {
                this.csrfToken = response.csrfToken;
            }
        }
        return this.csrfToken;
    }

    async checkAuth() {
        const result = await this.fetchWithRetry('/api/admin/auth-check');
        eventBus.emit(EVENTS.AUTH_CHANGED, { 
            authenticated: result?.authenticated ?? false 
        });
        return result?.authenticated ?? false;
    }

    // Error handling
    handleError(error, context) {
        console.error(`API Error (${context}):`, error);
        eventBus.emit(EVENTS.ERROR_OCCURRED, {
            context,
            error: error.message
        });
        throw error;
    }
}

export const apiClient = new ApiClient();
