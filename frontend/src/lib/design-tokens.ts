export const tokens = {
  bg: {
    base: 'bg-slate-950',
    surface: 'bg-slate-900/60 backdrop-blur',
    surfaceSolid: 'bg-slate-900',
    elevated: 'bg-slate-800/60',
  },
  border: {
    default: 'border-slate-700/50',
    hover: 'hover:border-slate-600',
    accent: 'border-purple-500/50',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    success: 'text-green-400',
    danger: 'text-red-400',
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
    active: 'bg-green-500 text-white',
  },
} as const;
