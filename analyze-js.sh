#!/bin/bash

# analyze-js.sh - Script to analyze JavaScript files for potential refactoring
# Created for GlimmerGlow Website Reorganization - Phase 3

echo "=== JavaScript Analysis Tool ==="
echo "This script analyzes JavaScript files to identify potential duplications and refactoring opportunities."
echo

# Check if scripts directory exists
if [ ! -d "scripts" ]; then
  echo "Error: scripts directory not found. Make sure you're in the project root directory."
  exit 1
fi

# Function to count JS files
count_js_files() {
  echo "=== JavaScript File Count ==="
  echo "Total JavaScript files found: $(find scripts -name "*.js" | wc -l)"
  echo
  
  echo "JavaScript files by directory:"
  for dir in $(find scripts -type d | sort); do
    count=$(find "$dir" -maxdepth 1 -name "*.js" | wc -l)
    if [ "$count" -gt 0 ]; then
      echo "- $dir: $count files"
    fi
  done
  echo
}

# Function to analyze file sizes
analyze_file_sizes() {
  echo "=== JavaScript File Sizes ==="
  echo "Largest JavaScript files (potential candidates for refactoring):"
  find scripts -name "*.js" -type f -exec du -h {} \; | sort -hr | head -10
  echo
}

# Function to find duplicate function names
find_duplicate_functions() {
  echo "=== Function Name Analysis ==="
  echo "Looking for functions that might be defined in multiple files..."
  
  # Find all function definitions and extract names
  echo "Common function names (potentially defined in multiple files):"
  grep -r "function " scripts --include="*.js" | 
    grep -o "function [a-zA-Z0-9_]*" | 
    sed 's/function //g' | sort | uniq -c | sort -nr | 
    awk '$1 > 1 {print "  - " $2 " (appears " $1 " times)"}' | head -15
  echo
}

# Function to find potential utility functions
find_utility_functions() {
  echo "=== Potential Utility Functions ==="
  echo "Small functions that might be candidates for a utilities file:"
  
  # Find small function definitions (single line or few lines)
  grep -r -A 1 "function [a-zA-Z0-9_]*" scripts --include="*.js" | 
    grep -B 1 "}" | grep -v "\-\-" | head -20
  echo
}

# Function to find DOM manipulation patterns
find_dom_patterns() {
  echo "=== DOM Manipulation Patterns ==="
  echo "Common DOM manipulation patterns that could be consolidated:"
  
  # Find common DOM methods
  echo "getElementById usage:"
  grep -r "getElementById" scripts --include="*.js" | wc -l
  
  echo "querySelector usage:"
  grep -r "querySelector" scripts --include="*.js" | wc -l
  
  echo "addEventListener usage:"
  grep -r "addEventListener" scripts --include="*.js" | wc -l
  echo
}

# Function to find event listeners
find_event_listeners() {
  echo "=== Event Listener Analysis ==="
  echo "Common event types used across files:"
  
  # Extract event types from addEventListener calls
  grep -r "addEventListener" scripts --include="*.js" | 
    grep -o "addEventListener(['\"][a-zA-Z]*['\"]" | 
    sed "s/addEventListener(['\"]//g" | sed "s/['\"]//g" | 
    sort | uniq -c | sort -nr
  echo
}

# Function to find AJAX/fetch patterns
find_ajax_patterns() {
  echo "=== AJAX/Fetch Usage Analysis ==="
  echo "API endpoints being accessed:"
  
  # Find URLs in fetch or XMLHttpRequest
  grep -r "fetch(" scripts --include="*.js" | grep -o "fetch(['\"][^'\"]*['\"]" | 
    sed "s/fetch(['\"]//g" | sed "s/['\"]//g" | sort | uniq
  grep -r "open(" scripts --include="*.js" | grep -o "open(['\"][^'\"]*['\"], ['\"][^'\"]*['\"]" | 
    sed "s/.*['\"]GET['\"], ['\"]//g" | sed "s/['\"].*//g" | sort | uniq
  echo
}

# Run all functions
count_js_files
analyze_file_sizes
find_duplicate_functions
find_utility_functions
find_dom_patterns
find_event_listeners
find_ajax_patterns

echo "=== JavaScript Analysis Complete ==="
echo "Review the output above for opportunities to refactor JavaScript code."
echo "Consider creating utility modules for common functionality." 