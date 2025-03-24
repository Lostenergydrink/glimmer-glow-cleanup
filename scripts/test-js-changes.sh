#!/bin/bash

# test-js-changes.sh - Test script for JavaScript changes
# Usage: ./test-js-changes.sh [file_to_test]
# If no file is specified, all modified files will be tested

set -e

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/$(date +%Y-%m-%d)"
TEST_REPORTS_DIR="${PROJECT_ROOT}/test-reports/$(date +%Y-%m-%d)"
SERVER_PORT=3001
SERVER_PID=""

# Create backup and test reports directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "${TEST_REPORTS_DIR}"

echo -e "${BLUE}=== JavaScript Changes Test Script ===${NC}"
echo -e "${BLUE}Backups will be stored in:${NC} ${BACKUP_DIR}"
echo -e "${BLUE}Test reports will be stored in:${NC} ${TEST_REPORTS_DIR}"

# Function to create a backup of a file
backup_file() {
    local file="$1"
    local backup_file="${BACKUP_DIR}/$(basename "$file").bak"
    
    echo -e "${YELLOW}Creating backup of:${NC} $file"
    cp "$file" "$backup_file"
    echo -e "${GREEN}Backup created:${NC} $backup_file"
}

# Function to create a test report template
create_test_report() {
    local file="$1"
    local report_file="${TEST_REPORTS_DIR}/$(basename "$file" .js)_test_report.md"
    
    echo -e "${YELLOW}Creating test report template for:${NC} $file"
    
    cat > "$report_file" << EOF
# Test Report: $(basename "$file")

## File Information
- **File Name:** $(basename "$file")
- **Path:** $file
- **Test Date:** $(date +"%Y-%m-%d %H:%M:%S")
- **Tester:** $(whoami)

## Functionality Verification

### Expected Behavior
- [ ] All original functionality works correctly
- [ ] No console errors
- [ ] No visual regressions
- [ ] All interactions function as expected

### Specific Tests
$(specific_tests_for_file "$file")

## Console Errors
- None observed / List any errors here

## Changes Made
- Replaced custom utility functions with imports from utilities.js
- Updated DOM selection methods to use select/selectAll
- Enhanced error handling with errorHandler
- Other specific changes for this file...

## Notes and Observations
- Add any observations here

## Conclusion
- [ ] Pass - No issues found
- [ ] Pass with issues - List issues:
- [ ] Fail - List critical issues:

## Next Steps
- Recommended follow-up actions
EOF
    
    echo -e "${GREEN}Test report template created:${NC} $report_file"
    echo -e "${CYAN}Please fill in the test report after testing${NC}"
}

# Function to determine specific tests for each file
specific_tests_for_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    case "$filename" in
        "admin.js")
            cat << EOF
- [ ] Admin panel loads correctly
- [ ] Navigation between sections works
- [ ] Products can be loaded and displayed
- [ ] Product creation works
- [ ] Product editing works
- [ ] Product deletion works
- [ ] Form validation works
- [ ] Error messages display correctly
EOF
            ;;
        "shop-models.js")
            cat << EOF
- [ ] Products can be loaded and displayed
- [ ] Product creation works
- [ ] Product editing works
- [ ] Product deletion works
- [ ] Stock updates work correctly
- [ ] Transaction creation works
- [ ] Subscription management works
EOF
            ;;
        "mobile-menu.js")
            cat << EOF
- [ ] Menu opens when burger icon is clicked
- [ ] Menu closes when close button is clicked
- [ ] Menu closes when a link is clicked
- [ ] iOS viewport height fix works
- [ ] iOS scroll prevention works when menu is open
EOF
            ;;
        "gallery.js")
            cat << EOF
- [ ] Gallery images load correctly
- [ ] Image rotation works
- [ ] Modal opens when images are clicked
- [ ] Modal can be closed
- [ ] Navigation between images works
- [ ] Responsive behavior works correctly
EOF
            ;;
        "reviews-carousel.js")
            cat << EOF
- [ ] Testimonials load correctly
- [ ] Automatic rotation works
- [ ] Manual navigation with dots works
- [ ] Pause on hover works
- [ ] Responsive behavior works correctly
EOF
            ;;
        *)
            cat << EOF
- [ ] Test 1: Describe specific test
- [ ] Test 2: Describe specific test
- [ ] Test 3: Describe specific test
EOF
            ;;
    esac
}

# Function to start the server
start_server() {
    echo -e "${YELLOW}Starting server for testing...${NC}"
    cd "${PROJECT_ROOT}"
    node server/server.js > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 2
    
    echo -e "${GREEN}Server started on port ${SERVER_PORT}${NC}"
    echo -e "${YELLOW}Access the following URLs for testing:${NC}"
    echo -e "${CYAN}Admin Panel:${NC} http://localhost:${SERVER_PORT}/admin"
    echo -e "${CYAN}Shop:${NC} http://localhost:${SERVER_PORT}/shop"
    echo -e "${CYAN}Home:${NC} http://localhost:${SERVER_PORT}/"
    echo -e "${YELLOW}Press Ctrl+C when testing is complete${NC}"
}

# Function to stop the server
stop_server() {
    if [ -n "$SERVER_PID" ]; then
        echo -e "${YELLOW}Stopping server...${NC}"
        kill $SERVER_PID
        echo -e "${GREEN}Server stopped${NC}"
    fi
}

# Trap to ensure server is stopped on script exit
trap stop_server EXIT

# Test specific file or all files
if [ $# -eq 1 ]; then
    # Test specific file
    FILE="$1"
    if [ ! -f "$FILE" ]; then
        echo -e "${RED}File not found:${NC} $FILE"
        exit 1
    fi
    
    echo -e "${BLUE}Testing file:${NC} $FILE"
    backup_file "$FILE"
    create_test_report "$FILE"
    
    # Ask if user wants to start the server for testing
    read -p "Do you want to start the server for testing? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_server
        
        # Wait for user to finish testing
        read -p "Press Enter when testing is complete" -r
    else
        echo -e "${CYAN}Please test the changes and fill in the test report${NC}"
    fi
else
    # Test all modified JavaScript files
    echo -e "${BLUE}Testing all modified JavaScript files...${NC}"
    
    # Files to test - replace with actual list of modified files
    FILES_TO_TEST=(
        "${PROJECT_ROOT}/scripts/admin/admin.js"
        "${PROJECT_ROOT}/scripts/shop/shop-models.js"
        "${PROJECT_ROOT}/scripts/mobile-menu.js"
        "${PROJECT_ROOT}/scripts/gallery.js"
        "${PROJECT_ROOT}/scripts/reviews-carousel.js"
    )
    
    for FILE in "${FILES_TO_TEST[@]}"; do
        if [ -f "$FILE" ]; then
            echo -e "${BLUE}Testing file:${NC} $FILE"
            backup_file "$FILE"
            create_test_report "$FILE"
        else
            echo -e "${RED}File not found:${NC} $FILE"
        fi
    done
    
    # Ask if user wants to start the server for testing
    read -p "Do you want to start the server for testing? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_server
        
        # Wait for user to finish testing
        read -p "Press Enter when testing is complete" -r
    else
        echo -e "${CYAN}Please test the changes and fill in the test reports${NC}"
    fi
fi

echo -e "${GREEN}Testing complete!${NC}"
echo -e "${YELLOW}Don't forget to fill in the test reports in:${NC} ${TEST_REPORTS_DIR}" 