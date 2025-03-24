#!/bin/bash

# remove-duplicate-css.sh - Script to remove duplicated CSS from page-specific files
# Created for GlimmerGlow Website Reorganization - Phase 3

echo "=== CSS Duplication Removal Tool ==="
echo "This script will update page-specific CSS files to remove styles duplicated in global or component files."
echo

# Create backup directory
BACKUP_DIR="styles/pages/backups"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Duplicate style patterns to search for
declare -a DUPLICATE_PATTERNS=(
  # Gradient text styles duplicating global.gradient-text
  '\..*{[^}]*background-image: linear-gradient\(310deg, #7928ca, #ff0080\);[^}]*-webkit-background-clip: text;[^}]*-webkit-text-fill-color: transparent;[^}]*}'
  '\..*{[^}]*background: linear-gradient\(310deg, #7928ca, #ff0080\);[^}]*-webkit-background-clip: text;[^}]*-webkit-text-fill-color: transparent;[^}]*}'
  
  # Common flex utilities duplicating global flex classes
  '\..*{[^}]*display: flex;[^}]*justify-content: center;[^}]*align-items: center;[^}]*}'
  '\..*{[^}]*display: flex;[^}]*flex-direction: column;[^}]*}'
  '\..*{[^}]*display: flex;[^}]*flex-wrap: wrap;[^}]*}'
  
  # Modal styles duplicating modal.css
  '\.modal[^{]*{[^}]*display: none;[^}]*position: fixed;[^}]*}'
  '\.modal\.show[^{]*{[^}]*display: flex;[^}]*}'
  
  # Common button styles that could be moved to a button component CSS
  '\..*button[^{]*{[^}]*background: linear-gradient\(310deg, #7928ca, #ff0080\);[^}]*}'
  '\..*button:hover[^{]*{[^}]*transform: scale\(1\.0[0-9]\);[^}]*}'
)

# Process each page-specific CSS file
for file in styles/pages/*.css; do
  echo "Processing $file..."
  
  # Create backup
  BACKUP_FILE="$BACKUP_DIR/$(basename "$file").bak"
  cp "$file" "$BACKUP_FILE"
  echo "  Backup created: $BACKUP_FILE"
  
  # Create a temporary file for the new content
  TMP_FILE=$(mktemp)
  
  # Initial copy
  cp "$file" "$TMP_FILE"
  
  # Process each duplicate pattern
  for pattern in "${DUPLICATE_PATTERNS[@]}"; do
    echo "  Checking for pattern: ${pattern:0:40}..."
    
    # Count matches before
    MATCHES_BEFORE=$(grep -E -o "$pattern" "$TMP_FILE" | wc -l)
    
    if [ "$MATCHES_BEFORE" -gt 0 ]; then
      echo "    Found $MATCHES_BEFORE matches"
      
      # Replace the pattern with a comment suggesting to use the appropriate global class
      if [[ "$pattern" == *"gradient"* ]]; then
        sed -i -E "s/$pattern/\/* Removed duplicate gradient text style. Use .gradient-text class from global.css instead *\//g" "$TMP_FILE"
      elif [[ "$pattern" == *"flex"* ]]; then
        sed -i -E "s/$pattern/\/* Removed duplicate flex utility. Use .flex, .flex-column, .align-center, etc. from global.css instead *\//g" "$TMP_FILE"
      elif [[ "$pattern" == *"modal"* ]]; then
        sed -i -E "s/$pattern/\/* Removed duplicate modal style. These styles are now in components\/modal.css *\//g" "$TMP_FILE"
      elif [[ "$pattern" == *"button"* ]]; then
        sed -i -E "s/$pattern/\/* Removed duplicate button style. Consider using consistent button classes *\//g" "$TMP_FILE"
      else
        sed -i -E "s/$pattern/\/* Removed duplicate style *\//g" "$TMP_FILE"
      fi
    fi
  done
  
  # Check for webkit vendor prefixes that are now in global.css
  echo "  Checking for webkit vendor prefixes..."
  sed -i -E 's/-webkit-background-clip: text;[[:space:]]*-webkit-text-fill-color: transparent;/\/* Removed webkit vendor prefixes now in global.css *\//g' "$TMP_FILE"
  
  # Check for duplicated scrollbar styles
  echo "  Checking for scrollbar styles..."
  sed -i '/::-webkit-scrollbar/,/}/d' "$TMP_FILE"
  sed -i '/::-webkit-scrollbar-track/,/}/d' "$TMP_FILE"
  sed -i '/::-webkit-scrollbar-thumb/,/}/d' "$TMP_FILE"
  
  # Replace the original file with the modified version
  mv "$TMP_FILE" "$file"
  echo "  Updated $file"
  
  # Add a comment at the top of the file reminding about global styles
  sed -i '4i /* Remember to use global utility classes from global.css for common styles */' "$file"
  
  echo "Completed processing $file"
  echo
done

echo "=== CSS Duplication Removal Complete ==="
echo "All page-specific CSS files have been updated to remove duplicated styles."
echo "Backups of the original files are in $BACKUP_DIR"
echo "Remember to test all pages to ensure styling remains consistent." 