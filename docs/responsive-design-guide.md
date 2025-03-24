# Responsive Design Guide for Glimmer & Glow Website

## Understanding What Works

After analyzing your website, I've identified why certain sections (home page header, hero section, and shop page) are responsive while others aren't. Here's what makes these sections work well on mobile:

### 1. Proper Media Queries

The responsive sections use media queries to adjust styles based on screen size:

```css
@media (max-width: 991px) {
  /* Tablet styles */
}

@media (max-width: 767px) {
  /* Mobile styles */
}

@media (max-width: 479px) {
  /* Small mobile styles */
}
```

### 2. Percentage-Based Widths

Responsive sections use percentage-based widths instead of fixed pixel widths:

```css
/* Non-responsive (fixed width) */
.card {
  width: 500px;
}

/* Responsive (percentage width) */
.card {
  width: 90%;
}
```

### 3. Flexible Layouts

Responsive sections use flexible layouts that can adapt to different screen sizes:

```css
/* Using flex-direction to change from row to column on mobile */
@media (max-width: 767px) {
  .container {
    flex-direction: column;
  }
}
```

### 4. Appropriate Font Sizing

Text sizes are adjusted for smaller screens:

```css
@media (max-width: 767px) {
  h1 {
    font-size: 2rem;
  }
}
```

## How to Fix Non-Responsive Sections

I've created a comprehensive CSS file (`responsive-fixes.css`) that addresses all the common issues. Here's how to apply it:

1. Include the CSS file in your HTML:

```html
<link href="./responsive-fixes.css" rel="stylesheet" />
```

2. Add appropriate classes to problematic sections:

- For sections that should stack vertically on mobile, add the class `stack-on-mobile`
- For grid layouts that should become single column on mobile, add the class `grid-layout`

## Common Issues and Solutions

### Issue 1: Elements Overlapping on Mobile

**Solution**: Use the `stack-on-mobile` class and ensure elements have percentage-based widths.

### Issue 2: Text Too Large or Small

**Solution**: The responsive-fixes.css file includes text size adjustments for different screen sizes.

### Issue 3: Images Not Scaling Properly

**Solution**: Make sure images have `width: 100%` and `height: auto` on mobile screens.

### Issue 4: Absolute Positioned Elements Breaking Layout

**Solution**: On mobile, change absolute positioned elements to relative positioning.

## Section-Specific Fixes

### Testimonials Section

The testimonials section needs to stack cards vertically on mobile instead of showing them side by side.

### Calendar Section

The calendar needs horizontal scrolling on mobile due to its tabular nature.

### Experience Section

The experience section needs to center its card and adjust the background image.

### Footer

The footer needs to stack its columns vertically on mobile.

## Testing Your Responsive Design

1. Use browser developer tools to test different screen sizes
2. Check common breakpoints: 
   - Desktop: 1200px+
   - Tablet: 768px - 991px
   - Mobile: 480px - 767px
   - Small Mobile: < 480px

3. Test real devices when possible

## Maintaining Responsive Design

When adding new sections to your website:

1. Start with mobile design first
2. Use percentage-based widths
3. Use flexbox or grid for layouts
4. Include appropriate media queries
5. Test on multiple screen sizes

By following these principles, your entire website will maintain consistent responsiveness across all sections.
