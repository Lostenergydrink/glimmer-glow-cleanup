#!/bin/bash

# Check if .env.test exists
if [ ! -f .env.test ]; then
  echo "Creating .env.test from template..."
  cp .env.test.example .env.test
  echo "Please update .env.test with your test environment values"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Install Playwright browsers if needed
if [ ! -d "~/.cache/ms-playwright" ]; then
  echo "Installing Playwright browsers..."
  npx playwright install
fi

# Load environment variables
source .env.test

# Run database migrations
echo "Running database migrations..."
MIGRATION_SQL=$(cat server/db/migrations/contact_submissions.sql)
# Escape the SQL properly for JSON
ESCAPED_SQL=$(echo "$MIGRATION_SQL" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

curl -X POST "${TEST_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${TEST_SUPABASE_KEY}" \
  -H "Authorization: Bearer ${TEST_SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\":\"${ESCAPED_SQL}\"}"

# Wait a moment for the database changes to take effect
sleep 2

# Run the tests
echo "Running contact form tests..."
NODE_ENV=test npx playwright test tests/integration/contact-form.test.js

# Check test results
if [ $? -eq 0 ]; then
  echo "Tests completed successfully!"
else
  echo "Tests failed. Please check the output above for details."
  exit 1
fi
