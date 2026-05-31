import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface LegalPageProps {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({ eyebrow, title, lastUpdated, children }: LegalPageProps) {
  return (
    <article>
      <header className="mb-8">
        <p className="text-[0.7rem] font-display font-semibold uppercase tracking-[0.2em] text-purple-300/80 mb-2">
          {eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {lastUpdated}</p>
      </header>

      <div
        role="note"
        className="mb-10 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
      >
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
        <p>
          <strong className="font-semibold">Draft template.</strong> This document is a starting
          point provided for transparency during early access. Review with a qualified lawyer
          before relying on it for production.
        </p>
      </div>

      <div className="text-slate-300 leading-relaxed space-y-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-100 [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-100 [&_h3]:mt-6 [&_h3]:mb-2 [&_a]:text-purple-400 [&_a:hover]:text-purple-300 [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_strong]:text-slate-100">
        {children}
      </div>
    </article>
  );
}
