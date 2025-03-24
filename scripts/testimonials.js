/**
 * testimonials.js - Testimonials carousel functionality
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
    
    // Initialize the testimonial with the first one
    let currentIndex = 0;
    showTestimonial(currentIndex, testimonialContainer);
    
    // Set up dot navigation
    dots.forEach((dot, index) => {
        addEvent(dot, 'click', () => {
            currentIndex = index;
            showTestimonial(index, testimonialContainer);
            
            // Update active state of dots
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });
    
    // Start the rotation with pause on hover
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
}); 