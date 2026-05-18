// /frontend/src/components/Logo.tsx — [Frontend]
// Brand mark: conic-gradient square with inset transparency, paired with wordmark.
// Adapted from claude.ai/design dashboard-hifi.html .brand-mark style.
"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  /** Disable the Link wrapper (use inside other links). */
  asStatic?: boolean;
}

const MARK_SIZE = { sm: 24, md: 32, lg: 44 } as const;
const TEXT_SIZE = { sm: "text-sm", md: "text-[15px]", lg: "text-lg" } as const;

export default function Logo({
  className,
  showText = true,
  size = "md",
  asStatic = false,
}: LogoProps) {
  const px = MARK_SIZE[size];
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={px} />
      {showText && (
        <span
          className={cn(
            "font-display font-bold tracking-[0.04em] text-white whitespace-nowrap",
            TEXT_SIZE[size]
          )}
        >
          SKIN<span className="text-slate-400">TRACKR</span>
        </span>
      )}
    </span>
  );

  if (asStatic) return inner;
  return (
    <Link href="/" className="inline-flex items-center" aria-label="skintrackr — Home">
      {inner}
    </Link>
  );
}

/** Standalone conic-gradient mark, usable in nav, og images, favicons, etc. */
export function BrandMark({ size = 32 }: { size?: number }) {
  // Computed sizes: inner cutout at ~12.5% of size, gradient core at ~28% of size.
  const cutout = Math.round(size * 0.125);
  const inner = Math.round(size * 0.28);
  return (
    <span
      className="relative flex-shrink-0 rounded-[26%] overflow-hidden"
      style={{
        width: size,
        height: size,
        background: "conic-gradient(from 220deg, #a855f7, #ec4899, #f5b948, #a855f7)",
      }}
      aria-hidden="true"
    >
      {/* Center cutout — gives the "ring" silhouette */}
      <span
        className="absolute bg-slate-950 rounded-[22%]"
        style={{ inset: cutout }}
      />
      {/* Inner brand-color square */}
      <span
        className="absolute rounded-[18%]"
        style={{
          inset: inner,
          background: "linear-gradient(135deg, #a855f7, #ec4899)",
        }}
      />
    </span>
  );
}
