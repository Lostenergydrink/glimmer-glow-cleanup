/**
 * reviews-carousel.js - Customer reviews carousel functionality
 * Using consolidated utility functions from utilities.js
 */
import { select, selectAll, addEvent, showTestimonial, startRotation } from './utils/utilities.js';

document.addEventListener('DOMContentLoaded', function() {
    const testimonials = selectAll('.testimonial');
    const dots = selectAll('.nav-dot');
    const testimonialContainer = select('.testimonial-container');
    
    if (!testimonials.length || !dots.length || !testimonialContainer) {
        console.error('Required testimonial elements not found');
        return;
    }
    
    // Initialize with the first testimonial
    let currentIndex = 0;
    showTestimonial(currentIndex, testimonialContainer);
    
    // Add click handlers to dots
    dots.forEach((dot, index) => {
        addEvent(dot, 'click', () => {
            currentIndex = index;
            showTestimonial(index, testimonialContainer);
            
            // Update active state of dots
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });
    
    // Start rotation with pause functionality
    startRotation(
        (index) => {
            currentIndex = index % testimonials.length;
            showTestimonial(currentIndex, testimonialContainer);
            
            // Update active state of dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        },
        8000, // 8 second interval
        testimonialContainer // Container for pause on hover
    );
    
    // Add responsiveness to carousel
    addEvent(window, 'resize', adjustCarousel);
    
    function adjustCarousel() {
        const width = window.innerWidth;
        const carousel = select('.reviews-carousel');
        
        if (!carousel) return;
        
        if (width < 768) {
            // Adjust carousel settings for mobile
            if (window.$ && $('.reviews-carousel').slick) {
                $('.reviews-carousel').slick('unslick'); // Example with Slick Carousel
                $('.reviews-carousel').slick({
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    autoplay: true,
                });
            }
        } else {
            // Reset carousel settings for desktop
            if (window.$ && $('.reviews-carousel').slick) {
                $('.reviews-carousel').slick('unslick');
                $('.reviews-carousel').slick({
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    autoplay: true,
                });
            }
        }
    }
}); 