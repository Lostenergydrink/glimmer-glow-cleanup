/**
 * Execute SQL script in Supabase
 *
 * This script reads SQL from a file and executes it against the Supabase PostgreSQL database
 * directly using the pg client library, bypassing the Supabase API restrictions.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node execute-sql-in-supabase.js <sql-file>');
  process.exit(1);
}

const sqlFile = args[0];
const sqlPath = path.resolve(__dirname, sqlFile);

async function executeSql() {
  console.log('='.repeat(50));
  console.log(`🧪 Executing SQL script: ${sqlFile}`);
  console.log('='.repeat(50));
  console.log();

  try {
    // Read SQL from file
    console.log(`Reading SQL file: ${sqlPath}`);
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('SQL file loaded successfully.');

    // Parse connection string from environment
    // Local Supabase PostgreSQL connection details
    const pool = new Pool({
      host: '127.0.0.1',
      port: 54322,      // Default Supabase PostgreSQL port
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    });

    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();

    try {
      console.log('Connected to PostgreSQL. Executing SQL...');
      await client.query(sql);
      console.log('✅ SQL executed successfully!');
    } finally {
      client.release();
      await pool.end();
    }

    // Test Supabase API access to the table
    console.log('\nTesting Supabase API access to the table...');

    const supabase = createClient(
      process.env.TEST_SUPABASE_URL,
      process.env.TEST_SUPABASE_KEY
    );

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing table via Supabase API:', error.message);
    } else {
      console.log('✅ Successfully accessed table via Supabase API');
      console.log(`Found ${data.length} records`);
    }

    // Test insertion and deletion
    const testData = {
      name: 'SQL Test User',
      interest: 'SQL Testing',
      message: 'This is a test message from the SQL execution script',
      email: 'sqltest@example.com'
    };

    console.log('\nTesting insertion via Supabase API...');
    const { data: insertData, error: insertError } = await supabase
      .from('contact_submissions')
      .insert([testData])
      .select();

    if (insertError) {
      console.error('❌ Error inserting test data:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test data');

      // Delete test data
      console.log('Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('interest', 'SQL Testing');

      if (deleteError) {
        console.error('❌ Error deleting test data:', deleteError.message);
      } else {
        console.log('✅ Successfully deleted test data');
      }
    }

    console.log('\n='.repeat(50));
    console.log('Setup complete!');
    console.log('You can now run the tests for the contact form.');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
}

executeSql();
