"use client";
{/* Tiny Tooltip (no lib) */}
import { useState } from "react";
export function Tip({ label, children }:{label:string;children:React.ReactNode}) {
  const [open,setOpen]=useState(false);
  return (
    <span className="relative"
      onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      {children}
      {open && <span className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-black/80 border border-white/10 px-2 py-1 rounded">
        {label}
      </span>}
    </span>
  );
}
