#!/bin/bash

# Validate Code Standards Script
# Runs the validation script to check HTML, CSS, and JavaScript files
# against the defined coding standards

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== GlimmerGlow Coding Standards Validation ==="
echo "Starting validation at $(date)"
echo

# Run the validation script
node "$SCRIPT_DIR/utils/validate-standards.js"

REPORT_PATH="$ROOT_DIR/docs/validation-report.md"
if [ -f "$REPORT_PATH" ]; then
  echo
  echo "Report generated successfully at: $REPORT_PATH"
  
  # Count issues by severity
  ISSUES=$(grep -c "❌" "$REPORT_PATH" || echo "0")
  WARNINGS=$(grep -c "⚠️" "$REPORT_PATH" || echo "0")
  SUCCESS=$(grep -c "✅" "$REPORT_PATH" || echo "0")
  
  echo
  echo "Summary:"
  echo "- Critical issues: $ISSUES"
  echo "- Warnings: $WARNINGS"
  echo "- Compliant files: $SUCCESS"
  
  # Check if there are any critical issues
  if [ "$ISSUES" -gt 0 ]; then
    echo
    echo "Action required: Please fix critical issues before committing!"
    exit 1
  else
    echo
    echo "No critical issues found. Code meets minimum standards."
    if [ "$WARNINGS" -gt 0 ]; then
      echo "Consider addressing the warnings to improve code quality."
    fi
    exit 0
  fi
else
  echo
  echo "Error: Report was not generated. Check for errors above."
  exit 1
fi 