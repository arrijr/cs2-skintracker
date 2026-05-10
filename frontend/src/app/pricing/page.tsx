'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface Plan {
  id: 'free' | 'lite' | 'pro';
  name: string;
  price: string;
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
    price: '€0',
    period: 'forever',
    description: 'Perfect to get started',
    features: [
      'Up to 5 skins in watchlist',
      '1 price alert',
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
    price: '€4.99',
    period: 'per month',
    description: 'For collectors & content creators',
    features: [
      'Unlimited watchlist',
      '5 price alerts',
      '90-day price history',
      'Advanced analytics',
      'Email notifications',
      'Portfolio overview with KPIs',
    ],
    highlight: false,
    ctaLabel: 'Choose Lite',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€19.99',
    period: 'per month',
    description: 'For professional traders',
    features: [
      'Everything in Lite',
      'Unlimited price alerts',
      'Volatility analysis (7d/30d/90d)',
      'Rarity scoring & research tools',
      '180-day price history',
      'CSV export',
      'Priority support',
      'API access (coming soon)',
    ],
    highlight: true,
    ctaLabel: 'Choose Pro',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { checkout, tier: currentTier } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSelect = async (planId: 'free' | 'lite' | 'pro') => {
    if (planId === 'free') {
      router.push(isSignedIn ? '/dashboard' : '/sign-up');
      return;
    }

    if (!isSignedIn) {
      router.push(`/sign-up?plan=${planId}`);
      return;
    }

    setLoadingTier(planId);
    try {
      await checkout(planId);
    } catch (err) {
      console.error('Checkout failed:', err);
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-purple-500/30 text-purple-400 bg-purple-500/10">
            Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Choose your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              trading plan
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Start free and upgrade whenever you want. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const isLoading = loadingTier === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative bg-slate-900/60 backdrop-blur border transition-all duration-300 ${
                  plan.highlight
                    ? 'border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105'
                    : 'border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most popular
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
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400 ml-1">/{plan.period}</span>
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
                        : `bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white`
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
              <Card key={item.q} className="bg-slate-900/40 border-slate-700/50">
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
