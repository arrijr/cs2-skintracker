# Design System — SkinTrackr

**Last Updated**: May 2026  
**Source of truth**: `frontend/src/app/globals.css` + `frontend/src/lib/design-tokens.ts`

---

## Brand Identity

**Aesthetic**: Dark, premium, data-driven — like a trading terminal, not a game tool.  
**Mood**: Confident, serious, modern. Purple/pink gradient = premium energy.  
**NOT**: Neon gamer, childish, cluttered.

---

## Color System

### Backgrounds (Dark Theme)
| Token | Class | Hex | Usage |
|-------|-------|-----|-------|
| Base | `bg-slate-950` | `#020617` | Page background, body |
| Surface | `bg-slate-900/60` | `#0f172a` 60% | Cards, panels |
| Elevated | `bg-slate-800/60` | `#1e293b` 60% | Inputs, inner cards |
| Overlay | `bg-black/40` | — | Modals, backdrops |

### Brand Gradient (Primary)
```
bg-gradient-to-r from-purple-500 to-pink-500
hover: from-purple-600 to-pink-600
```
Used for: Primary CTAs, Pro badges, premium features, highlights.

### Tier Colors
| Tier | Gradient | Usage |
|------|---------|-------|
| Pro | `from-purple-500 to-pink-500` | Pro plan CTA, Pro badges |
| Lite | `from-purple-400 to-pink-400` | Lite plan CTA, Lite badges |
| Free | `bg-slate-700` | Free plan CTA (outline style) |

### Semantic Colors
| Purpose | Class | Usage |
|---------|-------|-------|
| Positive / Profit | `text-green-400` | Price up, P&L positive |
| Negative / Loss | `text-red-400` | Price down, P&L negative |
| Warning | `text-amber-400` | Alerts triggered, caution |
| Premium accent | `text-purple-400` | Locked features, premium labels |

### Rarity Colors
| Rarity | Color |
|--------|-------|
| Covert | `text-red-500` |
| Classified | `text-pink-500` |
| Restricted | `text-purple-500` |
| Mil-Spec | `text-slate-400` |
| Industrial | `text-cyan-500` |
| Consumer | `text-slate-500` |

### Wear Colors
| Wear | Color |
|------|-------|
| Factory New | `text-green-400` |
| Minimal Wear | `text-green-300` |
| Field-Tested | `text-yellow-400` |
| Well-Worn | `text-orange-400` |
| Battle-Scarred | `text-red-400` |

---

## Typography

| Role | Classes |
|------|---------|
| Page title | `text-3xl font-bold text-white` |
| Section heading | `text-xl font-semibold text-white` |
| Card title | `text-base font-semibold text-white` |
| Body | `text-sm text-slate-300` |
| Muted / label | `text-sm text-slate-400` |
| Price | `text-lg font-bold text-white` |
| Positive value | `text-green-400 font-medium` |
| Negative value | `text-red-400 font-medium` |

---

## Buttons

| Variant | Classes | Usage |
|---------|---------|-------|
| Primary (CTA) | `bg-gradient-to-r from-purple-500 to-pink-500 text-white` | Main actions, Sign up |
| Secondary | `bg-slate-700 hover:bg-slate-600 text-white` | Free plan, secondary actions |
| Outline | `border border-slate-600 text-slate-300 hover:bg-slate-800` | Tertiary actions |
| Ghost | `text-slate-400 hover:text-white hover:bg-slate-800` | Nav, subtle actions |
| Premium | `.btn-premium` → purple/pink gradient | Upgrade CTAs |
| Danger | `bg-red-500 hover:bg-red-600 text-white` | Delete, destructive |

**Rule**: Never mix button colors at the same hierarchy level. One primary CTA per section.

---

## CSS Component Classes

Defined in `globals.css`:

