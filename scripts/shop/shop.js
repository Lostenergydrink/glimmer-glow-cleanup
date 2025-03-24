/**
 * shop.js - Shop page functionality
 * Handles product loading, filtering, wishlist, and cart integration
 */
import { select, selectAll, addEvent, debounce, showNotification } from '../utils/utilities.js';
import { shopService } from '../../client/services/shop.service.js';
import cart from './cart.js';
import wishlist from './wishlist.js';
import './cart-ui.js'; // Import cart UI to initialize it

// Product data cache
let allProducts = [];
let filteredProducts = [];

// DOM elements
const productsContainer = select('#products-container');
const productTemplate = select('#product-template');
const productSearch = select('#product-search');
const categorySelect = select('#category-select');
const sortSelect = select('#sort-select');
const searchButton = select('#search-button');

/**
 * Initialize the shop page
 */
function init() {
  loadProducts();
  setupEventListeners();
}

/**
 * Load products from API
 */
async function loadProducts() {
  try {
    showLoading(true);
    
    // Fetch products using the shop service
    const products = await shopService.getProducts();
    allProducts = products || [];
    
    // Apply initial filters and render
    filterAndSortProducts();
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading products:', error);
    showNotification('Failed to load products', 'error');
    showLoading(false);
    
    // Load fallback products if API fails
    loadFallbackProducts();
  }
}

/**
 * Load fallback products if API fails
 */
function loadFallbackProducts() {
  // Sample data to use when API is unavailable
  allProducts = [
    {
      id: '1',
      name: 'Basic Paint Party Kit',
      description: 'Everything you need to get started: brushes, paints, and canvas',
      price: 29.99,
      image: '../assets/images/products/paint-kit.jpg',
      category: 'kits'
    },
    {
      id: '2',
      name: 'Premium Art Materials',
      description: 'High-quality acrylic paints and professional brushes',
      price: 49.99,
      image: '../assets/images/products/art-materials.jpg',
      category: 'materials'
    },
    {
      id: '3',
      name: 'Canvas Pack (5-pack)',
      description: 'High-quality canvases perfect for your next paint party',
      price: 24.99,
      image: '../assets/images/products/canvas-pack.jpg',
      category: 'canvases'
    },
    {
      id: '4',
      name: 'Gift Card',
      description: 'Perfect for gifting a paint party experience',
      price: 50.00,
      image: '../assets/images/products/gift-card.jpg',
      category: 'gift-cards'
    },
    {
      id: '5',
      name: 'Basic Monthly Subscription',
      description: 'Monthly delivery of essential paint supplies and exclusive online tutorials',
      price: 19.99,
      image: '../assets/images/products/basic-subscription.jpg',
      category: 'subscriptions',
      isSubscription: true,
      features: [
        'Monthly Paint Supply Box',
        'Basic Online Tutorials',
        'Monthly Virtual Paint Party'
      ]
    },
    {
      id: '6',
      name: 'Premium Monthly Subscription',
      description: 'Deluxe monthly art box with premium materials and exclusive benefits',
      price: 39.99,
      image: '../assets/images/products/premium-subscription.jpg',
      category: 'subscriptions',
      isSubscription: true,
      features: [
        'Premium Art Supply Box',
        'Advanced Technique Videos',
        '2 Monthly Virtual Paint Parties',
        'One-on-One Coaching Session'
      ]
    }
  ];
  
  filterAndSortProducts();
}

/**
 * Filter and sort products based on current selection
 */
function filterAndSortProducts() {
  const searchTerm = productSearch.value.toLowerCase().trim();
  const category = categorySelect.value;
  const sortOption = sortSelect.value;
  
  // Filter products
  filteredProducts = allProducts.filter(product => {
    // Category filter
    if (category !== 'all' && product.category !== category) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });
  
  // Sort products
  filteredProducts.sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      default:
        return 0;
    }
  });
  
  renderProducts();
}

/**
 * Render products in the container
 */
