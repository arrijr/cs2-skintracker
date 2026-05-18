"use client";
import { rarityToken } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Vertical color bar for skin list items — CS2-native visual cue.
 * Place at left edge of a flex row to color-code by rarity at a glance.
 */
export function RarityBar({ rarity, className }: { rarity?: string | null; className?: string }) {
  const t = rarityToken(rarity);
  return (
    <span
      className={cn("inline-block w-[3px] self-stretch rounded-full", className)}
      style={{ backgroundColor: t.hex }}
      aria-label={rarity ? `${rarity} rarity` : undefined}
    />
  );
}

/**
 * Inline pill badge for rarity. Use sparingly — best on detail pages.
 */
export function RarityBadge({ rarity, className }: { rarity?: string | null; className?: string }) {
  if (!rarity) return null;
  const t = rarityToken(rarity);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold uppercase tracking-wider border",
        t.text,
        t.bg,
        t.border,
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: t.hex }}
        aria-hidden="true"
      />
      {rarity}
    </span>
  );
}
