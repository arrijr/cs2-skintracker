"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FlashValueProps {
  /** The numeric value to watch for changes. */
  value: number;
  /** Rendered content (typically the formatted number string). */
  children: React.ReactNode;
  /** Animation duration in ms. Default 600. */
  durationMs?: number;
  className?: string;
}

/**
 * Flashes a green/red background tint when `value` changes — Bloomberg/Robinhood style.
 * Does NOT flash on first render. Compares against the previous value via ref.
 */
export function FlashValue({ value, children, durationMs = 600, className }: FlashValueProps) {
  const prev = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = value;
      return;
    }
    if (value > prev.current) setFlash("up");
    else if (value < prev.current) setFlash("down");
    prev.current = value;

    const t = setTimeout(() => setFlash(null), durationMs);
    return () => clearTimeout(t);
  }, [value, durationMs]);

  return (
    <span
      className={cn(
        "relative inline-block rounded-md px-1 transition-colors duration-500",
        flash === "up" && "bg-green-500/20 text-green-100",
        flash === "down" && "bg-red-500/20 text-red-100",
        className
      )}
      style={flash ? { transitionDuration: `${durationMs}ms` } : undefined}
    >
      {children}
    </span>
  );
}
