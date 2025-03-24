#!/bin/bash

# analyze-css.sh - Script to analyze CSS files for potential duplication
# Created for GlimmerGlow Website Reorganization - Phase 3

echo "=== CSS Analysis Tool ==="
echo "This script analyzes CSS files to identify potential duplications and opportunities for consolidation."
echo

# Check if styles directory exists
if [ ! -d "styles" ]; then
  echo "Error: styles directory not found. Make sure you're in the project root directory."
  exit 1
fi

# Function to count CSS files
count_css_files() {
  echo "=== CSS File Count ==="
  echo "Total CSS files found: $(find styles -name "*.css" | wc -l)"
  echo
  
  echo "CSS files by directory:"
  for dir in $(find styles -type d | sort); do
    count=$(find "$dir" -maxdepth 1 -name "*.css" | wc -l)
    if [ "$count" -gt 0 ]; then
      echo "- $dir: $count files"
    fi
  done
  echo
}

# Function to list CSS properties by frequency
analyze_css_properties() {
  echo "=== Most Common CSS Properties ==="
  echo "This can help identify properties that might be candidates for global styles:"
  grep -r -o "[a-zA-Z\-]*\s*:" styles --include="*.css" | sed 's/://g' | sort | uniq -c | sort -nr | head -20
  echo
}

# Function to find duplicate or similar CSS rules
find_similar_rules() {
  echo "=== CSS Rules Analysis ==="
  echo "Looking for similar/duplicate rules across files..."
  echo

  # Extract all CSS selectors and create a sorted list
  echo "Common CSS selectors (appearing in multiple files):"
  grep -r -o "^[a-zA-Z0-9\-_\.#][a-zA-Z0-9\-_\.#: ]*\s*{" styles --include="*.css" | 
    sed 's/{//g' | sed 's/^[^:]*://g' | sort | uniq -c | sort -nr | 
    awk '$1 > 1 {print "  - " $0 " (appears in " $1 " files)"}' | head -15
  echo
}

# Function to analyze CSS file sizes
analyze_file_sizes() {
  echo "=== CSS File Sizes ==="
  echo "Largest CSS files (potential candidates for refactoring):"
  find styles -name "*.css" -type f -exec du -h {} \; | sort -hr | head -10
  echo
}

# Function to check for vendor prefixes
check_vendor_prefixes() {
  echo "=== Vendor Prefix Analysis ==="
  echo "Count of vendor prefixes used across CSS files:"
  grep -r -o "\-webkit\-[a-zA-Z\-]*" styles --include="*.css" | sort | uniq -c | sort -nr
  grep -r -o "\-moz\-[a-zA-Z\-]*" styles --include="*.css" | sort | uniq -c | sort -nr
  grep -r -o "\-ms\-[a-zA-Z\-]*" styles --include="*.css" | sort | uniq -c | sort -nr
  echo
}

# Run all functions
count_css_files
analyze_css_properties
find_similar_rules
analyze_file_sizes
check_vendor_prefixes

echo "=== CSS Analysis Complete ==="
echo "Review the output above for opportunities to consolidate CSS."
echo "Consider creating global style files for common properties and selectors." 