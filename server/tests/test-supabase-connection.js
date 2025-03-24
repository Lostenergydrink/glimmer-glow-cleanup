/**
 * Test Supabase Connection
 * Validates that our Supabase integration works correctly
 */
import dotenv from 'dotenv';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';
import DatabaseService from '../services/database.service.js';
import AuthService from '../services/auth.service.js';

// Load environment variables
dotenv.config();

// Test database connection
async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase database connection...');
  
  try {
    const dbService = new DatabaseService(SUPABASE_URL, SUPABASE_ANON_KEY);
    const result = await dbService.testConnection();
    
    if (result.success) {
      console.log('✅ Successfully connected to Supabase database!');
      return true;
    } else {
      console.error('❌ Failed to connect to Supabase database:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing database connection:', error.message);
    return false;
  }
}

// Test basic CRUD operations
async function testDatabaseOperations() {
  console.log('\n🔍 Testing basic database operations...');
  
  try {
    const dbService = new DatabaseService(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test connection first
    const connectionResult = await dbService.testConnection();
    if (!connectionResult.success) {
      console.error('❌ Cannot test database operations - connection failed');
      return false;
    }
    
    // Create a test product
    console.log('Creating test product...');
    const testProduct = {
      name: 'Test Product',
      description: 'This is a test product created by the test script',
      price: 9.99,
      quantity: 100,
      type: 'test'
    };
    
    const createdProduct = await dbService.createProduct(testProduct);
    console.log('✅ Successfully created test product:', createdProduct.id);
    
    // Get the product
    console.log('Fetching test product...');
    const fetchedProduct = await dbService.getProduct(createdProduct.id);
    console.log('✅ Successfully fetched test product');
    
    // Update the product
    console.log('Updating test product...');
    const updatedProduct = await dbService.updateProduct(createdProduct.id, {
      description: 'This product has been updated',
      price: 19.99
    });
    console.log('✅ Successfully updated test product');
    
    // Delete the product
    console.log('Deleting test product...');
    await dbService.deleteProduct(createdProduct.id);
    console.log('✅ Successfully deleted test product');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing database operations:', error.message);
    return false;
  }
}

// Test authentication operations
async function testAuthOperations() {
  console.log('\n🔍 Testing authentication operations...');
  
  try {
    const authService = new AuthService(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create a test user
    const testEmail = `test.user.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('Creating test user...');
    const signupResult = await authService.signUp(testEmail, testPassword);
    
    if (!signupResult.success) {
      console.error('❌ Failed to create test user:', signupResult.message);
      return false;
    }
    
    console.log('✅ Successfully created test user');
    
    // Sign in as the test user
    console.log('Signing in as test user...');
    const signinResult = await authService.signIn(testEmail, testPassword);
    
    if (!signinResult.success) {
      console.error('❌ Failed to sign in as test user:', signinResult.message);
      return false;
    }
    
    console.log('✅ Successfully signed in as test user');
    console.log('✅ JWT token generated successfully');
    
    // Verify the token
    console.log('Verifying JWT token...');
    const verifyResult = await authService.verifyToken(signinResult.token);
    
    if (!verifyResult.success) {
      console.error('❌ Failed to verify token:', verifyResult.message);
      return false;
    }
    
    console.log('✅ Successfully verified JWT token');
    
    // Sign out
    console.log('Signing out...');
    const signoutResult = await authService.signOut();
    
    if (!signoutResult.success) {
      console.error('❌ Failed to sign out:', signoutResult.message);
      return false;
    }
    
    console.log('✅ Successfully signed out');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing auth operations:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('===============================================');
  console.log('🧪 STARTING SUPABASE INTEGRATION TESTS');
  console.log('===============================================\n');
  
  // Test database connection
  const dbConnectionSuccess = await testDatabaseConnection();
  
  // Test database operations if connection was successful
  let dbOperationsSuccess = false;
  if (dbConnectionSuccess) {
    dbOperationsSuccess = await testDatabaseOperations();
  }
  
  // Test authentication operations
  const authOperationsSuccess = await testAuthOperations();
  
  // Print summary
  console.log('\n===============================================');
  console.log('🧪 TEST RESULTS SUMMARY');
  console.log('===============================================');
  console.log(`Database Connection: ${dbConnectionSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Operations: ${dbOperationsSuccess ? '✅ PASS' : (dbConnectionSuccess ? '❌ FAIL' : '⚠️ SKIPPED')}`);
  console.log(`Auth Operations: ${authOperationsSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  // Overall status
  const allPassed = dbConnectionSuccess && dbOperationsSuccess && authOperationsSuccess;
  console.log('\nOverall Test Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('===============================================');
}

// Execute tests
runAllTests().catch(error => {
  console.error('Unhandled error during tests:', error);
}); 