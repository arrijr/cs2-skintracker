/**
 * skintrackr design tokens — single source of truth for styling.
 * Prefer using these constants over ad-hoc Tailwind classes for visual consistency.
 */
export const tokens = {
  bg: {
    base: 'bg-slate-950',
    surface: 'bg-slate-900/70 backdrop-blur rounded-2xl',
    surfaceSolid: 'bg-slate-900',
    elevated: 'bg-slate-800/60',
    subtle: 'bg-slate-800/40',
  },
  border: {
    default: 'border-slate-700/30',
    hover: 'hover:border-slate-600/60',
    accent: 'border-purple-500/50',
    danger: 'border-red-500/30',
    success: 'border-green-500/30',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    subtle: 'text-slate-500',
    success: 'text-green-400',
    danger: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-purple-300',
  },
  accent: {
    primary: 'from-purple-500 to-pink-500',
    primaryHover: 'hover:from-purple-600 hover:to-pink-600',
    lite: 'from-amber-500 to-orange-500',
    liteHover: 'hover:from-amber-600 hover:to-orange-600',
  },
  badge: {
    pro: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    lite: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    free: 'bg-slate-700 text-slate-200',
    active: 'bg-green-500/20 text-green-300 border border-green-500/30',
    new: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
  },
  /** Typography scale — use these instead of hardcoding text-* sizes. */
  typography: {
    display: 'text-5xl md:text-7xl font-bold leading-tight',
    h1: 'text-3xl md:text-4xl font-bold',
    h2: 'text-2xl font-semibold',
    h3: 'text-lg md:text-xl font-semibold',
    body: 'text-base text-slate-300',
    bodySmall: 'text-sm text-slate-300',
    caption: 'text-xs text-slate-500',
    eyebrow: 'text-xs font-semibold uppercase tracking-wider text-purple-300/80',
    label: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
  },
  /** Icon size scale — pick exactly one per context. */
  icon: {
    xs: 'h-3 w-3',   // 12px — inline with caption text
    sm: 'h-4 w-4',   // 16px — inline with body, default button icon
    md: 'h-5 w-5',   // 20px — section icon, large button
    lg: 'h-6 w-6',   // 24px — feature card icon
    xl: 'h-8 w-8',   // 32px — empty state icon
  },
  /** Standard transitions. */
  motion: {
    fast: 'transition-colors duration-150',
    base: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },
  /**
   * Canonical CS2 rarity colors — drawn from in-game tier system.
   * Use these for skin chips, rarity badges, and tier highlights.
   * Reference: https://counterstrike.fandom.com/wiki/Skins
   */
  rarity: {
    consumer: { hex: '#b0c3d9', text: 'text-slate-300', bg: 'bg-slate-400/15', border: 'border-slate-400/40' },
    industrial: { hex: '#5e98d9', text: 'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/40' },
    milspec:  { hex: '#4b69ff', text: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/40' },
    restricted: { hex: '#8847ff', text: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/40' },
    classified: { hex: '#d32ce6', text: 'text-pink-300', bg: 'bg-pink-500/15', border: 'border-pink-500/40' },
    covert:   { hex: '#eb4b4b', text: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/40' },
    extraordinary: { hex: '#ffd700', text: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
    contraband: { hex: '#e4ae39', text: 'text-amber-200', bg: 'bg-amber-400/15', border: 'border-amber-400/40' },
  },
  /** Pre-built atmospheric effects: noise, scan lines, grid overlays. */
  fx: {
    noise: 'bg-[url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")] opacity-[0.015]',
    grid: 'bg-[linear-gradient(to_right,theme(colors.slate.800/30)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800/30)_1px,transparent_1px)] bg-[size:48px_48px]',
    radialPurple: 'bg-[radial-gradient(circle_at_top_right,theme(colors.purple.500/15),transparent_50%)]',
  },
} as const;

/** Get rarity tier from a string-y skin rarity field. */
export function rarityToken(rarity?: string | null): typeof tokens.rarity[keyof typeof tokens.rarity] {
  const r = (rarity ?? '').toLowerCase();
  if (r.includes('covert') || r.includes('extraord')) return tokens.rarity.covert;
  if (r.includes('classif')) return tokens.rarity.classified;
  if (r.includes('restrict')) return tokens.rarity.restricted;
  if (r.includes('mil') || r.includes('mil-spec')) return tokens.rarity.milspec;
  if (r.includes('industr')) return tokens.rarity.industrial;
  if (r.includes('contraband')) return tokens.rarity.contraband;
  return tokens.rarity.consumer;
}
