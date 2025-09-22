# Logo Integration Guide

## How to integrate your custom logo

### 1. Add your logo file
Place your logo file in the `frontend/public/` directory as `logo.png`

**Requirements:**
- Format: PNG with transparent background
- Size: 64x64px or 128x128px (for high DPI displays)
- Name: `logo.png`

### 2. Enable the logo in the component
In `frontend/src/components/Logo.tsx`, uncomment the Image component and comment out the fallback:

```tsx
// Replace this fallback:
<div className="w-full h-full bg-gradient-to-br from-brand-green to-brand-blue rounded-lg flex items-center justify-center">
  <span className="text-white font-bold text-xs">CS</span>
</div>

// With this:
<Image
  src="/logo.png"
  alt="SKINTRACKR Logo"
  width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
  height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
  className="w-full h-full object-contain"
  priority
/>
```

### 3. Logo is already integrated
The logo component is already integrated in:
- Desktop header (`AppHeader.tsx`)
- Mobile menu
- All pages that use the header

### 4. Customization options
The Logo component supports:
- `size`: 'sm' | 'md' | 'lg'
- `showText`: boolean (show/hide text)
- `className`: custom CSS classes

### 5. Current fallback
Until you add your logo, it shows a gradient square with "CS" as fallback.

## Your logo description
Based on your description, your logo features:
- A knife with upward trending arrow
- Green and white color scheme
- "SKINTRACKR" text
- Modern, minimalist design

This will look great in the header! 🎨
