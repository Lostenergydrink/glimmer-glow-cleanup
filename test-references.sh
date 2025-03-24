#!/bin/bash

# Test script to verify file references have been updated correctly
cd /home/lost/Documents/glimmerglow/repo_cleanup

echo "=== Testing HTML References ==="
echo "Checking CSS references in HTML files..."
grep -r "href=\"../styles" pages/

echo "Checking JavaScript references in HTML files..."
grep -r "src=\"../scripts" pages/

echo "=== Testing Server Routes ==="
echo "Checking server.js routes..."
grep -n "sendFile" server/server.js

echo "=== Testing JavaScript Imports ==="
echo "Checking server.js imports..."
grep -n "import.*from" server/server.js | grep -v "^import "

echo "=== All tests completed ==="
echo "Please review the output above to ensure all references are correctly updated." 