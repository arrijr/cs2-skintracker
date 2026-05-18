'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradeModalProps {
  tier?: 'lite' | 'pro';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerText?: string;
}

export default function UpgradeModal({
  tier = 'lite',
  isOpen,
  onOpenChange,
  triggerText = 'Upgrade'
}: UpgradeModalProps) {
  const { checkout, isLoading: subLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tiers = {
    lite: {
      name: 'Lite',
      price: '4.99',
      currency: '€',
      period: '/month',
      description: 'For collectors and content creators',
      features: [
        'Track up to 100 skins',
        '90-day price history',
        'Core analytics',
        'Live price updates',
        'Email notifications',
      ],
      cta: 'Upgrade to Lite',
      color: 'from-amber-500 to-orange-500',
    },
    pro: {
      name: 'Pro',
      price: '19.99',
      currency: '€',
      period: '/month',
      description: 'For professional traders and analysts',
      features: [
        'Everything in Lite',
        'Volatility analysis (30/90 day)',
        'Rarity scoring',
        '180-day price history',
        'CSV export',
        'Priority support',
        'Advanced research tools',
      ],
      cta: 'Upgrade to Pro',
      color: 'from-purple-500 to-pink-500',
    },
  };

  const plan = tiers[tier];

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkout(tier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Crown className="w-4 h-4" />
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-slate-900 border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Upgrade to {plan.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">{plan.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing */}
          <div className={`rounded-lg bg-gradient-to-br ${plan.color} p-6 text-white`}>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-sm opacity-90">{plan.currency}</span>
              <span className="text-sm opacity-90">{plan.period}</span>
            </div>
            <p className="text-sm mt-2 opacity-90">Cancel anytime</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">What's included</h3>
            <ul className="space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleCheckout}
            disabled={isLoading || subLoading}
            className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}
            size="lg"
          >
            {isLoading ? 'Redirecting…' : plan.cta}
          </Button>

          <p className="text-xs text-center text-slate-500">
            Secure payment via Stripe. No hidden fees.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
