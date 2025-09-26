# Design System - CS2 Skin Tracker
====

## Overview
This document defines the consistent design system used throughout the CS2 Skin Tracker application. All components should follow these guidelines to ensure a cohesive and professional user experience.

## Color Palette
----

### Primary Colors - CS2 Skin Tracker Palette
* **Celadon**: `#A1E8AF` - Primary actions, success states, positive values
* **Celadon Dark**: `#94C595` - Secondary actions, hover states
* **Slate Gray**: `#747C92` - Neutral elements, text, borders
* **Midnight Blue**: `#372772` - Accent elements, special highlights
* **Dark Purple**: `#3A2449` - Dark backgrounds, premium features

### Color Usage Guidelines
* **Celadon (Primary)**: Use for main CTAs, success states, positive price changes
* **Celadon Dark (Secondary)**: Use for secondary buttons, hover states
* **Slate Gray (Neutral)**: Use for text, borders, disabled states
* **Midnight Blue (Accent)**: Use for special features, highlights
* **Dark Purple (Dark)**: Use for dark mode backgrounds, premium sections

### Rarity Colors - Updated with New Palette
* **Covert**: `text-red-500 bg-red-500/10 border-red-500/30` - Red (highest rarity)
* **Classified**: `text-pink-500 bg-pink-500/10 border-pink-500/30` - Pink
* **Restricted**: `text-brand-purple-600 bg-brand-purple-600/10 border-brand-purple-600/30` - Purple
* **Mil-Spec**: `text-brand-slate-500 bg-brand-slate-500/10 border-brand-slate-500/30` - Slate
* **Industrial**: `text-cyan-500 bg-cyan-500/10 border-cyan-500/30` - Cyan
* **Consumer**: `text-brand-slate-400 bg-brand-slate-400/10 border-brand-slate-400/30` - Light Slate

### Wear Colors - Updated with New Palette
* **Factory New (FN)**: `text-brand-celadon-500 bg-brand-celadon-500/10 border-brand-celadon-500/30` - Celadon
* **Minimal Wear (MW)**: `text-brand-celadon-400 bg-brand-celadon-400/10 border-brand-celadon-400/30` - Light Celadon
* **Field-Tested (FT)**: `text-yellow-500 bg-yellow-500/10 border-yellow-500/30` - Yellow
* **Well-Worn (WW)**: `text-orange-500 bg-orange-500/10 border-orange-500/30` - Orange
* **Battle-Scarred (BS)**: `text-red-500 bg-red-500/10 border-red-500/30` - Red

### Price Change Colors - Updated with New Palette
* **Positive**: `text-brand-celadon-500` - Price increases (Celadon)
* **Negative**: `text-red-500` - Price decreases (Red)
* **Neutral**: `text-brand-slate-400` - No change (Slate)

## Card Design System
----

### Base Card Classes
```css
.card-enhanced {
  @apply transition-all duration-300 ease-in-out;
  @apply hover:shadow-xl hover:shadow-slate-500/10;
  @apply border border-slate-600/30;
  @apply hover:border-slate-500/50;
  @apply hover:bg-gradient-to-br hover:from-slate-700/30 hover:to-slate-800/30;
}

.card-glass {
  @apply bg-slate-800/30 backdrop-blur-sm;
  @apply border border-slate-700/50;
  @apply shadow-lg shadow-slate-900/20;
}
```

### Card States
* **Default**: `border-slate-700/50 bg-slate-800/30`
* **Hover**: `hover:border-slate-600/50 hover:bg-slate-700/40`
* **Active**: `border-brand-blue/50 bg-brand-blue/10`
* **Error**: `border-red-500/50 bg-red-500/10`

## Animation System
----

### Hover Effects
* **Scale**: `hover:scale-105` for cards, `hover:scale-110` for images
* **Translate**: `hover:-translate-y-1` for subtle lift
* **Glow**: `hover:shadow-xl hover:shadow-slate-500/10`

### Transitions
* **Duration**: `duration-300` for most interactions
* **Easing**: `ease-in-out` for smooth animations
* **Stagger**: Use `animation-delay` for sequential animations

### Keyframe Animations
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

## Component Patterns
----

### Enhanced Cards
All data cards should follow this pattern:
* **Container**: `card-enhanced` class
* **Image**: Aspect ratio container with hover scale
* **Overlay**: Gradient overlay on hover
* **Badges**: Top-right corner for special indicators
* **Content**: Structured with title, subtitle, price, stats
* **Actions**: Hover-revealed action buttons

### Filter Sidebars
* **Cards**: Use `card-glass` for filter groups
* **Headers**: Icon + title with brand colors
* **Quick Filters**: Grid layout with color-coded buttons
* **Tooltips**: Help icons with detailed explanations
* **Actions**: Clear, save, share buttons at bottom

