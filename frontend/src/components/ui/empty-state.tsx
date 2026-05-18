"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** lucide icon — used if no `illustration` provided */
  icon?: LucideIcon;
  /** Custom SVG illustration. Renders larger than lucide icon. */
  illustration?: ReactNode;
  title: string;
  description?: string;
  primaryCta?: { label: string; href?: string; onClick?: () => void; icon?: LucideIcon };
  secondaryCta?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  primaryCta,
  secondaryCta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 backdrop-blur",
        "px-6 py-12 md:py-16 text-center flex flex-col items-center",
        className
      )}
    >
      {illustration ? (
        <div className="mb-5 flex items-center justify-center">{illustration}</div>
      ) : (
        Icon && (
          <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/20">
            <Icon className="h-6 w-6 text-purple-300" />
          </div>
        )
      )}
      <h3 className="font-display text-lg md:text-xl font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      )}
      {(primaryCta || secondaryCta) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {primaryCta && (
            primaryCta.href ? (
              <Button
                asChild
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
              >
                <Link href={primaryCta.href}>
                  {primaryCta.icon && <primaryCta.icon className="h-4 w-4" />}
                  {primaryCta.label}
                </Link>
              </Button>
            ) : (
              <Button
                onClick={primaryCta.onClick}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
              >
                {primaryCta.icon && <primaryCta.icon className="h-4 w-4" />}
                {primaryCta.label}
              </Button>
            )
          )}
          {secondaryCta && (
            secondaryCta.href ? (
              <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900/50">
                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            ) : (
              <Button onClick={secondaryCta.onClick} variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900/50">
                {secondaryCta.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
