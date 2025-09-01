{/* Chart Range Tabs */}
"use client";
export type Range = "7d"|"30d"|"90d";
export default function ChartRangeTabs({ value, onChange }:{
  value: Range; onChange: (r:Range)=>void;
}) {
  const items: Range[] = ["7d", "30d", "90d"];
  return (
    <div className="flex gap-2 text-xs">
      {items.map(r => (
        <button key={r}
          onClick={()=>onChange(r)}
          className={`px-2 py-1 rounded border ${value===r ? "border-white/30 bg-white/5" : "border-white/10 hover:bg-white/5"}`}>
          {r.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
