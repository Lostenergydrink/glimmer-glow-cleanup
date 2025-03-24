/**
 * @file validate-standards.js - Validation script for GlimmerGlow coding standards
 * 
 * This script checks HTML, CSS, and JavaScript files for compliance with
 * the established coding standards defined in the style guides.
 * 
 * @version 1.0.0
 * @created 2025-03-27
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '../../'),
  outputFile: path.resolve(__dirname, '../../docs/validation-report.md'),
  ignorePatterns: [
    'node_modules',
    '.git',
    'dist',
    'backups',
    'old',
    '*.bak',
    '*.min.js',
    '*.min.css'
  ],
  checkDirs: {
    html: ['pages'],
    css: ['styles'],
    js: ['scripts']
  }
};

// Results storage
const results = {
  html: { passed: [], warnings: [], failed: [] },
  css: { passed: [], warnings: [], failed: [] },
  js: { passed: [], warnings: [], failed: [] }
};

/**
 * Main validation function
 */
async function validateStandards() {
  console.log('Starting validation of coding standards...');
  
  try {
    // Validate HTML files
    console.log('\nValidating HTML files...');
    await validateFileType('html', '.html');
    
    // Validate CSS files
    console.log('\nValidating CSS files...');
    await validateFileType('css', '.css');
    
    // Validate JavaScript files
    console.log('\nValidating JavaScript files...');
    await validateFileType('js', ['.js', '.mjs']);
    
    // Generate report
    await generateReport();
    
    console.log(`\nValidation complete! Report saved to ${CONFIG.outputFile}`);
  } catch (error) {
    console.error('Error during validation:', error);
  }
}

/**
 * Find and validate files of a specific type
 * 
 * @param {string} type - File type (html, css, js)
 * @param {string|string[]} extensions - File extension(s) to check
 */
async function validateFileType(type, extensions) {
  const dirs = CONFIG.checkDirs[type];
  const extensionsArray = Array.isArray(extensions) ? extensions : [extensions];
  
  for (const dir of dirs) {
    const dirPath = path.join(CONFIG.rootDir, dir);
    try {
      await findAndValidateFiles(dirPath, type, extensionsArray);
    } catch (error) {
      console.error(`Error checking directory ${dirPath}:`, error);
    }
  }
}

/**
 * Recursively find files and validate them
 * 
 * @param {string} dirPath - Directory path to search
 * @param {string} type - File type to validate
 * @param {string[]} extensions - File extensions to check
 */
