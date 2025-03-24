/**
 * @file api.js
 * @description Frontend utility for making API calls to the backend
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get authentication headers with JWT token if available
 * @returns {Object} Headers object
 */
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API response
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response data
 */
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    // Extract error message from response
    const errorMessage = data.error || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return data;
};

/**
 * Fetch all products
 * @returns {Promise<Array>} Array of products
 */
export const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await handleResponse(response);
    return data.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Fetch a product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product data
 */
export const getProduct = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await handleResponse(response);
    return data.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};

/**
 * Create a new product (admin only)
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData) => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });

    const data = await handleResponse(response);
    return data.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update a product (admin only)
 * @param {string} productId - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (productId, productData) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });

    const data = await handleResponse(response);
    return data.data;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
};

/**
 * Delete a product (admin only)
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteProduct = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    await handleResponse(response);
    return true;
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
    throw error;
  }
};

/**
 * Login user and get authentication token
 * @param {Object} credentials - User credentials (email, password)
 * @returns {Promise<Object>} User data with token
 */
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await handleResponse(response);

    // Store auth token in localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user
 * @returns {void}
 */
export const logout = () => {
  localStorage.removeItem('authToken');
};

/**
 * Check if user is logged in
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return localStorage.getItem('authToken') !== null;
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User data with token
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await handleResponse(response);

    // Store auth token in localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
