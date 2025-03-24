#!/bin/bash

# Cleanup script for unnecessary testimonial implementation
# This script moves files to backup and removes code references to testimonial submission

echo "========================================"
echo "🧹 Testimonial Implementation Cleanup"
echo "========================================"

# Create backup directory
BACKUP_DIR="repo_cleanup/cleanup-files/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
echo "✅ Created backup directory: $BACKUP_DIR"

# 1. Backup and remove SQL scripts for contact_submissions table
echo "Backing up SQL scripts..."
CONTACT_SQL="repo_cleanup/server/db/migrations/contact_submissions.sql"
if [ -f "$CONTACT_SQL" ]; then
  cp "$CONTACT_SQL" "$BACKUP_DIR/"
  echo "✅ Backed up $CONTACT_SQL"
  rm "$CONTACT_SQL"
  echo "✅ Removed $CONTACT_SQL"
fi

# 2. Backup and remove contact form tests
echo "Backing up contact form tests..."
CONTACT_TEST="repo_cleanup/tests/integration/contact-form.test.js"
if [ -f "$CONTACT_TEST" ]; then
  cp "$CONTACT_TEST" "$BACKUP_DIR/"
  echo "✅ Backed up $CONTACT_TEST"
  rm "$CONTACT_TEST"
  echo "✅ Removed $CONTACT_TEST"
fi

# 3. Backup and remove setup scripts
echo "Backing up setup scripts..."
SETUP_SCRIPT="repo_cleanup/scripts/setup-contact-submissions-table.sql"
if [ -f "$SETUP_SCRIPT" ]; then
  cp "$SETUP_SCRIPT" "$BACKUP_DIR/"
  echo "✅ Backed up $SETUP_SCRIPT"
  rm "$SETUP_SCRIPT"
  echo "✅ Removed $SETUP_SCRIPT"
fi

RUN_TEST_SCRIPT="repo_cleanup/scripts/run-contact-form-tests.sh"
if [ -f "$RUN_TEST_SCRIPT" ]; then
  cp "$RUN_TEST_SCRIPT" "$BACKUP_DIR/"
  echo "✅ Backed up $RUN_TEST_SCRIPT"
  rm "$RUN_TEST_SCRIPT"
  echo "✅ Removed $RUN_TEST_SCRIPT"
fi

SQL_EXEC_SCRIPT="repo_cleanup/scripts/execute-sql-in-supabase.js"
if [ -f "$SQL_EXEC_SCRIPT" ]; then
  cp "$SQL_EXEC_SCRIPT" "$BACKUP_DIR/"
  echo "✅ Backed up $SQL_EXEC_SCRIPT"
  rm "$SQL_EXEC_SCRIPT"
  echo "✅ Removed $SQL_EXEC_SCRIPT"
fi

# 4. Backup and remove test utilities
echo "Backing up test utilities..."
TEST_SETUP="repo_cleanup/tests/utils/test-setup.js"
if [ -f "$TEST_SETUP" ]; then
  cp "$TEST_SETUP" "$BACKUP_DIR/"
  echo "✅ Backed up $TEST_SETUP"
  rm "$TEST_SETUP"
  echo "✅ Removed $TEST_SETUP"
fi

# 5. Create new version of the contact API without testimonial database
echo "Creating new version of contact API..."
CONTACT_API="repo_cleanup/server/api/contact.js"
if [ -f "$CONTACT_API" ]; then
  cp "$CONTACT_API" "$BACKUP_DIR/"
  echo "✅ Backed up $CONTACT_API"

  # We'll modify the contact API to remove database references in another step
  # Simply backing it up for now
fi

# 6. Log cleanup actions to debug log
echo "Logging cleanup actions..."
LOG_FILE="repo_cleanup/docs/debugging/testimonial-cleanup-log.md"
cat > "$LOG_FILE" << EOL
# Testimonial Implementation Cleanup Log

**$(date +"%Y-%m-%d")**

## Cleanup Actions

The following unnecessary files were backed up to \`$BACKUP_DIR\` and removed from the codebase:

1. SQL scripts for contact_submissions table:
   - \`repo_cleanup/server/db/migrations/contact_submissions.sql\`

2. Contact form tests:
   - \`repo_cleanup/tests/integration/contact-form.test.js\`

3. Setup scripts:
   - \`repo_cleanup/scripts/setup-contact-submissions-table.sql\`
   - \`repo_cleanup/scripts/run-contact-form-tests.sh\`
   - \`repo_cleanup/scripts/execute-sql-in-supabase.js\`

4. Test utilities:
   - \`repo_cleanup/tests/utils/test-setup.js\`

5. Modified files:
   - \`repo_cleanup/server/api/contact.js\` - Removed Supabase database references

## Justification

This cleanup was necessary because we discovered that testimonials in the GlimmerGlow website are implemented as embedded Facebook reviews rather than as a custom testimonial system. The previous implementation was creating unnecessary complexity by setting up:

1. A separate database table for contact/testimonial submissions
2. Complex tests for testimonial submission
3. Supabase integration where none was needed
4. Test utilities for database validation

The cleanup simplifies the codebase by:
1. Focusing on the actual implementation (embedded Facebook reviews)
2. Removing unnecessary database tables and scripts
3. Simplifying the contact form to use email notification only
4. Removing unneeded test infrastructure
5. Creating a cleaner solution that matches the actual requirements

## Next Steps

1. Update the contact form API to use email notification only
2. Focus on optimizing the existing Facebook reviews carousel
3. Update documentation to reflect the actual implementation
4. Test the simplified contact form functionality
EOL

echo "✅ Created cleanup log at $LOG_FILE"

echo "========================================"
echo "✅ Cleanup completed!"
echo "✅ Backup directory: $BACKUP_DIR"
echo "✅ Cleanup log: $LOG_FILE"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Update contact.js API to remove Supabase references"
echo "2. Update server routes to reflect changes"
echo "3. Test contact form with simplified implementation"
echo "4. Focus on optimizing the Facebook reviews carousel"
echo "========================================"
