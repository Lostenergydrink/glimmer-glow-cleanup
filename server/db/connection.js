/**
 * @file connection.js
 * @description Database connection management
 *
 * This module handles database connection initialization and provides access
 * to the database provider.
 */

const { DatabaseProviderFactory, PROVIDER_TYPES } = require('./provider-factory');
require('dotenv').config();

// Database provider instance (singleton)
let dbProvider = null;

/**
 * Initialize the database connection
 * @returns {Promise<Object>} Database provider
 */
async function initializeDatabase() {
  if (dbProvider) {
    return dbProvider;
  }

  console.log('Initializing database connection...');

  try {
    // Create primary Supabase provider
    const supabaseConfig = {
      type: PROVIDER_TYPES.SUPABASE,
      config: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
      }
    };

    // Create fallback PostgreSQL provider if connection details provided
    let postgresConfig = null;
    if (process.env.DATABASE_URL) {
      postgresConfig = {
        type: PROVIDER_TYPES.POSTGRESQL,
        config: {
          connectionString: process.env.DATABASE_URL
        }
      };
    }

    // Create a hybrid provider with fallback
    dbProvider = DatabaseProviderFactory.createHybridProvider(supabaseConfig, postgresConfig);

    // Test the connection
    const connected = await dbProvider.testConnection();

    if (!connected) {
      throw new Error('Database connection test failed');
    }

    console.log('Database connection initialized successfully');
    return dbProvider;
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw error;
  }
}

/**
 * Get the database provider instance
 * @returns {Object} Database provider
 */
function getProvider() {
  if (!dbProvider) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbProvider;
}

/**
 * Close database connections
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (dbProvider && typeof dbProvider.close === 'function') {
    await dbProvider.close();
    dbProvider = null;
    console.log('Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getProvider,
  closeDatabase
};
