# Advanced CSS Glow Effect Documentation

This document provides a detailed explanation of the multi-layered glow effect implemented for buttons on the Glimmer & Glow website.

## Overview

We've created a sophisticated three-layer glow effect using modern CSS features. The effect consists of:

1. A bottom shadow layer (charcoal grey)
2. A middle glow layer (pink-to-purple gradient rotating clockwise)
3. A top glow layer (cyan-to-pink-to-purple gradient rotating counter-clockwise)

## CSS Features Used

### @property API

```css
@property --angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
```

The `@property` rule is a modern CSS feature that allows us to define custom properties with specific types and behaviors. In this case, we're defining an `--angle` property that:
- Has a syntax of type "angle"
- Starts at 0 degrees
- Doesn't inherit its value from parent elements

This allows us to animate the angle smoothly in our keyframe animations.

### Conic Gradients

```css
background-image: conic-gradient(from var(--angle), transparent 20%, #ff0080, #d946ef, #a855f7, #7928ca, #ff0080);
```

Conic gradients create color transitions rotated around a center point. We're using the `--angle` variable to control the starting point of the gradient, which allows us to animate it.

### Pseudo-elements (::before and ::after)

We're using the `::before` and `::after` pseudo-elements to create additional layers without adding extra HTML. The `span::before` selector targets a pseudo-element of the span inside our button.

### CSS Animations

```css
@keyframes spin {
  from {
    --angle: 0deg;
  }
  to {
    --angle: 360deg;
  }
}

@keyframes spin-reverse {
  from {
    --angle: 360deg;
  }
  to {
    --angle: 0deg;
  }
}
```

These keyframe animations change the `--angle` property over time, creating the rotation effect. We have two animations:
- `spin`: Rotates clockwise (0° to 360°)
- `spin-reverse`: Rotates counter-clockwise (360° to 0°)

### CSS Filters

```css
filter: blur(2.5rem) rotate(45deg);
```

The `filter` property applies visual effects. We're using:
- `blur()`: Creates the soft glow effect
- `rotate()`: Rotates the gradient for more visual interest

## Layer-by-Layer Breakdown

### 1. Bottom Layer (Shadow)

```css
.glow-button::before {
  content: '';
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: rgba(40, 40, 45, 0.85); /* Frosted charcoal grey */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -3; /* Lowest z-index to be at the bottom */
  border-radius: 1.875rem;
  filter: blur(1rem);
  opacity: 0.9;
}
```

This layer creates a frosted charcoal shadow beneath the button. It:
- Is positioned absolutely with 100% height and width
- Uses a semi-transparent dark grey color
- Has a blur effect of 1rem
- Has the lowest z-index (-3) to ensure it stays beneath other layers

### 2. Middle Layer (Primary Glow)

```css
.glow-button::after {
  --angle: 0deg;
  content: '';
  position: absolute;
  height: 120%;
  width: 120%;
  background-image: conic-gradient(from var(--angle), transparent 20%, #ff0080, #d946ef, #a855f7, #7928ca, #ff0080);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -2; /* Middle layer */
  padding: 3px;
  border-radius: 1.875rem;
  animation: 3s spin linear infinite;
  filter: blur(2.5rem) rotate(45deg);
  opacity: 0.8;
}
```

This layer creates the primary pink-to-purple glow. It:
- Is 20% larger than the button (120% height and width)
- Uses a conic gradient with the site's pink and purple colors
- Rotates clockwise using the `spin` animation (3 seconds per rotation)
- Has a blur effect of 2.5rem and is rotated 45 degrees
- Has a middle z-index (-2)

### 3. Top Layer (Accent Glow)

```css
.glow-button span::before {
  --angle: 0deg;
  content: '';
  position: absolute;
  height: 140%;
  width: 140%;
  background-image: conic-gradient(from var(--angle), transparent 30%, #45fffc, #00fff2, #ff007b, #ff0095, #9645ff);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  z-index: -1; /* Top layer */
  border-radius: 1.875rem;
  animation: 4s spin-reverse linear infinite;
  filter: blur(3rem);
  opacity: 0.6;
}
```

This layer creates an accent glow with cyan-to-pink-to-purple colors. It:
- Is 40% larger than the button (140% height and width)
- Uses a different color scheme with cyan accents
- Rotates counter-clockwise using the `spin-reverse` animation (4 seconds per rotation)
- Has a blur effect of 3rem
- Has the highest z-index (-1) of the glow layers

## Hover Effects

```css
.glow-button:hover {
  transform: scale(1.02);
}

.glow-button:hover::after {
  filter: blur(3rem) rotate(45deg);
  opacity: 1;
}

.glow-button:hover span::before {
  filter: blur(3.5rem) rotate(-45deg);
  opacity: 0.8;
}
```

When hovering over the button:
- The button scales up slightly (1.02x)
- The middle layer's blur increases to 3rem and becomes fully opaque
- The top layer's blur increases to 3.5rem and becomes more opaque (0.8)

## HTML Structure Required

For this effect to work properly, buttons need to have a span element inside them:

```html
<button class="glow-button">
  <span>Button Text</span>
</button>
```

Or for anchor tags:

```html
<a href="#" class="glow-button">
  <span>Link Text</span>
</a>
```

## Browser Compatibility

This effect uses modern CSS features:
- `@property`: Supported in Chrome, Edge, and other Chromium-based browsers
- Conic gradients: Widely supported in modern browsers
- CSS filters: Widely supported in modern browsers

For browsers that don't support `@property`, the gradient will still appear but won't animate.

## Performance Considerations

This effect uses multiple layers with blurs and animations, which can be CPU-intensive. Consider:
- Using it sparingly on important call-to-action buttons
- Testing performance on lower-end devices
- Potentially reducing the effect complexity for mobile devices using media queries

## Customization Options

The effect can be customized by modifying:
- Gradient colors to match your brand
- Animation speeds (currently 3s and 4s)
- Blur amounts
- Layer sizes (currently 100%, 120%, and 140%)
- Opacity values

## Implementation

To apply this effect to a button, simply:
1. Add the CSS code to your stylesheet
2. Add the `glow-button` class to your button
3. Ensure your button text is wrapped in a `<span>` element




<Original design as reference point />



@property --angle{
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }
  
  .card::after, .card::before{
    --angle: 0deg;
    content: '';
    position: absolute;
    height: 100%
    width: 100%
    background-image: conic-gradient(from var(--angle), transparant 70%, #ff454f, #00ff99, #006aff, #ff0095, #ff4545);
    top: 50%;
    left: 50%;
    translate: -50%, -50%;
    z-index: -1;
    paddiing: 3px;
    border-radius: 10px;
    animation: 3s spin linear infinite;
  }
  .card: :before{
    filter: blur(1.5rem) rotate(45deg);
    opacity: 0.5;
  }
  @keyframes spin{
    from{
      --angle: 0deg;
    }
    to{
      --angle: 360deg;
    }
  }

