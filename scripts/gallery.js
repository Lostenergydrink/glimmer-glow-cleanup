/**
 * gallery.js - Gallery functionality
 * Using consolidated utility functions from utilities.js
 */
import { select, selectAll, addEvent, debounce } from './utils/utilities.js';

// Select the gallery container
const galleryContainer = select('.gallery-container');

// Create image container
const imageContainer = document.createElement('div');
imageContainer.classList.add('gallery-image-container');
galleryContainer.appendChild(imageContainer);

// Number of images (update this if you add more later)
const totalImages = 71; // Updated to match the actual number of images

// Array to hold image elements
const thumbnails = [];

// Track current modal image
let currentModalIndex = 0;

// Track touch events
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Generate gallery images dynamically (but only one is visible at a time)
for (let i = 1; i <= totalImages; i++) {
  const thumbSrc = `images/image${i}.png`; // PNG thumbnail
  const fullSrc = `images/image${i}.png`;  // Using PNG for full size since not all images have SVG versions

  const thumbImg = document.createElement('img');
  thumbImg.src = thumbSrc;
  thumbImg.alt = `Gallery image ${i}`;
  thumbImg.classList.add('gallery-thumbnail');
  thumbImg.loading = "lazy";
  thumbImg.style.opacity = "0"; // Start hidden
  thumbImg.dataset.index = i - 1; // Store index for modal navigation

  // Error handling for images
  thumbImg.onerror = () => {
    console.log(`Failed to load image ${i}`);
    thumbImg.src = 'path/to/fallback-image.png'; // Add a fallback image
  };

  // Open modal on click/touch
  addEvent(thumbImg, 'click', () => openGalleryModal(fullSrc, i - 1));

  imageContainer.appendChild(thumbImg);
  thumbnails.push(thumbImg);
}

// Function to cycle through thumbnails with crossfade
let currentIndex = 0;
let isTransitioning = false;
let isPaused = false;

function showNextThumbnail() {
  if (isTransitioning || isPaused) return;
  isTransitioning = true;

  const currentThumb = thumbnails[currentIndex];
  const nextIndex = (currentIndex + 1) % thumbnails.length;
  const nextThumb = thumbnails[nextIndex];

  // Fade out current
  currentThumb.style.transition = "opacity 1s ease-in-out";
  currentThumb.style.opacity = "0";

  // Fade in next
  setTimeout(() => {
    nextThumb.style.transition = "opacity 1s ease-in-out";
    nextThumb.style.opacity = "1";
    currentIndex = nextIndex;
    isTransitioning = false;
  }, 1000);
}

// Start rotating images every 4 seconds
const rotationInterval = setInterval(showNextThumbnail, 4000);
showNextThumbnail(); // Show the first image immediately

// Pause rotation on hover/touch
addEvent(imageContainer, 'mouseenter', () => { isPaused = true; });
addEvent(imageContainer, 'mouseleave', () => { isPaused = false; });
addEvent(imageContainer, 'touchstart', () => { isPaused = true; });

// Enhanced modal functionality
const galleryModal = document.createElement('div');
galleryModal.classList.add('modal');
galleryModal.id = 'gallery-modal';
galleryModal.innerHTML = `
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <img id="modal-image" src="" alt="Full view">
    <div class="modal-nav">
      <button class="modal-prev" aria-label="Previous image">&lt;</button>
      <button class="modal-next" aria-label="Next image">&gt;</button>
    </div>
  </div>
`;
document.body.appendChild(galleryModal);

function openGalleryModal(src, index) {
  const modalImg = select('#modal-image');
  modalImg.src = src;
  currentModalIndex = index;
  galleryModal.style.display = 'block';
  document.body.classList.add('modal-open'); // Prevent background scroll
  clearInterval(rotationInterval); // Pause rotation while modal is open
}

// Modal navigation
function navigateModal(direction) {
  currentModalIndex = (currentModalIndex + direction + totalImages) % totalImages;
  const modalImg = select('#modal-image');
  modalImg.src = `images/image${currentModalIndex + 1}.png`;
}

addEvent(galleryModal.querySelector('.modal-prev'), 'click', () => navigateModal(-1));
addEvent(galleryModal.querySelector('.modal-next'), 'click', () => navigateModal(1));

// Close modal handlers
function closeModal() {
  galleryModal.style.display = 'none';
  document.body.classList.remove('modal-open'); // Re-enable background scroll
  isPaused = false;
  // Resume rotation
  setInterval(showNextThumbnail, 4000);
}

addEvent(galleryModal.querySelector('.close-button'), 'click', closeModal);
addEvent(window, 'click', (e) => {
  if (e.target === galleryModal) {
    closeModal();
  }
});

// Keyboard navigation
addEvent(document, 'keydown', (e) => {
  if (galleryModal.style.display === 'block') {
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
    if (e.key === 'Escape') closeModal();
  }
});

// Enhanced touch support for mobile
addEvent(galleryModal, 'touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
});

addEvent(galleryModal, 'touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  // Only handle horizontal swipes if they're more horizontal than vertical
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > 50) { // Minimum swipe distance
      if (deltaX < 0) { // Swipe left
        navigateModal(1);
      } else { // Swipe right
        navigateModal(-1);
      }
    }
  }
});

// Handle visibility change (tab switching, etc.)
addEvent(document, 'visibilitychange', () => {
  if (document.hidden) {
    isPaused = true;
  } else {
    isPaused = galleryModal.style.display === 'block';
  }
});

// Handle window resize
function handleResize() {
  if (galleryModal.style.display === 'block') {
    const modalImg = select('#modal-image');
    modalImg.style.maxHeight = window.innerHeight * 0.8 + 'px';
  }
}

addEvent(window, 'resize', debounce(handleResize, 100));

console.log("Enhanced gallery script loaded with mobile optimizations!"); 