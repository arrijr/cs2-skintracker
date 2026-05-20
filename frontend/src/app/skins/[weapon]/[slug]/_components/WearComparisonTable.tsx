import Link from 'next/link';

interface WearRow {
  wear: string;
  slug: string | null;
  priceLatest: number | null;
}

async function fetchVariants(baseId: number): Promise<WearRow[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const res = await fetch(`${apiBase}/api/v1/skins/by-id/${baseId}/variants`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return res.json();
}

const WEARS = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];

export async function WearComparisonTable({
  weaponSlug,
  baseId,
}: {
  weaponSlug: string;
  baseId: number;
}) {
  const variants = await fetchVariants(baseId);
  if (variants.length <= 1) return null;

  const byWear = new Map(variants.map((v) => [v.wear, v]));

  return (
    <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold mb-4">Compare wear conditions</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left border-b border-slate-800">
            <th className="pb-2">Wear</th>
            <th className="pb-2 text-right">Current price</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {WEARS.map((w) => {
            const v = byWear.get(w);
            return (
              <tr key={w} className="border-b border-slate-800/50 last:border-0">
                <td className="py-3">{w}</td>
                <td className="py-3 text-right text-slate-200">
                  {v?.priceLatest != null ? `$${v.priceLatest.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 text-right">
                  {v?.slug ? (
                    <Link
                      href={`/skins/${weaponSlug}/${v.slug}`}
                      className="text-fuchsia-400 hover:text-fuchsia-300 text-xs"
                    >
                      View →
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
