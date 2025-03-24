/**
 * Test Supabase Functions
 *
 * This script tests the Supabase functions used in the contact form tests.
 * It verifies that the contact_submissions table exists or creates it directly.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Initialize Supabase client for tests
const supabase = createClient(
  process.env.TEST_SUPABASE_URL,
  process.env.TEST_SUPABASE_KEY
);

async function testFunctions() {
  console.log('='.repeat(50));
  console.log('🧪 Testing Supabase Functions for Contact Form');
  console.log('='.repeat(50));
  console.log();

  let tableExists = false;
  let createTableError = null;
  let insertError = null;
  let deleteError = null;

  try {
    // Test 1: Check if the table exists
    console.log('Test 1: Checking if contact_submissions table exists...');

    // First, let's try to directly query if the table exists
    const { data: tableInfo, error: tableCheckError } = await supabase
      .from('contact_submissions')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log('Table does not exist, will need to create it');
      tableExists = false;
    } else if (tableCheckError) {
      console.error('Error checking if table exists:', tableCheckError.message);
    } else {
      console.log('✅ Table exists, verified via direct query');
      tableExists = true;
    }

    // Try alternative method using system tables if first check failed
    if (!tableExists && tableCheckError) {
      console.log('Trying alternative method to check if table exists...');

      // Query PostgreSQL information_schema directly
      const { data, error } = await supabase
        .from('information_schema')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', 'contact_submissions')
        .maybeSingle();

      if (error) {
        console.error('❌ Error using information_schema:', error.message);
      } else if (data) {
        console.log('✅ Table exists according to information_schema');
        tableExists = true;
      }
    }

    // Test 2: Create the table if it doesn't exist
    if (!tableExists) {
      console.log('\nTest 2: Creating contact_submissions table...');

      // Using REST API to create the table directly isn't possible
      // We should create the table in the Supabase dashboard or with SQL migrations
      console.log('⚠️ Cannot create table directly through API. Please create the table manually:');
      console.log(`
      CREATE TABLE IF NOT EXISTS public.contact_submissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        interest TEXT NOT NULL,
        message TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        is_archived BOOLEAN DEFAULT FALSE,
        admin_notes TEXT
      );

      -- Create trigger for updated_at
      CREATE OR REPLACE FUNCTION public.set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = timezone('utc'::text, now());
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_updated_at ON public.contact_submissions;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.contact_submissions
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
      `);

      console.log('\nTesting if we can create and populate table by inserting data...');

      // Attempt to create table by inserting data (might work if RLS is set appropriately)
      const testData = {
        name: 'Test User',
        interest: 'Testing',
        message: 'This is a test message for Supabase functions',
        email: 'test@example.com'
      };

      const { data: insertData, error: firstInsertError } = await supabase
        .from('contact_submissions')
        .insert([testData])
        .select();

      if (firstInsertError && firstInsertError.code === '42P01') {
        console.error('❌ Table does not exist and could not be auto-created');
        createTableError = firstInsertError;
      } else if (firstInsertError) {
        console.error('❌ Error inserting test data:', firstInsertError.message);
        createTableError = firstInsertError;
      } else {
        console.log('✅ Successfully created table via first insert');
        tableExists = true;

        // Clean up the test data from initial insert
        await supabase
          .from('contact_submissions')
          .delete()
          .eq('interest', 'Testing');
      }
    } else {
      console.log('\nTest 2: Skipping table creation as table already exists.');
    }

    // Test 3: Check if we can insert and delete test data
    if (tableExists) {
      console.log('\nTest 3: Testing insertion and deletion of test data...');
      const testData = {
        name: 'Test User',
        interest: 'Testing',
        message: 'This is a test message for Supabase functions',
        email: 'test@example.com'
      };

      // Insert test data
      const { data: insertData, error: insertErr } = await supabase
        .from('contact_submissions')
        .insert([testData])
        .select();

      insertError = insertErr;

      if (insertError) {
        console.error('❌ Error inserting test data:', insertError.message);
      } else {
        console.log('✅ Successfully inserted test data');

        // Delete test data
        const { error: deleteErr } = await supabase
          .from('contact_submissions')
          .delete()
          .eq('interest', 'Testing');

        deleteError = deleteErr;

        if (deleteError) {
          console.error('❌ Error deleting test data:', deleteError.message);
        } else {
          console.log('✅ Successfully deleted test data');
        }
      }
    } else {
      console.log('\nTest 3: Skipping data tests as table does not exist.');
    }

    console.log('\n='.repeat(50));
    console.log('🧪 Test Summary');
    console.log('='.repeat(50));

    if (tableExists) {
      console.log('✅ Test 1: Table exists or successfully verified');
    } else {
      console.log('❌ Test 1: Could not verify if table exists');
    }

    if (tableExists && !createTableError) {
      console.log('✅ Test 2: Table creation successful or table already exists');
    } else {
      console.log('❌ Test 2: Issues with table creation');
    }

    if (tableExists && !insertError && !deleteError) {
      console.log('✅ Test 3: Data insertion and deletion working correctly');
    } else if (!tableExists) {
      console.log('⚠️ Test 3: Skipped as table does not exist');
    } else {
      console.log('❌ Test 3: Issues with data insertion or deletion');
    }

    console.log('\n='.repeat(50));
    console.log('Next Steps:');
    console.log('='.repeat(50));

    if (!tableExists) {
      console.log(`
1. Create the contact_submissions table using the Supabase dashboard or SQL:
   - Log into Supabase Studio
   - Go to SQL Editor
   - Run the SQL script shown above

2. Update test setup to check for table existence properly

3. Re-run this test script to verify the table is working
      `);
    } else if (insertError || deleteError) {
      console.log(`
1. Check RLS policies on the contact_submissions table:
   - Make sure anon key has insert permissions
   - Verify table schema matches expected fields

2. Re-run this test script to verify data operations are working
      `);
    } else {
      console.log(`
✅ All tests passed! You can now run the contact form tests.
      `);
    }
  } catch (error) {
    console.error('Unhandled error during test:', error);
  }
}

// Run the tests
testFunctions();