### Grid Layouts
* **Responsive**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`
* **Gap**: `gap-4` for consistent spacing
* **View Toggle**: Grid/List view switcher
* **Loading**: Skeleton components matching layout

## Typography
----

### Headings
* **H1**: `text-3xl sm:text-4xl font-bold text-white`
* **H2**: `text-xl font-semibold text-white`
* **H3**: `text-lg font-semibold text-white`

### Body Text
* **Primary**: `text-white`
* **Secondary**: `text-slate-300`
* **Muted**: `text-slate-400`
* **Small**: `text-sm text-slate-400`

### Special Text
* **Price**: `text-lg font-bold text-white`
* **Change Positive**: `text-green-400 font-medium`
* **Change Negative**: `text-red-400 font-medium`

## Interactive Elements
----

### Buttons - Updated with New Palette
* **Primary**: `bg-brand-celadon-500 hover:bg-brand-celadon-600 text-white` - Main actions
* **Secondary**: `bg-brand-slate-700 hover:bg-brand-slate-600 text-white` - Secondary actions
* **Outline**: `border-brand-slate-500/50 text-brand-slate-300 hover:bg-brand-slate-700/50` - Subtle actions
* **Ghost**: `text-brand-slate-400 hover:text-white hover:bg-brand-slate-800` - Minimal actions
* **Success**: `bg-brand-celadon-500 hover:bg-brand-celadon-600 text-white` - Success states
* **Warning**: `bg-yellow-500 hover:bg-yellow-600 text-white` - Warning states
* **Danger**: `bg-red-500 hover:bg-red-600 text-white` - Error states

### Badges - Updated with New Palette
* **Default**: `border-brand-slate-500/30 text-brand-slate-300 bg-brand-slate-500/10`
* **Active**: `border-brand-celadon-500/30 text-brand-celadon-400 bg-brand-celadon-500/10`
* **Success**: `border-brand-celadon-500/30 text-brand-celadon-400 bg-brand-celadon-500/10`
* **Warning**: `border-yellow-500/30 text-yellow-400 bg-yellow-500/10`
* **Error**: `border-red-500/30 text-red-400 bg-red-500/10`
* **Info**: `border-brand-slate-500/30 text-brand-slate-400 bg-brand-slate-500/10`

### Inputs - Updated with New Palette
* **Base**: `bg-brand-slate-700/50 border-brand-slate-500/50 text-white placeholder:text-brand-slate-400`
* **Focus**: `focus:ring-2 focus:ring-brand-celadon-500/50`
* **Error**: `border-red-500/50 bg-red-500/10`
* **Success**: `border-brand-celadon-500/50 bg-brand-celadon-500/10`

## Layout Guidelines
----

### Spacing
* **Section**: `space-y-6` for major sections
* **Card Content**: `space-y-4` for card interiors
* **Form Elements**: `space-y-3` for form groups
* **Button Groups**: `gap-2` for button collections

### Containers
* **Main**: `container mx-auto px-4 py-8`
* **Cards**: `p-4` or `p-6` for content
* **Sidebar**: `w-full lg:w-80` for filter sidebars

### Backgrounds
* **Main**: `dashboard-bg` class with gradient
* **Cards**: `bg-slate-800/30 backdrop-blur-sm`
* **Overlays**: `bg-black/40 backdrop-blur-sm`

## Implementation Checklist
----

When creating new components, ensure:
* [ ] Uses consistent color palette
* [ ] Implements proper hover effects
* [ ] Follows card design patterns
* [ ] Includes proper loading states
* [ ] Has responsive design
* [ ] Uses consistent spacing
* [ ] Implements proper animations
* [ ] Includes accessibility features
* [ ] Follows typography guidelines
* [ ] Matches existing component style

## Examples
----

### Enhanced Card Component
```tsx
<Card className="card-enhanced group cursor-pointer">
  <CardContent className="p-0">
    <div className="relative aspect-square overflow-hidden rounded-t-lg">
      <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Badge className="absolute top-2 left-2">{rarity}</Badge>
    </div>
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-white group-hover:text-brand-green transition-colors">{name}</h3>
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold text-white">{price}</div>
        <div className="text-green-400 text-sm">{change}%</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Filter Sidebar Section
```tsx
<Card className="card-glass">
  <CardHeader className="pb-4">
    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
      <Icon className="h-5 w-5 text-brand-blue" />
      Section Title
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Filter content */}
  </CardContent>
</Card>
```

This design system ensures consistency across all components and provides a professional, modern look that users will recognize and appreciate.
