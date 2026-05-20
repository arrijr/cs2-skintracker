import type { ReactNode } from 'react';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.15),transparent_70%)]"
      />
      <div className="relative container mx-auto px-4 py-10 md:py-12 max-w-3xl">
        {children}
      </div>
    </div>
  );
}
