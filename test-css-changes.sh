#!/bin/bash

# test-css-changes.sh - Script to test CSS changes on the website
# Created for GlimmerGlow Website Reorganization - Phase 3

echo "=== CSS Changes Testing Tool ==="
echo "This script helps test the website after CSS duplication removal."
echo

# Start the server in the background
echo "Starting the server..."
cd .. && node server.js &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo

# Wait for server to fully start
sleep 3

echo "Please manually test the following pages in your browser:"
echo
echo "1. Homepage: http://localhost:3001/"
echo "   - Check gradient text styling"
echo "   - Verify flexbox layouts"
echo "   - Test modals if present"
echo
echo "2. Shop Page: http://localhost:3001/shop"
echo "   - Check product grid layout"
echo "   - Verify cart modal functionality"
echo "   - Test gradient text headers"
echo
echo "3. Contact Page: http://localhost:3001/contact"
echo "   - Check form layout and styling"
echo "   - Verify any modal dialogs"
echo "   - Test responsive behavior"
echo
echo "4. Gallery Page: http://localhost:3001/gallery"
echo "   - Verify image grid layout"
echo "   - Test modal image viewer"
echo "   - Check gradient text headers"
echo
echo "5. Other Pages:"
echo "   - Events: http://localhost:3001/events"
echo "   - Blog: http://localhost:3001/blog"
echo "   - Login: http://localhost:3001/login"
echo "   - About: http://localhost:3001/about"
echo
echo "When finished testing, press Enter to stop the server..."

read

# Kill the server
echo "Stopping server..."
kill $SERVER_PID

echo
echo "=== Testing Complete ==="
echo "Please document any issues found in 2025-03-21-CSS-TESTING-RESULTS.md" 