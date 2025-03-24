#!/bin/bash

# fix-duplicate-css.sh - Script to remove duplicated CSS from page-specific files
# Improved version after initial script had issues with regex patterns
# Created for GlimmerGlow Website Reorganization - Phase 3

echo "=== CSS Duplication Removal Tool (Improved) ==="
echo "This script will update page-specific CSS files to remove styles duplicated in global or component files."
echo

# Create backup directory
BACKUP_DIR="styles/pages/backups-improved"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Process each page-specific CSS file
for file in styles/pages/*.css; do
  filename=$(basename "$file")
  echo "Processing $file..."
  
  # Create backup
  BACKUP_FILE="$BACKUP_DIR/$filename.bak"
  cp "$file" "$BACKUP_FILE"
  echo "  Backup created: $BACKUP_FILE"
  
  # Create temporary files for processing
  TMP_FILE=$(mktemp)
  
  # Initial copy
  cp "$file" "$TMP_FILE"
  
  # 1. Remove webkit vendor prefixes for gradient text
  echo "  Removing webkit prefixes for gradient text..."
  sed -i -e 's/-webkit-background-clip: text;/background-clip: text; \/* Vendor prefix removed - in global.css *\//g' "$TMP_FILE"
  sed -i -e 's/-webkit-text-fill-color: transparent;/\/* Vendor prefix removed - in global.css *\//g' "$TMP_FILE"
  
  # 2. Replace gradient text styles with a comment to use .gradient-text class
  echo "  Cleaning up gradient text styles..."
  sed -i -e '/background.*linear-gradient.*310deg.*#7928ca.*#ff0080.*text/,+2 {
    s/background.*linear-gradient.*310deg.*#7928ca.*#ff0080.*/\/* Use .gradient-text class from global.css instead *\//
    /.*-webkit-background-clip: text/d
    /.*-webkit-text-fill-color: transparent/d
  }' "$TMP_FILE"
  
  # 3. Replace common flex patterns with a suggestion to use utility classes
  echo "  Cleaning up flex styles..."
  sed -i -e '/display: flex;.*justify-content: center;.*align-items: center;/ {
    s/display: flex;/\/* Use .flex, .justify-center, .align-center from global.css *\//
    /justify-content: center;/d
    /align-items: center;/d
  }' "$TMP_FILE"
  
  sed -i -e '/display: flex;.*flex-direction: column/ {
    s/display: flex;/\/* Use .flex.flex-column from global.css *\//
    /flex-direction: column;/d
  }' "$TMP_FILE"
  
  # 4. Remove scrollbar styling that is duplicated in global.css
  echo "  Removing scrollbar styles..."
  sed -i '/::-webkit-scrollbar/,/}/d' "$TMP_FILE"
  sed -i '/::-webkit-scrollbar-track/,/}/d' "$TMP_FILE"
  sed -i '/::-webkit-scrollbar-thumb/,/}/d' "$TMP_FILE"
  
  # 5. Remove standalone modal styling that duplicates components/modal.css
  echo "  Cleaning up modal styles..."
  sed -i '/^\.modal {/,/^}/d' "$TMP_FILE"
  sed -i '/^\.modal\.show {/,/^}/d' "$TMP_FILE"
  sed -i '/^\.modal-content {/,/^}/d' "$TMP_FILE"
  sed -i '/^\.modal-header {/,/^}/d' "$TMP_FILE"
  sed -i '/^\.modal-title {/,/^}/d' "$TMP_FILE"
  sed -i '/^\.modal-body {/,/^}/d' "$TMP_FILE"
  sed -i '/^\.modal-footer {/,/^}/d' "$TMP_FILE"
  
  # 6. Fix any duplicate comments that might have been added
  echo "  Cleaning up duplicate comments..."
  sed -i '/Remember to use global utility classes/d' "$TMP_FILE"
  
  # 7. Add a helpful comment at the top of the file
  echo "  Adding usage reminder comment..."
  sed -i '4i /* IMPORTANT: Use global utility classes from global.css for common styles */' "$TMP_FILE"
  
  # Replace the original file with the modified version
  mv "$TMP_FILE" "$file"
  echo "  Updated $file"
  
  echo "Completed processing $file"
  echo
done

# Create a summary file documenting what was removed
echo "=== Creating documentation of removed styles ==="
cat > "2025-03-21-CSS-DUPLICATION-REMOVAL-SUMMARY.md" << EOF
# CSS Duplication Removal Summary

## Date: 2025-03-21
## Project: GlimmerGlow Website
## Phase: Phase 3 - Code Cleanup and Standardization

### Overview

Identified and removed CSS duplications from page-specific CSS files. These styles were already present in:
- \`styles/global/global.css\` - Common styles, reset, utilities, vendor prefixes
- \`styles/components/modal.css\` - Modal styles
- \`styles/components/calendar.css\` - Calendar styles

### Removed Duplications

1. **Gradient Text Styles**
   - Removed duplicate gradient text styles that use the same color pattern
   - Added comments instructing to use \`.gradient-text\` class from global.css

2. **Flex Utility Patterns**
   - Removed duplicate flex display patterns
   - Added comments instructing to use utility classes (\`.flex\`, \`.flex-column\`, etc.)

3. **Vendor Prefixes**
   - Removed duplicate vendor prefixes that are already normalized in global.css
   - Primarily focused on \`-webkit-background-clip\` and \`-webkit-text-fill-color\`

4. **Scrollbar Styling**
   - Removed page-specific scrollbar styling duplicating global scrollbar styles
   - This standardizes scrollbar appearance across all pages

5. **Modal Styles**
   - Removed duplicate modal styles that are now in components/modal.css
   - This ensures consistent modal styling across all pages

### Impact

- Reduced redundancy in CSS files
- Improved maintainability by centralizing common styles
- Encouraged use of utility classes for consistency
- Made it easier to update styles globally with fewer places to change

### Next Steps

- Test pages with updated CSS files to ensure styling remains consistent
- Update HTML files to use utility classes where appropriate
- Consider creating additional component CSS files for buttons and other recurring elements
EOF

echo "=== CSS Duplication Removal Complete ==="
echo "All page-specific CSS files have been updated to remove duplicated styles."
echo "Backups of the original files are in $BACKUP_DIR"
echo "A summary has been created in 2025-03-21-CSS-DUPLICATION-REMOVAL-SUMMARY.md"
echo "Remember to test all pages to ensure styling remains consistent." 