```css
.input-main        /* Dark search/input fields — slate-800 bg, purple focus ring */
.btn-premium       /* Purple/pink gradient — for upgrade CTAs */
.btn-enhanced      /* Scale + focus ring hover effects */
.btn-glow          /* Shimmer effect on hover */
.card-brand        /* Standard card with brand styling */
.card-premium      /* Premium-tier card variant */
.card-enhanced     /* Hover lift + border glow */
.card-glass        /* Backdrop blur glass card */
```

---

## Cards

### Standard Card
```
bg-slate-900/60 backdrop-blur border border-slate-700/50
hover: border-slate-600 shadow-xl shadow-slate-900/20
```

### Premium/Highlighted Card
```
border-purple-500/50 shadow-2xl shadow-purple-500/20
```

### Glass Card
```
bg-slate-800/30 backdrop-blur-sm border border-slate-700/50
```

---

## Inputs

Always use `.input-main` class:
```
bg-slate-800/60 border border-slate-600/50 text-white
placeholder: text-slate-500
focus: ring-2 ring-purple-500/50
```

**Never** use default browser input styling (appears white on dark background).

---

## Badges

| Type | Classes |
|------|---------|
| Pro | `bg-gradient-to-r from-purple-500 to-pink-500 text-white` |
| Lite | `bg-gradient-to-r from-purple-400 to-pink-400 text-white` |
| Free | `bg-slate-700 text-slate-200` |
| Active | `bg-green-500 text-white` |
| Coming Soon | `border border-slate-600 text-slate-400` |
| High severity | `bg-red-500/20 text-red-400 border-red-500/30` |
| Medium severity | `bg-amber-500/20 text-amber-400 border-amber-500/30` |

---

## Layout

| Token | Value | Usage |
|-------|-------|-------|
| Container | `container mx-auto px-4` | Page wrapper |
| Section gap | `py-20` | Between landing sections |
| Card gap | `gap-6` | Between cards in grid |
| Card padding | `p-6` | Inside cards |
| Inner padding | `p-4` | Dense cards |

### Grids
- **Skins**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Dashboard KPIs**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`
- **Pricing**: `grid-cols-1 md:grid-cols-3`
- **Features**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## Animations

| Class | Effect |
|-------|--------|
| `.animate-fade-in` | Fade up on mount |
| `.animate-slide-up` | Slide + fade from below |
| `.animate-shimmer` | Loading shimmer |
| `.animate-float` | Gentle float loop |
| `.hover-lift` | `hover:-translate-y-1 transition` |
| `hover:scale-105` | Scale on card hover |

Standard duration: `duration-300 ease-in-out`

---

## Navigation

- **Header**: `sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50`
- Nav links: `text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2`
- Active state: `text-white bg-slate-800`

---

## Borders

| Use | Class |
|-----|-------|
| Default | `border-slate-700/50` |
| Hover | `hover:border-slate-600` |
| Accent (premium) | `border-purple-500/50` |
| Error | `border-red-500/50` |

---

## Premium Feature Gates

When a feature is locked for free users:
1. Show a `Lock` icon (Lucide) in the card header
2. Dim content with `opacity-50` or replace with placeholder
3. Show upgrade CTA with `.btn-premium` + `Crown` icon
4. Card gets `border-purple-500/30` to signal premium

**Never** hide features completely — show the value, gate the access.

---

## Localization

**Language**: English only. No German strings in the UI.  
All user-facing text must be in English regardless of developer locale.

---

## Design Tokens File

Quick reference — import from `@/lib/design-tokens`:

```ts
tokens.bg.base          // 'bg-slate-950'
tokens.bg.surface       // 'bg-slate-900/60 backdrop-blur'
tokens.border.accent    // 'border-purple-500/50'
tokens.text.muted       // 'text-slate-400'
tokens.accent.primary   // 'from-purple-500 to-pink-500'
tokens.badge.pro        // purple/pink gradient badge
tokens.badge.lite       // lighter purple/pink gradient badge
```
