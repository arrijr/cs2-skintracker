"use client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number; // in seconds; e.g. 0.1 = 100ms
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

const directionClass = {
  up: "animate-slide-up",
  down: "animate-slide-in-down",
  left: "animate-slide-in-left",
  right: "animate-slide-in-right",
  none: "animate-fade-in",
} as const;

/**
 * Standard entrance animation wrapper. Use this instead of inline animate-* + animationDelay style.
 *
 * @example
 *   <FadeIn delay={0.1} direction="up">
 *     <h1>Welcome</h1>
 *   </FadeIn>
 */
export function FadeIn({ children, delay = 0, direction = "none", className }: FadeInProps) {
  const style = delay > 0 ? { animationDelay: `${delay}s` } : undefined;
  return (
    <div className={cn(directionClass[direction], className)} style={style}>
      {children}
    </div>
  );
}
