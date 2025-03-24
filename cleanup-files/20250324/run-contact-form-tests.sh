#!/bin/bash

# Run Contact Form Tests
# This script sets up the environment and runs the contact form tests

echo "========================================"
echo "🧪 Contact Form Test Runner"
echo "========================================"

# Make script executable
chmod +x $(dirname "$0")/test-supabase-functions.js

# Step 1: Test Supabase functions
echo "Step 1: Testing Supabase functions..."
node $(dirname "$0")/test-supabase-functions.js

if [ $? -ne 0 ]; then
  echo "❌ Supabase function tests failed. Please fix the issues before running the tests."
  exit 1
fi

echo "✅ Supabase function tests passed."

# Step 2: Ensure the server is running for tests
echo "Step 2: Starting the test server..."
# Check if server is already running
if lsof -i:8080 > /dev/null; then
  echo "Server is already running on port 8080."
else
  echo "Starting server in the background..."
  NODE_ENV=test node server/app.js &
  SERVER_PID=$!
  echo "Server started with PID $SERVER_PID"

  # Wait for server to start
  echo "Waiting for server to start..."
  sleep 3
fi

# Step 3: Run the contact form tests
echo "Step 3: Running contact form tests..."
npm test -- tests/integration/contact-form.test.js

TEST_EXIT_CODE=$?

# Cleanup: Kill the server if we started it
if [ -n "$SERVER_PID" ]; then
  echo "Stopping server (PID $SERVER_PID)..."
  kill $SERVER_PID
fi

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "========================================"
  echo "✅ Contact form tests passed!"
  echo "========================================"
else
  echo "========================================"
  echo "❌ Contact form tests failed."
  echo "========================================"
fi

exit $TEST_EXIT_CODE