function renderProducts() {
  if (!productsContainer || !productTemplate) return;
  
  // Clear container
  productsContainer.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = '<div class="no-products">No products found matching your criteria</div>';
    return;
  }
  
  // Render each product
  filteredProducts.forEach(product => {
    const productElement = document.importNode(productTemplate.content, true);
    const shopItem = productElement.querySelector('.shop-item');
    
    // Set product data
    shopItem.dataset.id = product.id;
    shopItem.querySelector('.product-name').textContent = product.name;
    shopItem.querySelector('.product-description').textContent = product.description;
    shopItem.querySelector('.shop-item-price').textContent = `$${product.price.toFixed(2)}${product.isSubscription ? '/month' : ''}`;
    
    // Set product image
    const imgElement = shopItem.querySelector('.shop-item-image');
    imgElement.src = product.image || `../assets/images/products/placeholder.jpg`;
    imgElement.alt = product.name;
    
    // Add to cart button text
    const addButton = shopItem.querySelector('.add-to-cart-btn');
    addButton.textContent = product.isSubscription ? 'Subscribe' : 'Add to Cart';
    addButton.dataset.id = product.id;
    
    // Add subscription features if applicable
    if (product.isSubscription && product.features) {
      const descriptionElement = shopItem.querySelector('.product-description');
      
      const featuresElement = document.createElement('ul');
      featuresElement.className = 'subscription-features';
      
      product.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresElement.appendChild(li);
      });
      
      shopItem.insertBefore(featuresElement, descriptionElement.nextSibling);
      shopItem.classList.add('subscription-item');
    }
    
    // Wishlist button
    const wishlistButton = shopItem.querySelector('.wishlist-toggle');
    if (wishlistButton) {
      wishlistButton.dataset.id = product.id;
      
      // Check if product is in wishlist
      if (wishlist.hasItem(product.id)) {
        wishlistButton.classList.add('active');
        wishlistButton.querySelector('i').classList.remove('far');
        wishlistButton.querySelector('i').classList.add('fas');
      }
    }
    
    productsContainer.appendChild(shopItem);
  });
  
  // Add event listeners to newly created elements
  addProductEventListeners();
}

/**
 * Add event listeners to product elements
 */
function addProductEventListeners() {
  // Add to cart buttons
  selectAll('.add-to-cart-btn').forEach(button => {
    addEvent(button, 'click', handleAddToCart);
  });
  
  // Wishlist toggles
  selectAll('.wishlist-toggle').forEach(button => {
    addEvent(button, 'click', handleWishlistToggle);
  });
}

/**
 * Handle add to cart button click
 * @param {Event} event - Click event
 */
function handleAddToCart(event) {
  const button = event.currentTarget;
  const productId = button.dataset.id;
  const product = allProducts.find(p => p.id === productId);
  
  if (product) {
    cart.addItem(product);
  }
}

/**
 * Handle wishlist toggle click
 * @param {Event} event - Click event
 */
function handleWishlistToggle(event) {
  const button = event.currentTarget;
  const productId = button.dataset.id;
  
  const isInWishlist = wishlist.toggleItem(productId);
  
  // Update button UI
  if (isInWishlist) {
    button.classList.add('active');
    button.querySelector('i').classList.remove('far');
    button.querySelector('i').classList.add('fas');
  } else {
    button.classList.remove('active');
    button.querySelector('i').classList.remove('fas');
    button.querySelector('i').classList.add('far');
  }
}

/**
 * Set up event listeners for filters and sorting
 */
function setupEventListeners() {
  // Search input - debounced to reduce excessive filtering
  if (productSearch) {
    addEvent(productSearch, 'input', debounce(() => {
      filterAndSortProducts();
    }, 300));
  }
  
  // Search button
  if (searchButton) {
    addEvent(searchButton, 'click', () => {
      filterAndSortProducts();
    });
  }
  
  // Category filter
  if (categorySelect) {
    addEvent(categorySelect, 'change', () => {
      filterAndSortProducts();
    });
  }
  
  // Sort options
  if (sortSelect) {
    addEvent(sortSelect, 'change', () => {
      filterAndSortProducts();
    });
  }
}

/**
 * Show/hide loading indicator
 * @param {boolean} isLoading - Whether to show loading indicator
 */
function showLoading(isLoading) {
  if (isLoading) {
    // Create loading indicator if it doesn't exist
    if (!select('.loading-products')) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'loading-products';
      loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>Loading products...</p>
      `;
      
      if (productsContainer) {
        productsContainer.innerHTML = '';
        productsContainer.appendChild(loadingElement);
      }
    }
  } else {
    // Remove loading indicator
    const loadingElement = select('.loading-products');
    if (loadingElement) {
      loadingElement.remove();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 