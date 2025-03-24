#!/bin/bash

# Script to test all pages with their updated references
# This will start the server and provide commands to check each page

cd /home/lost/Documents/glimmerglow/repo_cleanup

echo "=== Starting Server for Testing ==="
echo "To test the pages, open a browser and navigate to the following URLs:"
echo "- http://localhost:3001/ (Home/Admin page)"
echo "- http://localhost:3001/shop (Shop page)"
echo "- http://localhost:3001/contact (Contact page)"
echo "- http://localhost:3001/about-us (About Us page)"
echo "- http://localhost:3001/book-a-private-party (Private Party page)"
echo "- http://localhost:3001/login (Login page)"
echo "- http://localhost:3001/testimonials (Testimonials page)"
echo ""
echo "Check each page for:"
echo "1. Proper styling (CSS references working)"
echo "2. JavaScript functionality (JS references working)"
echo "3. Images displaying correctly"
echo "4. Links between pages working"
echo ""
echo "Press Ctrl+C to stop the server when testing is complete."
echo ""
echo "Starting server..."

# Start the server
node server/server.js 