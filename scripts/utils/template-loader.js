/**
 * Template Loader
 * 
 * This script provides functionality to load HTML templates into pages
 * It supports loading header, footer, and navigation templates
 */

// Use DOMContentLoaded to ensure DOM is ready before loading templates
document.addEventListener('DOMContentLoaded', function() {
  // Load all templates based on data attributes
  loadTemplates();
});

/**
 * Loads all templates on the page
 */
function loadTemplates() {
  loadHeaderTemplate();
  loadFooterTemplate();
  loadNavigationTemplate();
}

/**
 * Loads the header template
 */
function loadHeaderTemplate() {
  const headerPlaceholders = document.querySelectorAll('[data-template="header"]');
  
  if (headerPlaceholders.length > 0) {
    fetch('../components/header-template.html')
      .then(response => response.text())
      .then(html => {
        headerPlaceholders.forEach(placeholder => {
          placeholder.innerHTML = html;
          
          // Execute any scripts in the template
          executeScriptsInTemplate(placeholder);
          
          // Apply any custom attributes
          if (placeholder.dataset.title) {
            const titleElement = placeholder.querySelector('title');
            if (titleElement) {
              titleElement.textContent = placeholder.dataset.title;
            }
          }
        });
      })
      .catch(error => {
        console.error('Error loading header template:', error);
      });
  }
}

/**
 * Loads the footer template
 */
function loadFooterTemplate() {
  const footerPlaceholders = document.querySelectorAll('[data-template="footer"]');
  
  if (footerPlaceholders.length > 0) {
    fetch('../components/footer-template.html')
      .then(response => response.text())
      .then(html => {
        footerPlaceholders.forEach(placeholder => {
          placeholder.innerHTML = html;
          
          // Execute any scripts in the template
          executeScriptsInTemplate(placeholder);
        });
      })
      .catch(error => {
        console.error('Error loading footer template:', error);
      });
  }
}

/**
 * Loads the navigation template
 */
function loadNavigationTemplate() {
  const navPlaceholders = document.querySelectorAll('[data-template="navigation"]');
  
  if (navPlaceholders.length > 0) {
    fetch('../components/navigation-template.html')
      .then(response => response.text())
      .then(html => {
        navPlaceholders.forEach(placeholder => {
          placeholder.innerHTML = html;
          
          // Execute any scripts in the template
          executeScriptsInTemplate(placeholder);
          
          // Highlight current page in navigation
          highlightCurrentPage(placeholder);
        });
      })
      .catch(error => {
        console.error('Error loading navigation template:', error);
      });
  }
}

/**
 * Executes scripts contained within a template
 * @param {HTMLElement} container - The container element containing the template
 */
function executeScriptsInTemplate(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach(script => {
    const newScript = document.createElement('script');
    
    // Copy all attributes
    Array.from(script.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    
    // Copy content
    newScript.textContent = script.textContent;
    
    // Replace the old script with the new one to execute it
    script.parentNode.replaceChild(newScript, script);
  });
}

/**
 * Highlights the current page in the navigation menu
 * @param {HTMLElement} navContainer - The navigation container element
 */
function highlightCurrentPage(navContainer) {
  const currentPath = window.location.pathname;
  const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  
  // Find all links in the navigation
  const navLinks = navContainer.querySelectorAll('a');
  
  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    
    // Check if this link matches the current page
    if (linkHref === filename || 
        (filename === '' && linkHref === 'index.html') ||
        (filename === '/' && linkHref === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadTemplates,
    loadHeaderTemplate,
    loadFooterTemplate,
    loadNavigationTemplate
  };
} 