import { ReactNode, useState } from "react";

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
};

export default function Tooltip({ children, content }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      tabIndex={0}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className="absolute z-20 left-1/2 -translate-x-1/2 top-7 bg-zinc-800 text-xs text-amber-100 px-3 py-1 rounded shadow-lg border border-amber-400 whitespace-nowrap transition-all animate-fade-in">
          {content}
        </span>
      )}
    </span>
  );
}
