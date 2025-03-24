/**
 * Service Factory
 * Provides centralized access to all services with proper initialization
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';
import DatabaseService from './database.service.js';
import AuthService from './auth.service.js';

// Service instances
let databaseService = null;
let authService = null;

/**
 * Initialize all services
 * @returns {Promise<void>}
 */
export const initializeServices = async () => {
  console.log('Initializing services...');
  
  // Initialize services if they don't exist
  if (!databaseService) {
    databaseService = new DatabaseService(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Database service initialized');
  }
  
  if (!authService) {
    authService = new AuthService(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Auth service initialized');
  }
  
  // Test database connection
  const connectionResult = await databaseService.testConnection();
  if (connectionResult.success) {
    console.log('Database connection successful');
  } else {
    console.warn('Database connection failed:', connectionResult.message);
    console.warn('Application will fall back to local file storage if available');
  }
  
  console.log('All services initialized');
};

/**
 * Get the database service instance
 * @returns {DatabaseService} Database service
 */
export const getDatabase = () => {
  if (!databaseService) {
    databaseService = new DatabaseService(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return databaseService;
};

/**
 * Get the auth service instance
 * @returns {AuthService} Auth service
 */
export const getAuth = () => {
  if (!authService) {
    authService = new AuthService(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return authService;
};

// Export the services interface
export default {
  initialize: initializeServices,
  db: getDatabase,
  auth: getAuth
}; 