async function findAndValidateFiles(dirPath, type, extensions) {
  try {
    const entries = await readdirAsync(dirPath);
    
    for (const entry of entries) {
      // Skip ignored patterns
      if (CONFIG.ignorePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(entry);
        }
        return entry === pattern;
      })) {
        continue;
      }
      
      const entryPath = path.join(dirPath, entry);
      const stats = await statAsync(entryPath);
      
      if (stats.isDirectory()) {
        // Recursively check subdirectories
        await findAndValidateFiles(entryPath, type, extensions);
      } else if (stats.isFile() && extensions.some(ext => entry.endsWith(ext))) {
        // Validate file
        await validateFile(entryPath, type);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

/**
 * Validate a single file
 * 
 * @param {string} filePath - Path to the file
 * @param {string} type - File type (html, css, js)
 */
async function validateFile(filePath, type) {
  try {
    const relativePath = path.relative(CONFIG.rootDir, filePath);
    console.log(`  Checking ${relativePath}...`);
    
    const content = await readFileAsync(filePath, 'utf8');
    
    // Run validators based on file type
    switch (type) {
      case 'html':
        validateHtmlFile(content, relativePath);
        break;
      case 'css':
        validateCssFile(content, relativePath);
        break;
      case 'js':
        validateJsFile(content, relativePath);
        break;
    }
  } catch (error) {
    console.error(`Error validating file ${filePath}:`, error);
  }
}

/**
 * Validate HTML file against standards
 * 
 * @param {string} content - File content
 * @param {string} filePath - Relative file path
 */
function validateHtmlFile(content, filePath) {
  const issues = [];
  const warnings = [];
  
  // Check DOCTYPE
  if (!content.trim().startsWith('<!DOCTYPE html>')) {
    issues.push('Missing or incorrect DOCTYPE declaration');
  }
  
  // Check lang attribute
  if (!/<html\s+[^>]*lang=['"](?:en|es|fr)['"][^>]*>/i.test(content)) {
    issues.push('Missing lang attribute on <html> tag');
  }
  
  // Check viewport meta
  if (!/<meta\s+[^>]*name=['"]viewport['"][^>]*>/i.test(content)) {
    issues.push('Missing viewport meta tag');
  }
  
  // Check for semantic HTML5 elements
  const semanticElements = ['header', 'footer', 'main', 'section', 'article', 'nav', 'aside'];
  let hasSemanticElements = false;
  for (const element of semanticElements) {
    if (content.includes(`<${element}`) && content.includes(`</${element}>`)) {
      hasSemanticElements = true;
      break;
    }
  }
  if (!hasSemanticElements) {
    warnings.push('No semantic HTML5 elements found');
  }
  
  // Check for BEM naming convention
  const bemRegex = /class=["']([^"']+)["']/g;
  let match;
  let bemCompliant = true;
  const classes = new Set();
  
  while ((match = bemRegex.exec(content)) !== null) {
    const classNames = match[1].split(/\s+/);
    
    for (const className of classNames) {
      classes.add(className);
      
      // Skip utility classes (typically single word)
      if (!className.includes('-') && !className.includes('__') && !className.includes('--')) {
        continue;
      }
      
      // Check if class follows BEM convention
      const isBlockElementModifier = /^[a-z]+-[a-z]+(?:__[a-z-]+)?(?:--[a-z-]+)?$/.test(className);
      if (!isBlockElementModifier) {
        bemCompliant = false;
        break;
      }
    }
    
    if (!bemCompliant) break;
  }
  
  if (!bemCompliant) {
    warnings.push('Not all classes follow BEM naming convention');
  }
  
  // Check required attributes on form elements
  if (content.includes('<form')) {
    const inputsWithoutRequired = /<input\s+[^>]*type=["'](text|email|tel|number|url|password)["'][^>]*(?!required)[^>]*>/gi.test(content);
    if (inputsWithoutRequired) {
      warnings.push('Form inputs missing required attribute');
    }
    
    const inputsWithoutLabel = /<input\s+[^>]*(?!id=["'][^"']+["'])[^>]*>/gi.test(content);
    if (inputsWithoutLabel) {
      warnings.push('Form inputs missing id attribute for label association');
    }
  }
  
  // Check for template usage
  if (!content.includes('data-template')) {
    warnings.push('No template usage found (data-template attribute)');
  }
  
  // Record results
  if (issues.length === 0) {
    if (warnings.length === 0) {
      results.html.passed.push({ file: filePath });
    } else {
      results.html.warnings.push({ file: filePath, warnings });
    }
  } else {
    results.html.failed.push({ file: filePath, issues, warnings });
  }
}

/**
 * Validate CSS file against standards
 * 
 * @param {string} content - File content
 * @param {string} filePath - Relative file path
 */
function validateCssFile(content, filePath) {
  const issues = [];
  const warnings = [];
  
  // Check for file header comment
  if (!content.trim().startsWith('/**') && !content.trim().startsWith('/*')) {
    issues.push('Missing file header comment');
  }
  
  // Check for section comments
  const sectionCommentRegex = /\/\* ={2,} | ={2,} \*\//;
  if (!sectionCommentRegex.test(content)) {
    warnings.push('Missing standard section divider comments');
  }
  
  // Check for BEM naming convention
  const selectorRegex = /([.][a-zA-Z0-9_-]+)(?:\s*[,{])/g;
  let match;
  let bemCompliant = true;
  const selectors = new Set();
  
  while ((match = selectorRegex.exec(content)) !== null) {
    const selector = match[1].substring(1); // Remove the leading dot
    selectors.add(selector);
    
    // Skip utility classes (typically single word)
    if (!selector.includes('-') && !selector.includes('__') && !selector.includes('--')) {
      continue;
    }
    
    // Check if selector follows BEM convention
    const isBlockElementModifier = /^[a-z]+-[a-z]+(?:__[a-z-]+)?(?:--[a-z-]+)?$/.test(selector);
    if (!isBlockElementModifier) {
      bemCompliant = false;
      break;
    }
  }
  
  if (!bemCompliant) {
    warnings.push('Not all selectors follow BEM naming convention');
  }
  
  // Check for CSS custom properties
  if (!content.includes('var(--')) {
    warnings.push('No CSS custom properties (variables) used');
  }
  
  // Check for media queries
  if (!content.includes('@media')) {
    warnings.push('No media queries found for responsive design');
  }
  
  // Record results
  if (issues.length === 0) {
    if (warnings.length === 0) {
      results.css.passed.push({ file: filePath });
    } else {
      results.css.warnings.push({ file: filePath, warnings });
    }
  } else {
    results.css.failed.push({ file: filePath, issues, warnings });
  }
}

/**
 * Validate JavaScript file against standards
 * 
 * @param {string} content - File content
 * @param {string} filePath - Relative file path
 */
function validateJsFile(content, filePath) {
  const issues = [];
  const warnings = [];
  
  // Check for file header comment
  if (!content.trim().startsWith('/**')) {
    issues.push('Missing JSDoc file header comment');
  }
  
  // Check for section comments
  const sectionCommentRegex = /\/\/ ={2,}/;
  if (!sectionCommentRegex.test(content)) {
    warnings.push('Missing standard section divider comments');
  }
  
  // Check for JSDoc comments on functions
  const functionRegex = /(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(|let\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(|var\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\()/g;
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  
  let jsdocCount = 0;
  let functionCount = 0;
  
  while (functionRegex.exec(content) !== null) {
    functionCount++;
  }
  
  while (jsdocRegex.exec(content) !== null) {
    jsdocCount++;
  }
  
  // Account for the file header JSDoc
  if (jsdocCount > 0) jsdocCount--;
  
  if (functionCount > 0 && jsdocCount < functionCount) {
    warnings.push(`Not all functions have JSDoc comments (${jsdocCount}/${functionCount})`);
  }
  
  // Check for error handling
  if (!content.includes('try {') || !content.includes('catch (')) {
    if (content.includes('fetch(') || content.includes('async ')) {
      warnings.push('Async code without try/catch error handling');
    }
  }
  
  // Check naming conventions
  const camelCaseVarRegex = /(?:let|const|var)\s+([a-zA-Z0-9_]+)\s*=/g;
  let match;
  let camelCaseCompliant = true;
  
  while ((match = camelCaseVarRegex.exec(content)) !== null) {
    const varName = match[1];
    
    // Allow uppercase for constants
    if (/^[A-Z][A-Z0-9_]+$/.test(varName)) {
      continue;
    }
    
    // Check if variable follows camelCase
    if (!/^[a-z][a-zA-Z0-9]*$/.test(varName)) {
      camelCaseCompliant = false;
      break;
    }
  }
  
  if (!camelCaseCompliant) {
    warnings.push('Not all variables follow camelCase naming convention');
  }
  
  // Record results
  if (issues.length === 0) {
    if (warnings.length === 0) {
      results.js.passed.push({ file: filePath });
    } else {
      results.js.warnings.push({ file: filePath, warnings });
    }
  } else {
    results.js.failed.push({ file: filePath, issues, warnings });
  }
}

/**
 * Generate a Markdown report from validation results
 */
async function generateReport() {
  console.log('\nGenerating validation report...');
  
  const totalFiles = {
    html: results.html.passed.length + results.html.warnings.length + results.html.failed.length,
    css: results.css.passed.length + results.css.warnings.length + results.css.failed.length,
    js: results.js.passed.length + results.js.warnings.length + results.js.failed.length
  };
  
  const complianceRate = {
    html: Math.round((results.html.passed.length / totalFiles.html) * 100) || 0,
    css: Math.round((results.css.passed.length / totalFiles.css) * 100) || 0,
    js: Math.round((results.js.passed.length / totalFiles.js) * 100) || 0,
    overall: Math.round(
      ((results.html.passed.length + results.css.passed.length + results.js.passed.length) / 
       (totalFiles.html + totalFiles.css + totalFiles.js)) * 100
    ) || 0
  };
  
  let report = `# Coding Standards Validation Report\n\n`;
  report += `*Generated on: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  report += `## Summary\n\n`;
  report += `| File Type | Files Checked | Fully Compliant | With Warnings | Failed | Compliance Rate |\n`;
  report += `|-----------|---------------|----------------|---------------|-------|----------------|\n`;
  report += `| HTML | ${totalFiles.html} | ${results.html.passed.length} | ${results.html.warnings.length} | ${results.html.failed.length} | ${complianceRate.html}% |\n`;
  report += `| CSS | ${totalFiles.css} | ${results.css.passed.length} | ${results.css.warnings.length} | ${results.css.failed.length} | ${complianceRate.css}% |\n`;
  report += `| JavaScript | ${totalFiles.js} | ${results.js.passed.length} | ${results.js.warnings.length} | ${results.js.failed.length} | ${complianceRate.js}% |\n`;
  report += `| **Overall** | **${totalFiles.html + totalFiles.css + totalFiles.js}** | **${results.html.passed.length + results.css.passed.length + results.js.passed.length}** | **${results.html.warnings.length + results.css.warnings.length + results.js.warnings.length}** | **${results.html.failed.length + results.css.failed.length + results.js.failed.length}** | **${complianceRate.overall}%** |\n\n`;
  
  // HTML Results
  report += `## HTML Files\n\n`;
  
  if (results.html.failed.length > 0) {
    report += `### Issues Found (${results.html.failed.length} files)\n\n`;
    results.html.failed.forEach(item => {
      report += `- **${item.file}**\n`;
      item.issues.forEach(issue => {
        report += `  - ❌ ${issue}\n`;
      });
      if (item.warnings.length > 0) {
        item.warnings.forEach(warning => {
          report += `  - ⚠️ ${warning}\n`;
        });
      }
      report += `\n`;
    });
  }
  
  if (results.html.warnings.length > 0) {
    report += `### Warnings (${results.html.warnings.length} files)\n\n`;
    results.html.warnings.forEach(item => {
      report += `- **${item.file}**\n`;
      item.warnings.forEach(warning => {
        report += `  - ⚠️ ${warning}\n`;
      });
      report += `\n`;
    });
  }
  
  report += `### Compliant Files (${results.html.passed.length} files)\n\n`;
  if (results.html.passed.length > 0) {
    report += `The following files are fully compliant with HTML standards:\n\n`;
    const maxFilesToShow = 10;
    const files = results.html.passed.map(item => item.file);
    
    if (files.length <= maxFilesToShow) {
      files.forEach(file => {
        report += `- ✅ ${file}\n`;
      });
    } else {
      // Show a sample of files if there are many
      files.slice(0, maxFilesToShow).forEach(file => {
        report += `- ✅ ${file}\n`;
      });
      report += `- *... and ${files.length - maxFilesToShow} more files*\n`;
    }
  } else {
    report += `No fully compliant HTML files found.\n`;
  }
  report += `\n`;
  
  // CSS Results
  report += `## CSS Files\n\n`;
  
  if (results.css.failed.length > 0) {
    report += `### Issues Found (${results.css.failed.length} files)\n\n`;
    results.css.failed.forEach(item => {
      report += `- **${item.file}**\n`;
      item.issues.forEach(issue => {
        report += `  - ❌ ${issue}\n`;
      });
      if (item.warnings.length > 0) {
        item.warnings.forEach(warning => {
          report += `  - ⚠️ ${warning}\n`;
        });
      }
      report += `\n`;
    });
  }
  
  if (results.css.warnings.length > 0) {
    report += `### Warnings (${results.css.warnings.length} files)\n\n`;
    results.css.warnings.forEach(item => {
      report += `- **${item.file}**\n`;
      item.warnings.forEach(warning => {
        report += `  - ⚠️ ${warning}\n`;
      });
      report += `\n`;
    });
  }
  
  report += `### Compliant Files (${results.css.passed.length} files)\n\n`;
  if (results.css.passed.length > 0) {
    report += `The following files are fully compliant with CSS standards:\n\n`;
    const maxFilesToShow = 10;
    const files = results.css.passed.map(item => item.file);
    
    if (files.length <= maxFilesToShow) {
      files.forEach(file => {
        report += `- ✅ ${file}\n`;
      });
    } else {
      // Show a sample of files if there are many
      files.slice(0, maxFilesToShow).forEach(file => {
        report += `- ✅ ${file}\n`;
      });
      report += `- *... and ${files.length - maxFilesToShow} more files*\n`;
    }
  } else {
    report += `No fully compliant CSS files found.\n`;
  }
  report += `\n`;
  
  // JavaScript Results
  report += `## JavaScript Files\n\n`;
  
  if (results.js.failed.length > 0) {
    report += `### Issues Found (${results.js.failed.length} files)\n\n`;
    results.js.failed.forEach(item => {
      report += `- **${item.file}**\n`;
      item.issues.forEach(issue => {
        report += `  - ❌ ${issue}\n`;
      });
      if (item.warnings.length > 0) {
        item.warnings.forEach(warning => {
          report += `  - ⚠️ ${warning}\n`;
        });
      }
      report += `\n`;
    });
  }
  
  if (results.js.warnings.length > 0) {
    report += `### Warnings (${results.js.warnings.length} files)\n\n`;
    results.js.warnings.forEach(item => {
      report += `- **${item.file}**\n`;
      item.warnings.forEach(warning => {
        report += `  - ⚠️ ${warning}\n`;
      });
      report += `\n`;
    });
  }
  
  report += `### Compliant Files (${results.js.passed.length} files)\n\n`;
  if (results.js.passed.length > 0) {
    report += `The following files are fully compliant with JavaScript standards:\n\n`;
    const maxFilesToShow = 10;
    const files = results.js.passed.map(item => item.file);
    
    if (files.length <= maxFilesToShow) {
      files.forEach(file => {
        report += `- ✅ ${file}\n`;
      });
    } else {
      // Show a sample of files if there are many
      files.slice(0, maxFilesToShow).forEach(file => {
        report += `- ✅ ${file}\n`;
      });
      report += `- *... and ${files.length - maxFilesToShow} more files*\n`;
    }
  } else {
    report += `No fully compliant JavaScript files found.\n`;
  }
  report += `\n`;
  
  // Recommendations
  report += `## Recommendations\n\n`;
  report += `Based on the validation results, focus on addressing the following common issues:\n\n`;
  
  const commonHtmlIssues = findCommonIssues('html');
  const commonCssIssues = findCommonIssues('css');
  const commonJsIssues = findCommonIssues('js');
  
  report += `### HTML\n\n`;
  if (commonHtmlIssues.length > 0) {
    commonHtmlIssues.forEach(issue => {
      report += `- ${issue.count} files: ${issue.issue}\n`;
    });
  } else {
    report += `No common HTML issues found.\n`;
  }
  report += `\n`;
  
  report += `### CSS\n\n`;
  if (commonCssIssues.length > 0) {
    commonCssIssues.forEach(issue => {
      report += `- ${issue.count} files: ${issue.issue}\n`;
    });
  } else {
    report += `No common CSS issues found.\n`;
  }
  report += `\n`;
  
  report += `### JavaScript\n\n`;
  if (commonJsIssues.length > 0) {
    commonJsIssues.forEach(issue => {
      report += `- ${issue.count} files: ${issue.issue}\n`;
    });
  } else {
    report += `No common JavaScript issues found.\n`;
  }
  report += `\n`;
  
  report += `## Next Steps\n\n`;
  report += `1. Address critical issues in failed files\n`;
  report += `2. Implement warning fixes in files with warnings\n`;
  report += `3. Run this validation script again to check progress\n`;
  report += `4. Consider implementing automatic linting as part of the development workflow\n`;
  
  // Write report to file
  try {
    const docsDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.outputFile, report, 'utf8');
    console.log(`Report saved to ${CONFIG.outputFile}`);
  } catch (error) {
    console.error('Error writing report:', error);
  }
}

/**
 * Find common issues across files
 * 
 * @param {string} type - File type (html, css, js)
 * @returns {Array} - Array of common issues
 */
function findCommonIssues(type) {
  const allIssues = [];
  
  // Collect issues and warnings
  results[type].failed.forEach(item => {
    item.issues.forEach(issue => {
      allIssues.push(issue);
    });
    item.warnings.forEach(warning => {
      allIssues.push(warning);
    });
  });
  
  results[type].warnings.forEach(item => {
    item.warnings.forEach(warning => {
      allIssues.push(warning);
    });
  });
  
  // Count occurrences
  const counts = {};
  allIssues.forEach(issue => {
    counts[issue] = (counts[issue] || 0) + 1;
  });
  
  // Sort by count (descending)
  return Object.entries(counts)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count);
}

// Run the validation
validateStandards();

module.exports = { validateStandards }; 