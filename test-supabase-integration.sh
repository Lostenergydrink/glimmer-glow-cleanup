#!/bin/bash

# Test Supabase Integration
# This script runs tests to validate the Supabase integration

echo "========================================"
echo "🧪 Supabase Integration Test Runner"
echo "========================================"

# Check if dependencies are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run this test."
    exit 1
fi

# Ensure required packages are installed
if [ ! -d "node_modules/@supabase" ]; then
    echo "📦 Installing required dependencies..."
    npm install @supabase/supabase-js jsonwebtoken dotenv
fi

# Check for config file
if [ ! -f "config.js" ]; then
    echo "❌ config.js file is missing. Please create it with your Supabase credentials."
    exit 1
fi

# Check if the test file exists
TEST_FILE="repo_cleanup/server/tests/test-supabase-connection.js"
if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Test file not found: $TEST_FILE"
    exit 1
fi

echo "📋 Running Supabase integration tests..."
echo ""

# Run the test with Node.js
node --experimental-modules "$TEST_FILE"

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test script executed successfully."
    echo "   Check the output above for the test results."
else
    echo ""
    echo "❌ Test execution failed with errors."
    exit 1
fi

echo ""
echo "========================================"
echo "🔍 Next Steps:"
echo "========================================"
echo "1. Review the test results above"
echo "2. If there are any failures, check your Supabase configuration"
echo "3. Ensure that your database tables match the expected schema"
echo "4. Verify that you have the correct permissions set up in Supabase"
echo "5. If you need to modify the tests, edit $TEST_FILE"
echo "========================================"

exit 0 