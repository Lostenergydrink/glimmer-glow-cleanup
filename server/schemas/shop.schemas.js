/**
 * Shop Validation Schemas
 * 
 * Defines validation schemas for shop-related API routes
 * using Joi validation library
 */

const Joi = require('joi');

// Product schemas
const productSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).required(),
  price: Joi.number().precision(2).positive().required(),
  category_id: Joi.string().required(),
  image_url: Joi.string().uri().allow(''),
  stock: Joi.number().integer().min(0).required(),
  is_featured: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true)
});

// Category schemas
const categorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500).allow(''),
  image_url: Joi.string().uri().allow('')
});

// Cart schemas
const cartItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().positive().default(1)
});

const cartItemUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required()
});

const cartSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().required(),
    quantity: Joi.number().integer().positive().required(),
    image: Joi.string().allow(null, '')
  }))
});

// Wishlist schemas
const wishlistItemSchema = Joi.object({
  productId: Joi.string().required()
});

const wishlistSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().required(),
    image: Joi.string().allow(null, '')
  }))
});

// Order schemas
const addressSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  address1: Joi.string().min(5).max(100).required(),
  address2: Joi.string().max(100).allow(''),
  city: Joi.string().min(2).max(50).required(),
  state: Joi.string().min(2).max(50).required(),
  zipCode: Joi.string().min(3).max(20).required(),
  country: Joi.string().min(2).max(50).required(),
  phone: Joi.string().min(5).max(20).allow('')
});

const orderSchema = Joi.object({
  shippingAddress: addressSchema.required(),
  paymentMethod: Joi.string().valid('credit_card', 'paypal', 'stripe').required(),
  paymentId: Joi.string().allow('')
});

// Checkout schemas
const checkoutSchema = Joi.object({
  shippingAddress: addressSchema.required(),
  paymentMethod: Joi.string().valid('credit_card', 'paypal', 'stripe').required(),
  cardDetails: Joi.when('paymentMethod', {
    is: 'credit_card',
    then: Joi.object({
      cardNumber: Joi.string().pattern(/^\d{16}$/).required(),
      expiryMonth: Joi.string().pattern(/^\d{2}$/).required(),
      expiryYear: Joi.string().pattern(/^\d{4}$/).required(),
      cvv: Joi.string().pattern(/^\d{3,4}$/).required(),
      nameOnCard: Joi.string().min(2).max(100).required()
    }),
    otherwise: Joi.optional()
  })
});

// Export all schemas
const schemas = {
  productSchema,
  categorySchema,
  cartItemSchema,
  cartItemUpdateSchema,
  cartSchema,
  wishlistItemSchema,
  wishlistSchema,
  addressSchema,
  orderSchema,
  checkoutSchema
};

module.exports = { schemas }; 