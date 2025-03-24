# GlimmerGlow Shop System

This document provides an overview and usage instructions for the GlimmerGlow e-commerce shop system. The shop system is designed to provide a complete shopping experience, from product browsing to checkout, with support for both authenticated and anonymous users.

## Features

- **Product Management**: Browse, search, and filter products
- **Shopping Cart**: Add, remove, and update items in the cart
- **Wishlist**: Save products for later purchase
- **User Authentication**: Seamless shopping experience for both authenticated and anonymous users
- **Checkout Process**: Multi-step checkout with shipping and payment options
- **Order Management**: Track and view order history
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Components

### Client-Side Components

- **shop.service.js**: Central service for all shop-related operations
- **cart.js**: Shopping cart management module
- **cart-ui.js**: UI components for the shopping cart
- **wishlist.js**: Wishlist management module
- **checkout.js**: Checkout process management
- **api.service.js**: API communication service
- **auth.service.js**: Authentication service

### Server-Side Components

- **shop.routes.js**: API endpoints for shop operations
- **shop.schemas.js**: Validation schemas for API requests
- **shop-models.js**: Data models for shop entities
- **database.service.js**: Database access layer

## Usage Guide

### Product Browsing

```javascript
// Import the shop service
import { shopService } from './services/shop.service.js';

// Get all products
const products = await shopService.getProducts();

// Get products by category
const categoryProducts = await shopService.getProductsByCategory('skincare');

// Get product details
const product = await shopService.getProductById('product-id');
```

### Shopping Cart

```javascript
// Import the cart module
import { cart } from './modules/cart.js';

// Add item to cart
cart.addItem({
  id: 'product-id',
  name: 'Product Name',
  price: 19.99,
  quantity: 1,
  image: 'product-image.jpg'
});

// Update item quantity
cart.updateItemQuantity('product-id', 2);

// Remove item from cart
cart.removeItem('product-id');

// Get cart items
const items = cart.getItems();

// Get cart total
const total = cart.getTotal();

// Clear cart
cart.clear();
```

### Wishlist

```javascript
// Import the wishlist module
import { wishlist } from './modules/wishlist.js';

// Add item to wishlist
wishlist.addItem({
  id: 'product-id',
  name: 'Product Name',
  price: 19.99,
  image: 'product-image.jpg'
});

// Remove item from wishlist
wishlist.removeItem('product-id');

// Toggle item in wishlist
wishlist.toggleItem('product-id');

// Check if item is in wishlist
const isInWishlist = wishlist.hasItem('product-id');

// Get wishlist items
const items = wishlist.getItems();

// Move item to cart
wishlist.moveToCart('product-id');
```

### Checkout Process

The checkout process is a multi-step form that collects shipping information, payment details, and creates an order.

```javascript
// Import the shop service
import { shopService } from './services/shop.service.js';

// Create an order
const order = {
  items: cart.getItems(),
  shipping: {
    name: 'John Doe',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    country: 'USA'
  },
  payment: {
    method: 'credit-card',
    cardNumber: '**** **** **** 1234',
    expiryDate: '12/25',
    cvv: '***'
  },
  totalAmount: cart.getTotal() + 5.99, // Including shipping
  shippingMethod: 'standard'
};

// Submit order
const orderId = await shopService.createOrder(order);

// Get order details
const orderDetails = await shopService.getOrderById(orderId);
```

## API Endpoints

### Products

- `GET /api/products`: Get all products
- `GET /api/products/:id`: Get product by ID
- `GET /api/categories`: Get all categories
- `GET /api/categories/:id/products`: Get products by category

### Cart

- `GET /api/cart`: Get user's cart
- `POST /api/cart`: Save cart
- `DELETE /api/cart`: Clear cart
- `POST /api/cart/items`: Add item to cart
- `PUT /api/cart/items/:id`: Update cart item
- `DELETE /api/cart/items/:id`: Remove item from cart

### Wishlist

- `GET /api/wishlist`: Get user's wishlist
- `POST /api/wishlist`: Save wishlist
- `POST /api/wishlist/items`: Add item to wishlist
- `DELETE /api/wishlist/items/:id`: Remove item from wishlist

### Orders

- `GET /api/orders`: Get user's orders
- `GET /api/orders/:id`: Get order by ID
- `POST /api/orders`: Create new order

### Checkout

- `POST /api/checkout`: Process checkout

## Development Guidelines

### Adding a New Product

1. Create the product data in the Supabase database
2. Ensure the product has all required fields:
   - `id`: Unique product identifier
   - `name`: Product name
   - `price`: Product price
   - `description`: Product description
   - `image`: URL to product image
   - `category`: Product category
   - `stock`: Available inventory
   - `ingredients`: Product ingredients (optional)
   - `how_to_use`: Usage instructions (optional)
   - `benefits`: Product benefits (optional)

### Adding a New Feature

1. Update the shop service with the new functionality
2. Add corresponding API endpoints
3. Update client-side components as needed
4. Add tests for the new functionality
5. Update documentation

### Running Tests

```bash
# Run all shop tests
npm test -- --testPathPattern=tests/shop

# Run specific test file
npm test -- tests/shop/shop.service.test.js
```

## Troubleshooting

### Common Issues

- **Cart not updating**: Check if localStorage is available and not full
- **Authentication issues**: Verify that the user token is valid
- **Product images not loading**: Check for CORS issues or incorrect image paths
- **Checkout errors**: Verify that all required fields are filled correctly

### Debugging

For detailed debugging, check the browser console for error messages. Server-side logs can be found in the server logs directory.

## Future Enhancements

- Product reviews and ratings
- Real-time inventory tracking
- Product recommendations
- Enhanced search functionality
- Subscription products
- Gift options and gift cards

## Architecture Documentation

For detailed information about the shop system architecture, including component relationships, design decisions, and implementation guidelines, refer to the [Shop System Architecture Document](docs/architecture/2024-06-12-Shop-System-architecture-plan.md).

## Testing Strategy

The shop system includes comprehensive tests for all major components:

- Unit tests for shop service, cart, and wishlist modules
- Integration tests for checkout process
- End-to-end tests for complete shopping flow

Refer to the test files in the `tests/shop` directory for examples and best practices. 