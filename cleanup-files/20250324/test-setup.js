import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import env from '../../config/env.js';

// Initialize Supabase client for tests
const supabase = createClient(
  env.TEST_SUPABASE_URL,
  env.TEST_SUPABASE_KEY
);

// Create test email transport
const testMailer = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: env.TEST_EMAIL_USER,
    pass: env.TEST_EMAIL_PASS
  }
});

// Store last sent email for verification
let lastSentEmail = null;

// Mock email sending for tests
testMailer.on('sendMail', (email) => {
  lastSentEmail = email;
});

/**
 * Sets up the database for testing contact form submissions
 *
 * This function checks if the contact_submissions table exists and
 * cleans any existing test data to ensure a fresh start for each test.
 */
async function setupDatabase() {
  try {
    console.log('Setting up database for testing...');

    // Check if table exists
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        console.error('❌ The contact_submissions table does not exist.');
        console.error('Please run: node scripts/execute-sql-in-supabase.js setup-contact-submissions-table.sql');
        throw new Error('Contact submissions table does not exist. Please create it first.');
      } else {
        console.error('❌ Database error:', error.message);
        throw error;
      }
    }

    console.log('✅ Contact submissions table exists.');

    // Clear existing test data
    await cleanupDatabase();

    console.log('✅ Database setup complete.');

    // Reset rate limiting
    if (global.rateLimitStore) {
      global.rateLimitStore.resetAll();
    }
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
}

/**
 * Cleans up the database after testing
 *
 * This function removes any test data created during tests
 * to ensure the database stays clean.
 */
async function cleanupDatabase() {
  try {
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('interest', 'Testing');

    if (deleteError && deleteError.code !== '42P01') {
      console.error('Cleanup error:', deleteError);
      throw deleteError;
    }

    // Reset email tracking
    lastSentEmail = null;

    console.log('✅ Test data cleaned up successfully.');
  } catch (error) {
    console.error('Database cleanup error:', error);
    throw error;
  }
}

/**
 * Gets the last email sent during testing
 *
 * @returns {Object} The last email sent
 */
async function getLastSentEmail() {
  return lastSentEmail;
}

/**
 * Gets the last submission added to the database
 *
 * @returns {Object} The most recent contact form submission
 */
async function getLastSubmission() {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting last submission:', error);
    throw error;
  }
}

export {
  setupDatabase,
  cleanupDatabase,
  getLastSentEmail,
  getLastSubmission,
  testMailer
};
