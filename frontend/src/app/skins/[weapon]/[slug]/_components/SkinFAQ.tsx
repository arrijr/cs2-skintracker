import type { SkinDetail } from '@/lib/skins-server';

interface Props {
  skin: SkinDetail;
}

/**
 * Per-skin FAQ block with 5 high-intent questions that double as
 * FAQPage structured data. The Q&A copy is programmatic — every skin
 * gets the same 5 questions but with skin-specific answers pulled from
 * the catalog row.
 */
export function SkinFAQ({ skin }: Props) {
  const price = skin.priceLatest ?? skin.priceMedian ?? null;
  const sold30d = skin.sold30d ?? null;
  const min = skin.priceMin ?? null;
  const max = skin.priceMax ?? null;

  const qa = [
    {
      q: `How much does ${skin.marketHashName} cost?`,
      a: price != null
        ? `As of today, ${skin.marketHashName} trades at about $${price.toFixed(2)} on the Steam Community Market. We also pull live prices from Skinport and CSFloat — see the multi-market table above for the cheapest current ask.`
        : `Current pricing for ${skin.marketHashName} is being refreshed. Check back shortly or set a price alert above to be notified when it sells.`,
    },
    {
      q: `Is ${skin.marketHashName} a good investment?`,
      a: sold30d && sold30d > 50
        ? `${skin.marketHashName} sees ~${sold30d} sales per month, indicating active liquidity. ${min && max ? `Over the last 90 days the price has ranged from $${min.toFixed(2)} to $${max.toFixed(2)} — check the chart for the trend.` : ''} CS2 skins are not regulated assets — only invest what you can afford to lose.`
        : `Liquidity for ${skin.marketHashName} is currently moderate. Lower-volume skins can offer better entry points but are harder to exit. Always check 30-day sales volume before buying.`,
    },
    {
      q: `What's the difference between wear conditions?`,
      a: `Each ${skin.weaponType ?? 'weapon'} skin in CS2 ships in five wear tiers: Factory New (cleanest), Minimal Wear, Field-Tested, Well-Worn, and Battle-Scarred (most worn). The wear table below this FAQ shows current prices for every available wear of ${skin.marketHashName.split(' (')[0]}.`,
    },
    {
      q: `Where is ${skin.marketHashName} cheapest right now?`,
      a: `Our multi-market panel polls Steam Community Market, Skinport, and CSFloat every few hours. The lowest live ask is highlighted at the top of the panel. Note that Steam Market prices include the 13% transaction fee, while Skinport and CSFloat are net.`,
    },
    {
      q: `Can I get notified when ${skin.marketHashName} hits a target price?`,
      a: `Yes — set a free price-threshold alert via the Bell icon above the chart. Free accounts get 2 active alerts; Lite (€6.99/mo) gets 15; Pro (€9.99/mo) is unlimited and adds volatility-based alerts.`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
      <div className="space-y-4">
        {qa.map(({ q, a }, i) => (
          <details key={i} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <summary className="font-semibold cursor-pointer text-slate-100">{q}</summary>
            <p className="mt-3 text-slate-300 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </section>
  );
}
