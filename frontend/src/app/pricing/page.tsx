'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { analytics } from '@/lib/analytics';

type BillingCycle = 'monthly' | 'annual';

interface Plan {
  id: 'free' | 'lite' | 'pro';
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  pricePerMonthAnnual: string;
  savings: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  ctaLabel: string;
  gradient: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: '€0',
    priceAnnual: '€0',
    pricePerMonthAnnual: '€0',
    savings: '',
    period: 'forever',
    description: 'Perfect to get started',
    features: [
      'Up to 5 skins in watchlist',
      '2 price alerts',
      'Basic portfolio tracking',
      'Live price updates',
      'Community support',
    ],
    highlight: false,
    ctaLabel: 'Start free',
    gradient: 'from-slate-600 to-slate-700',
  },
  {
    id: 'lite',
    name: 'Lite',
    priceMonthly: '€6.99',
    priceAnnual: '€67',
    pricePerMonthAnnual: '€5.58',
    savings: 'Save €17/year',
    period: 'per month',
    description: 'For collectors & content creators',
    features: [
      'Unlimited watchlist',
      '15 price alerts',
      '120-day price history',
      'Advanced analytics',
      'Email + in-app notifications',
      'Portfolio overview with KPIs',
    ],
    highlight: false,
    ctaLabel: 'Upgrade to Lite',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: '€9.99',
    priceAnnual: '€96',
    pricePerMonthAnnual: '€8.00',
    savings: 'Save €24/year',
    period: 'per month',
    description: 'For professional traders',
    features: [
      'Everything in Lite',
      'Unlimited price alerts',
      'Volatility analysis (7d/30d/90d)',
      'Rarity scoring & research tools',
      'Full price history',
      'CSV export',
      'Priority support',
      'Multi-source pricing (Skinport + CSFloat — coming Sprint 2)',
    ],
    highlight: true,
    ctaLabel: 'Upgrade to Pro',
    gradient: 'from-fuchsia-500 to-pink-500',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { checkout, tier: currentTier } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  useEffect(() => {
    analytics.track({ name: 'pricing_page_viewed' });
  }, []);

  const handleSelect = async (planId: 'free' | 'lite' | 'pro') => {
    if (planId === 'free') {
      router.push(isSignedIn ? '/dashboard' : '/sign-up');
      return;
    }

    if (!isSignedIn) {
      router.push(`/sign-up?plan=${planId}&billing=${billingCycle}`);
      return;
    }

    setLoadingTier(planId);
    try {
      await checkout(planId, billingCycle);
    } catch (err) {
      console.error('Checkout failed:', err);
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10">
            Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Choose your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">
              trading plan
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Start free and upgrade whenever you want. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex justify-center mb-12">
          <div
            role="group"
            aria-label="Billing cycle"
            className="relative inline-flex items-center rounded-full border border-slate-800 bg-slate-900/50 p-1"
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              aria-pressed={billingCycle === 'monthly'}
              className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-slate-100 text-slate-900 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              aria-pressed={billingCycle === 'annual'}
              className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-slate-100 text-slate-900 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Annual
              <span
                className={`text-[10px] font-bold leading-none px-1.5 py-0.5 rounded-full ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const isLoading = loadingTier === plan.id;
            const isFree = plan.id === 'free';
            const isAnnual = billingCycle === 'annual' && !isFree;

            const displayPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const displayPeriod = isFree
              ? plan.period
              : isAnnual
              ? 'per year'
              : 'per month';

            return (
              <Card
                key={plan.id}
                className={`relative bg-slate-900/50 backdrop-blur border rounded-2xl transition-all duration-300 ${
                  plan.highlight
                    ? 'border-fuchsia-500/50 shadow-2xl shadow-fuchsia-500/20 lg:scale-105'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-2 min-h-[88px] flex flex-col items-center justify-center">
                    <div className="flex items-baseline justify-center transition-all duration-200">
                      <span className="text-5xl font-bold text-white">{displayPrice}</span>
                      <span className="text-slate-400 ml-1">/{displayPeriod}</span>
                    </div>
                    {isAnnual && (
                      <>
                        <span className="text-sm text-slate-400 mt-1">
                          ≈ {plan.pricePerMonthAnnual}/mo
                        </span>
                        {plan.savings && (
                          <Badge
                            variant="outline"
                            className="mt-2 border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                          >
                            {plan.savings}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-slate-300">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-400" />
                        </div>
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelect(plan.id)}
                    disabled={isLoading || isCurrent}
                    className={`w-full py-6 text-base font-semibold ${
                      plan.id === 'free'
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : plan.id === 'lite'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white'
                    }`}
                  >
                    {isLoading ? (
                      'Loading...'
                    ) : isCurrent ? (
                      'Your current plan'
                    ) : (
                      <>
                        {plan.id === 'pro' && <Crown className="mr-2 h-5 w-5" />}
                        {plan.ctaLabel}
                        {plan.highlight && <Zap className="ml-2 h-5 w-5" />}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span>No hidden fees</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. You can cancel your subscription anytime in your account settings. The cancellation takes effect at the end of the current billing period.',
              },
              {
                q: 'What happens to my data if I downgrade?',
                a: 'Your portfolio data is preserved. You only lose access to premium features like research tools and CSV export.',
              },
              {
                q: 'Which payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, Amex) and SEPA direct debit via Stripe.',
              },
              {
                q: 'Is there a free trial?',
                a: 'The Free tier is unlimited and forever free. Lite and Pro do not currently offer a trial, but you can cancel anytime.',
              },
            ].map((item) => (
              <Card key={item.q} className="bg-slate-900/50 border border-slate-800 rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.q}</h3>
                  <p className="text-slate-300">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
