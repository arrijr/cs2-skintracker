import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: "3xl" | "5xl" | "7xl" | "full";
  className?: string;
}

const widthMap = {
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
} as const;

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  maxWidth = "7xl",
  className,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Atmospheric backdrop — subtle radial behind header, never overpowering */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.15),transparent_70%)]"
      />
      <div className={cn("relative container mx-auto px-4 py-10 md:py-12", widthMap[maxWidth], className)}>
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            {eyebrow && (
              <p className="text-[0.7rem] font-display font-semibold uppercase tracking-[0.2em] text-purple-300/80 mb-2">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-slate-400 max-w-2xl">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-2 items-center">{actions}</div>}
        </header>
        {children}
      </div>
    </div>
  );
}
