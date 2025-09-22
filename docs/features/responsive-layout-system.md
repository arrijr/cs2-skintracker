Responsive Layout System
========================

Overview
--------

The CS2 Skin Tracker implements a comprehensive responsive layout system designed for optimal user experience across all device sizes. The system uses Tailwind CSS with custom utility classes and follows mobile-first design principles.

Key Features
------------

### Container System
* **`container-cs2`**: Main content container with max-width constraints
* **`section-cs2`**: Section spacing with responsive vertical padding
* **`container-fluid`**: Full-width container for special layouts

### Responsive Grid Utilities
* **`grid-responsive`**: 1-4 column responsive grid (mobile to desktop)
* **`grid-responsive-2`**: 1-2 column responsive grid for balanced layouts
* **`grid-responsive-3`**: 1-3 column responsive grid for dashboard components

### Mobile-First Breakpoints
* **Mobile**: `< 640px` - Single column layouts
* **Small**: `640px+` - Two column layouts, larger text
* **Medium**: `768px+` - Three column layouts, desktop navigation
* **Large**: `1024px+` - Full desktop features
* **Extra Large**: `1280px+` - Optimized for large screens

Implementation
--------------

### CSS Classes

```css
/* Container and Layout */
.container-cs2 {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  @apply w-full;
}

.section-cs2 {
  @apply py-6 sm:py-8;
}

/* Responsive Grid Utilities */
.grid-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6;
}

.grid-responsive-2 {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6;
}

.grid-responsive-3 {
  @apply grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6;
}
```

### Dashboard Layout Structure

```tsx
// Main Dashboard Container
<div className="min-h-screen bg-neutral-950 text-white">
  <div className="container-cs2 section-cs2">
    {/* Header with responsive flexbox */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Content */}
    </div>
    
    {/* Main Content Grid */}
    <div className="space-y-6 animate-fade-in mobile-optimized desktop-optimized">
      {/* Top Row - Portfolio + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Portfolio Overview */}
        </div>
        <div className="space-y-6">
          {/* Alerts & Watchlist */}
        </div>
      </div>
      
      {/* Middle Row - Breakdown + Market + Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Components */}
      </div>
    </div>
  </div>
</div>
```

### Header Layout

```tsx
// Responsive Header Structure
<header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/95">
  <div className="container-cs2">
    <div className="flex h-16 items-center justify-between">
      {/* Logo */}
      <div className="flex items-center">
        {/* Logo content */}
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {/* Navigation links */}
      </nav>
      
      {/* Desktop Search Bar */}
      <div className="hidden lg:flex flex-1 max-w-lg mx-4">
        <SkinSearchBar />
      </div>
      
      {/* Desktop Auth Controls */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Profile dropdown */}
      </div>
      
      {/* Mobile Menu */}
      <div className="md:hidden">
        {/* Mobile menu implementation */}
      </div>
    </div>
  </div>
</header>
```

Component Examples
------------------

### Responsive Text Sizing

```tsx
// Dashboard Title
<h1 className="text-3xl sm:text-4xl font-bold mb-2">Dashboard</h1>

// Portfolio Value
<div className="text-2xl sm:text-3xl font-bold text-brand-green">
  {formatUSD(totalValue)}
</div>
```

### Responsive Grid Layouts

```tsx
// P&L Overview Grid
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
  {/* Day P&L */}
  <div className="text-center">
    {/* Content */}
  </div>
  {/* 7d P&L */}
  <div className="text-center">
    {/* Content */}
  </div>
  {/* Total P&L */}
  <div className="text-center">
    {/* Content */}
  </div>
</div>

// KPI Row
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mt-6">
  {/* KPI items */}
</div>
```

### Search Bar Responsiveness

```tsx
// Search Bar Component
<div className="relative w-full">
  <input
    className="input-main w-full"
    placeholder="Search a skin…"
  />
  {/* Dropdown */}
</div>

// Header Search Container
<div className="hidden lg:flex flex-1 max-w-lg mx-4">
  <SkinSearchBar />
</div>
```

Best Practices
--------------

### Mobile-First Approach
1. Start with mobile layout (single column)
2. Add responsive breakpoints for larger screens
3. Use `sm:`, `md:`, `lg:`, `xl:` prefixes for progressive enhancement

### Grid System Usage
1. Use `grid-responsive-3` for dashboard components
2. Use `grid-responsive-2` for balanced layouts
3. Use `grid-responsive` for complex multi-column layouts

### Container Usage
1. Use `container-cs2` for main content areas
2. Use `section-cs2` for vertical spacing
3. Use `container-fluid` for full-width elements

### Responsive Text
1. Use responsive text sizing: `text-3xl sm:text-4xl`
2. Ensure readability on all screen sizes
3. Test with different content lengths

### Flexbox Layouts
1. Use `flex-col sm:flex-row` for responsive direction changes
2. Use `items-center` for vertical alignment
3. Use `justify-between` for space distribution

Performance Considerations
--------------------------

### CSS Optimization
* Utility classes are purged in production
* Custom classes are defined in `@layer components`
* Responsive utilities are optimized for tree-shaking

### Layout Shifts
* Use consistent spacing with Tailwind utilities
* Avoid dynamic height calculations
* Use `min-h-screen` for full-height layouts

### Mobile Performance
* Optimize images for mobile devices
* Use `loading="lazy"` for below-fold content
* Minimize JavaScript for mobile interactions

Browser Support
---------------

### Supported Browsers
* Chrome 90+
* Firefox 88+
* Safari 14+
* Edge 90+

### CSS Features Used
* CSS Grid
* Flexbox
* CSS Custom Properties
* Media Queries
* Backdrop Filter

### Fallbacks
* Graceful degradation for older browsers
* Progressive enhancement for modern features
* Mobile-first ensures basic functionality

Testing
-------

### Responsive Testing
1. Test on actual devices when possible
2. Use browser dev tools for different screen sizes
3. Test with different content lengths
4. Verify touch interactions on mobile

### Breakpoint Testing
* Mobile: 375px, 414px
* Tablet: 768px, 1024px
* Desktop: 1280px, 1920px

### Content Testing
* Test with short and long content
* Test with different image sizes
* Test with various user data scenarios

Future Enhancements
-------------------

### Planned Improvements
* Container queries for component-level responsiveness
* Advanced grid layouts with CSS Subgrid
* Improved mobile navigation patterns
* Better touch interaction support

### Performance Optimizations
* CSS-in-JS for dynamic responsive styles
* Server-side responsive image generation
* Advanced caching strategies for mobile

### Accessibility
* Better keyboard navigation
* Screen reader optimizations
* High contrast mode support
* Reduced motion preferences

Troubleshooting
---------------

### Common Issues

#### Layout Breaking on Mobile
* Check for fixed widths in components
* Ensure proper responsive classes
* Test with different content lengths

#### Grid Items Not Aligning
* Verify grid container classes
* Check for conflicting CSS
* Ensure proper gap spacing

#### Text Overflow
* Use responsive text sizing
* Implement proper truncation
* Test with long content

#### Search Bar Issues
* Check container width constraints
* Verify responsive visibility classes
* Test on different screen sizes

### Debug Tools
* Browser dev tools responsive mode
* Tailwind CSS IntelliSense
* CSS Grid Inspector
* Flexbox Inspector
