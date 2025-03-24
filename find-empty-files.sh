#!/bin/bash

# find-empty-files.sh - Script to identify empty or near-empty files
# Created for GlimmerGlow Website Reorganization - Phase 3

echo "=== Finding Empty or Near-Empty Files ==="
echo "This script will identify files that could be candidates for removal."
echo

# Function to find empty files (0 bytes)
find_empty_files() {
  echo "=== Empty Files (0 bytes) ==="
  find . -type f -size 0 -not -path "*/\.*" | sort
  echo
}

# Function to find near-empty files (less than 50 bytes)
find_near_empty_files() {
  echo "=== Near-Empty Files (1-50 bytes) ==="
  find . -type f -size 1c -size -50c -not -path "*/\.*" | sort
  echo
}

# Function to find files with only HTML boilerplate
find_html_boilerplate() {
  echo "=== HTML Files with Only Boilerplate Content ==="
  # Find HTML files less than 250 bytes (likely just basic HTML structure)
  find . -name "*.html" -type f -size -250c -not -path "*/\.*" | sort
  echo
}

# Function to detect duplicate files (files with identical content)
find_duplicate_files() {
  echo "=== Potentially Duplicate Files ==="
  # Find files with identical MD5 hashes
  find . -type f -not -path "*/\.*" -exec md5sum {} \; | sort | uniq -w32 -d
  echo
}

# Run all functions
find_empty_files
find_near_empty_files
find_html_boilerplate
find_duplicate_files

echo "=== File Analysis Complete ==="
echo "Review the output above for files that may be candidates for removal."
echo "Remember to check the content of each file before removing it!" 