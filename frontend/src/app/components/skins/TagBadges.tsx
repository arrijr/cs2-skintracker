{/* Skin Tag Badges */}
export default function TagBadges({ isStattrak, isSouvenir, isStar }:{
  isStattrak?: boolean; isSouvenir?: boolean; isStar?: boolean;
}) {
  const Tag = ({t,c}:{t:string;c:string})=>(
    <span className={`text-[10px] px-2 py-0.5 rounded border ${c}`}>{t}</span>
  );
  return (
    <div className="flex gap-2">
      {isStar && <Tag t="★" c="border-yellow-500/40 text-yellow-400" />}
      {isStattrak && <Tag t="StatTrak" c="border-orange-500/40 text-orange-400" />}
      {isSouvenir && <Tag t="Souvenir" c="border-emerald-500/40 text-emerald-400" />}
    </div>
  );
}
