// CS2-themed SVG empty-state illustrations.
// Pure inline SVG — no external assets. Stylised, on-brand.

interface IllustrationProps {
  className?: string;
  size?: number;
}

/** Closed crate with subtle rays — for "no skins yet" / "no purchases" */
export function EmptyCrate({ className, size = 96 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="crate-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="crate-glow" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Glow rays from top */}
      <path
        d="M 48 6 L 30 38 L 66 38 Z"
        fill="url(#crate-glow)"
      />
      {/* Crate body */}
      <rect x="18" y="40" width="60" height="44" rx="3" fill="url(#crate-body)" stroke="#334155" strokeWidth="1.2" />
      {/* Lid */}
      <rect x="14" y="36" width="68" height="10" rx="2" fill="#334155" stroke="#475569" strokeWidth="1.2" />
      {/* Front planks */}
      <line x1="28" y1="46" x2="28" y2="84" stroke="#0f172a" strokeWidth="1.2" />
      <line x1="48" y1="46" x2="48" y2="84" stroke="#0f172a" strokeWidth="1.2" />
      <line x1="68" y1="46" x2="68" y2="84" stroke="#0f172a" strokeWidth="1.2" />
      {/* Latch */}
      <rect x="44" y="42" width="8" height="6" rx="1" fill="#a855f7" />
      {/* Glint */}
      <line x1="22" y1="50" x2="26" y2="50" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Crosshair + dotted target — for "no watchlist" / "set targets" */
export function EmptyTarget({ className, size = 96 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="target-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="34" fill="none" stroke="#334155" strokeWidth="1.2" strokeDasharray="2 4" />
      <circle cx="48" cy="48" r="22" fill="none" stroke="url(#target-ring)" strokeWidth="2" />
      <circle cx="48" cy="48" r="10" fill="none" stroke="url(#target-ring)" strokeWidth="2" />
      {/* Crosshair */}
      <line x1="48" y1="6" x2="48" y2="20" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="76" x2="48" y2="90" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="48" x2="20" y2="48" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="76" y1="48" x2="90" y2="48" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="48" cy="48" r="2.5" fill="#fff" />
    </svg>
  );
}

/** Silent bell with sound waves — for "no alerts" */
export function EmptyBell({ className, size = 96 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bell-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5b948" />
          <stop offset="100%" stopColor="#ec8c0e" />
        </linearGradient>
      </defs>
      {/* Sound rings */}
      <path d="M 22 36 Q 14 48 22 60" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M 74 36 Q 82 48 74 60" stroke="#ec4899" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      {/* Bell body */}
      <path
        d="M 48 14 C 32 14 28 26 28 38 V 56 C 28 60 22 64 22 68 H 74 C 74 64 68 60 68 56 V 38 C 68 26 64 14 48 14 Z"
        fill="url(#bell-body)"
        stroke="#7c2d12"
        strokeWidth="1.2"
      />
      {/* Top stub */}
      <rect x="44" y="8" width="8" height="6" rx="2" fill="#7c2d12" />
      {/* Clapper */}
      <circle cx="48" cy="74" r="4" fill="#7c2d12" />
      {/* Highlight */}
      <path d="M 34 24 Q 38 20 42 22" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

/** Stylised knife silhouette — for "no portfolio yet" / "empty" */
export function EmptyKnife({ className, size = 96 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="blade-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="handle-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Blade */}
      <path
        d="M 12 50 Q 28 32 50 38 Q 60 40 60 46 L 60 54 Q 60 60 50 62 Q 28 68 12 50 Z"
        fill="url(#blade-body)"
        stroke="#475569"
        strokeWidth="1"
      />
      {/* Cutting edge highlight */}
      <path d="M 14 50 Q 30 36 48 42" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.5" />
      {/* Handle */}
      <rect x="60" y="44" width="22" height="12" rx="2" fill="url(#handle-body)" stroke="#581c87" strokeWidth="1" />
      {/* Pommel */}
      <circle cx="84" cy="50" r="3" fill="#ec4899" />
      {/* Bolt details */}
      <circle cx="66" cy="50" r="1" fill="#fff" opacity="0.6" />
      <circle cx="74" cy="50" r="1" fill="#fff" opacity="0.6" />
    </svg>
  );
}

/** Sticker capsule strewn — for "no inventory imported" */
export function EmptyStickers({ className, size = 96 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="s1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="s2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="s3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5b948" />
          <stop offset="100%" stopColor="#ec8c0e" />
        </linearGradient>
      </defs>
      {/* Sticker 3 — back, rotated */}
      <g transform="rotate(-12 32 56)">
        <rect x="14" y="44" width="36" height="24" rx="4" fill="url(#s3)" stroke="#7c2d12" strokeWidth="0.8" />
        <rect x="18" y="48" width="28" height="16" rx="2" fill="#1e293b" opacity="0.3" />
      </g>
      {/* Sticker 2 — middle */}
      <g transform="rotate(8 50 46)">
        <rect x="32" y="34" width="36" height="24" rx="4" fill="url(#s2)" stroke="#064e3b" strokeWidth="0.8" />
        <rect x="36" y="38" width="28" height="16" rx="2" fill="#0f172a" opacity="0.3" />
      </g>
      {/* Sticker 1 — front */}
      <g transform="rotate(-4 62 40)">
        <rect x="48" y="28" width="36" height="24" rx="4" fill="url(#s1)" stroke="#581c87" strokeWidth="0.8" />
        <rect x="52" y="32" width="28" height="16" rx="2" fill="#0f172a" opacity="0.3" />
        <text x="66" y="44" fontFamily="monospace" fontSize="6" fontWeight="700" fill="#fff" textAnchor="middle" opacity="0.8">CS2</text>
      </g>
    </svg>
  );
}
