/**
 * mobile-menu.js - Mobile menu functionality
 * Using consolidated utility functions from utilities.js
 */
import { select, selectAll, addEvent } from './utils/utilities.js';

document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = select('.header-burger-menu');
    const mobileMenu = select('.header-mobile-menu');
    const closeMenu = select('.header-close-menu');
    const mobileMenuLinks = selectAll('.header-mobile-menu a');

    function toggleMenu() {
        mobileMenu.classList.toggle('show');
        document.body.classList.toggle('mobile-menu-open');
    }

    function closeMenuOnClick() {
        mobileMenu.classList.remove('show');
        document.body.classList.remove('mobile-menu-open');
    }

    // Handle burger menu click
    if (burgerMenu) {
        addEvent(burgerMenu, 'click', toggleMenu);
    }

    // Handle close button click
    if (closeMenu) {
        addEvent(closeMenu, 'click', closeMenuOnClick);
    }

    // Close menu when clicking on a link
    mobileMenuLinks.forEach(link => {
        addEvent(link, 'click', closeMenuOnClick);
    });

    // Handle scroll issues on iOS
    addEvent(document.body, 'touchmove', function(e) {
        if (document.body.classList.contains('mobile-menu-open')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Fix 100vh issue on iOS
    function setViewportHeight() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    addEvent(window, 'resize', setViewportHeight);
    addEvent(window, 'orientationchange', setViewportHeight);
    setViewportHeight();
});
