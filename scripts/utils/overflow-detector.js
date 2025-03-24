/**
 * Overflow Detector Script
 * This script helps identify elements that are causing horizontal overflow
 * Run this in the browser console to highlight problematic elements
 */

function detectOverflowElements() {
  // Remove any previous highlights
  const oldHighlights = document.querySelectorAll('.overflow-highlight');
  oldHighlights.forEach(el => el.classList.remove('overflow-highlight'));
  
  // Create a style for highlighting overflow elements
  if (!document.getElementById('overflow-highlight-style')) {
    const style = document.createElement('style');
    style.id = 'overflow-highlight-style';
    style.textContent = `
      .overflow-highlight {
        outline: 3px solid red !important;
        background-color: rgba(255, 0, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Get viewport width
  const viewportWidth = window.innerWidth;
  
  // Check all elements
  const allElements = document.querySelectorAll('*');
  const overflowElements = [];
  
  allElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    
    // Check if element extends beyond viewport width
    if (rect.right > viewportWidth || rect.width > viewportWidth) {
      element.classList.add('overflow-highlight');
      overflowElements.push({
        element: element,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        width: rect.width,
        right: rect.right,
        overflowAmount: rect.right - viewportWidth
      });
    }
  });
  
  // Log results to console
  console.log('Elements causing overflow:', overflowElements);
  console.log('Viewport width:', viewportWidth);
  
  // Create a floating info panel
  const infoPanel = document.createElement('div');
  infoPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 5px;
    z-index: 10000;
    max-width: 300px;
    max-height: 400px;
    overflow: auto;
    font-family: monospace;
    font-size: 12px;
  `;
  
  infoPanel.innerHTML = `
    <h3 style="margin-top: 0;">Overflow Detector</h3>
    <p>Found ${overflowElements.length} elements causing overflow</p>
    <p>Viewport width: ${viewportWidth}px</p>
    <button id="close-overflow-detector" style="
      background: #ff3366;
      border: none;
      color: white;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
    ">Close</button>
    <hr>
    <div id="overflow-elements-list"></div>
  `;
  
  document.body.appendChild(infoPanel);
  
  // Add elements to the list
  const listContainer = document.getElementById('overflow-elements-list');
  overflowElements.forEach(item => {
    const el = document.createElement('div');
    el.style.cssText = 'margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;';
    el.innerHTML = `
      <div><strong>Element:</strong> ${item.tagName}</div>
      ${item.id ? `<div><strong>ID:</strong> ${item.id}</div>` : ''}
      ${item.className ? `<div><strong>Class:</strong> ${item.className}</div>` : ''}
      <div><strong>Width:</strong> ${Math.round(item.width)}px</div>
      <div><strong>Overflow:</strong> ${Math.round(item.overflowAmount)}px</div>
      <button class="fix-element-btn" data-element-index="${overflowElements.indexOf(item)}" style="
        background: #3366ff;
        border: none;
        color: white;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
        margin-top: 5px;
      ">Fix This</button>
    `;
    listContainer.appendChild(el);
  });
  
  // Add event listener to close button
  document.getElementById('close-overflow-detector').addEventListener('click', () => {
    document.body.removeChild(infoPanel);
    // Remove highlights
    document.querySelectorAll('.overflow-highlight').forEach(el => {
      el.classList.remove('overflow-highlight');
    });
  });
  
  // Add event listeners to fix buttons
  document.querySelectorAll('.fix-element-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-element-index'));
      const element = overflowElements[index].element;
      
      // Apply fixes
      element.style.maxWidth = '100%';
      element.style.width = 'auto';
      element.style.overflowX = 'hidden';
      element.style.marginLeft = '0';
      element.style.marginRight = '0';
      
      // Re-check
      setTimeout(detectOverflowElements, 500);
    });
  });
  
  return overflowElements;
}

// Run the detector
detectOverflowElements();

// Instructions for manual use
console.log('Overflow Detector Instructions:');
console.log('1. Elements causing overflow are highlighted in red');
console.log('2. Check the info panel in the top-right corner');
console.log('3. You can click "Fix This" on specific elements to apply fixes');
console.log('4. Run detectOverflowElements() again to re-check after making changes');
