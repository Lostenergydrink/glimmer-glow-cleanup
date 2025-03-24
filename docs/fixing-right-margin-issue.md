# Fixing the Right Margin Issue in Glimmer & Glow Website

## The Problem

You've noticed a large margin or empty space on the right side of your website when viewing it at smaller screen sizes. This is causing elements to "dogpile" together at around 650px width instead of gracefully adapting like your header and hero sections do.

## What Causes This Issue

This issue is typically caused by one or more of these problems:

1. **Horizontal Overflow**: Elements that are wider than the viewport
2. **Fixed Width Elements**: Elements with fixed pixel widths that don't adapt to screen size
3. **Negative Margins**: CSS that pushes elements outside the normal flow
4. **Missing Overflow Control**: Container elements without `overflow-x: hidden`

## The Solution

I've created three files to address this issue:

1. `responsive-fixes.css`: General responsive design fixes for various screen sizes
2. `overflow-fix.css`: Specific fixes for the horizontal overflow issue
3. `overflow-detector.js`: A diagnostic tool to identify problematic elements

### How to Use the Overflow Detector

1. Open your website in Chrome
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Copy and paste this code:

```javascript
const script = document.createElement('script');
script.src = './overflow-detector.js';
document.body.appendChild(script);
```

5. Press Enter to run the code
6. The detector will highlight problematic elements in red and show an info panel

### Common Elements That Cause Overflow

Based on my analysis, these are likely culprits:

1. **Facebook Review Frames**: These iframes have fixed widths
2. **Calendar Container**: May have a fixed width
3. **Experience Section Background**: May extend beyond the viewport
4. **Gallery Grid**: May not be properly responsive

## Manual Fixes for Specific Elements

If the automatic fixes in `overflow-fix.css` don't completely solve the issue, here are some manual fixes you can apply:

### For Facebook Review Frames

```css
.facebook-review-frame {
  width: 100% !important;
  max-width: 500px !important;
}
```

### For Calendar

```css
.calendar-container {
  width: 100% !important;
  overflow-x: auto !important;
}

.calendar {
  min-width: 480px !important;
}
```

### For Experience Section

```css
.experience-hero {
  width: 100% !important;
  overflow: hidden !important;
}

.experience-container {
  width: 100% !important;
  max-width: 100% !important;
}
```

### For Gallery Grid

```css
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
  width: 100% !important;
}
```

## Testing Your Fix

1. Resize your browser window to different widths
2. Use Chrome's device emulation (in Developer Tools) to test on different device sizes
3. Check if horizontal scrollbars appear
4. Verify that all content stays within the viewport width

## Understanding the Root Cause

The reason your header and hero sections work well is that they:

1. Use percentage-based widths (not fixed pixels)
2. Have proper container elements with `overflow-x: hidden`
3. Use flexbox layouts that adapt to screen size
4. Have media queries that change layouts at different breakpoints

By applying these same principles to all sections of your site with our CSS fixes, you should achieve consistent responsive behavior across the entire website.
