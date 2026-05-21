"use client";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  step: 1 | 2 | 3;
  onJump?: (step: 1 | 2 | 3) => void;
}

/**
 * Onboarding step indicator.
 * - Thin amber rail + fuchsia/pink fill that grows with progress.
 * - Step labels above. Clicking a completed step jumps back.
 */
export function ProgressBar({ step, onJump }: ProgressBarProps) {
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
  const labels: Record<1 | 2 | 3, string> = {
    1: "Welcome",
    2: "Connect Steam",
    3: "First alert",
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[0.7rem] font-display font-semibold uppercase tracking-[0.2em] text-fuchsia-300/80">
          Step {step} of 3
        </p>
        <p className="text-xs text-slate-400">{labels[step]}</p>
      </div>

      {/* Rail */}
      <div className="relative h-1.5 rounded-full bg-amber-500/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step dots (clickable to jump back) */}
      <div className="mt-3 flex items-center justify-between text-xs">
        {([1, 2, 3] as const).map((n) => {
          const reached = step >= n;
          const clickable = onJump && n < step;
          return (
            <button
              key={n}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump?.(n)}
              className={cn(
                "flex items-center gap-2 transition-colors",
                reached ? "text-slate-200" : "text-slate-400",
                clickable && "hover:text-fuchsia-300 cursor-pointer",
                !clickable && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  reached
                    ? "bg-gradient-to-br from-fuchsia-500 to-pink-500"
                    : "bg-slate-700"
                )}
              />
              <span className="hidden sm:inline">{labels[n]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
