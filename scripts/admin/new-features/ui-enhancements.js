/**
 * ui-enhancements.js - UI improvements for admin panel
 * 
 * This module handles DOM manipulations for enhancing the admin UI
 * to better accommodate new features.
 */
import { select, selectAll, addEvent } from '../../utils/utilities.js';

// Enhance admin navigation
export function enhanceAdminNav() {
    // Make categories link visible and active
    const categoriesLink = select('a[href="#categories"]');
    if (categoriesLink) {
        categoriesLink.style.display = 'inline-block';
    }

    // Add stock alerts section
    addStockAlertsUI();
    
    // Adjust admin content container for new sections
    adjustAdminContentLayout();
}

// Ensure all sections are accessible
export function setupSectionVisibility() {
    // Get all navigation links and content sections
    const navLinks = selectAll('.admin-nav a');
    const sections = selectAll('.admin-content .section');
    
    // Hide all sections initially
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Get the active section from URL hash or default to first section
    const hash = window.location.hash || navLinks[0]?.getAttribute('href') || '#paypal';
    
    // Show the active section
    const activeSection = select(hash);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
    
    // Update active class on navigation
    navLinks.forEach(link => {
        if (link.getAttribute('href') === hash) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Set up click handlers for navigation
    navLinks.forEach(link => {
        addEvent(link, 'click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the corresponding section
            const targetId = this.getAttribute('href');
            const targetSection = select(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });
}

// Add stock alerts UI at the top of admin panel
function addStockAlertsUI() {
    const adminContainer = select('.admin-container');
    const navElement = select('.admin-nav');
    
    if (adminContainer && navElement) {
        // Create stock alerts container
        const stockAlerts = document.createElement('div');
        stockAlerts.id = 'stockAlerts';
        stockAlerts.className = 'stock-alerts';
        
        // Stock alerts content
        stockAlerts.innerHTML = `
            <div id="lowStockAlert" class="alert" style="display: none;"></div>
        `;
        
        // Insert after nav
        adminContainer.insertBefore(stockAlerts, navElement.nextSibling);
    }
}

// Adjust admin content layout for better user experience
function adjustAdminContentLayout() {
    const adminContent = select('.admin-content');
    if (!adminContent) return;
    
    // Add flex layout to improve spacing
    adminContent.style.display = 'flex';
    adminContent.style.flexDirection = 'column';
    adminContent.style.gap = '20px';
    
    // Enhance section headers
    const sectionHeaders = selectAll('.section h2');
    sectionHeaders.forEach(header => {
        header.style.borderBottom = '2px solid #f0f0f0';
        header.style.paddingBottom = '10px';
        header.style.marginBottom = '20px';
    });
    
    // Make sure the categories section exists and is properly styled
    const categoriesSection = select('#categories');
    if (categoriesSection) {
        // Ensure it has proper styling
        categoriesSection.style.padding = '20px';
        categoriesSection.style.backgroundColor = '#fff';
        categoriesSection.style.borderRadius = '4px';
        categoriesSection.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        
        // Style the category list
        const categoryList = select('#categoryList');
        if (categoryList) {
            categoryList.style.marginTop = '20px';
            categoryList.style.display = 'grid';
            categoryList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
            categoryList.style.gap = '15px';
        }
    }
    
    // Add responsive styling for mobile
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .admin-nav .nav-links {
                flex-direction: column;
            }
            
            .admin-nav .nav-links a {
                margin: 5px 0;
            }
            
            .admin-content .section form {
                grid-template-columns: 1fr;
            }
            
            #categoryList, #productList, #galleryList, #eventsList {
                grid-template-columns: 1fr;
            }
        }
        
        .category-card {
            border: 1px solid #eee;
            border-radius: 4px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .category-card .category-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }
        
        .category-card .category-actions button {
            margin-left: 10px;
        }
        
        .stock-indicator {
            margin-left: 10px;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            color: white;
            font-weight: bold;
        }
        
        .stock-alerts {
            margin: 0 20px;
        }
        
        .alert {
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        
        .alert-warning {
            background-color: #fff3cd;
            border: 1px solid #ffeeba;
            color: #856404;
        }
        
        .bulk-stock-form .product-selection {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #eee;
            padding: 10px;
            margin-bottom: 15px;
        }
        
        .product-checkbox {
            padding: 5px 0;
            border-bottom: 1px solid #f5f5f5;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
        }
    `;
    document.head.appendChild(style);
}

// Export additional UI utilities if needed
export const uiUtils = {
    showTab(tabId) {
        // Get all tab content and tabs
        const tabContents = selectAll('.tab-content');
        const tabs = selectAll('.tab');
        
        // Hide all tab contents
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tabs
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Activate the specified tab
        const targetContent = select(`#${tabId}-tab`);
        const targetTab = select(`.tab[data-tab="${tabId}"]`);
        
        if (targetContent) targetContent.classList.add('active');
        if (targetTab) targetTab.classList.add('active');
    }
}; 