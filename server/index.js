/**
 * @file index.js
 * @description Main server file for the Glimmer Glow backend
 *
 * This file initializes the Express server, connects to the database,
 * and sets up API routes.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { initializeDatabase } = require('./db/connection');
require('dotenv').config();

// Import route modules
const productsRoutes = require('./routes/products-routes');
// TODO: Import additional route modules as they are created

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database before setting up routes
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Set up API routes
    app.use('/api/products', productsRoutes);
    // TODO: Set up additional API routes

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();
