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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Check } from 'lucide-react';
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
      price: '4,99',
      currency: '€',
      period: '/Monat',
      description: 'Perfect für Content Creator und Sammler',
      features: [
        'Portfolio mit bis zu 100 Skins',
        'Preisgeschichte (90 Tage)',
        'Basis-Analysen',
        'Echtzeit-Preisupdates',
        'Email-Benachrichtigungen'
      ],
      cta: 'Lite wählen',
      color: 'from-amber-400 to-orange-400'
    },
    pro: {
      name: 'Pro',
      price: '19,99',
      currency: '€',
      period: '/Monat',
      description: 'Für professionelle Trader und Analysten',
      features: [
        'Alles aus Lite-Plan',
        'Volatilitätsanalyse (30/90 Tage)',
        'Rarity-Scoring Heuristiken',
        'Preisgeschichte (180 Tage)',
        'CSV-Export',
        'Priority Support',
        'Erweiterte Research-Tools'
      ],
      cta: 'Pro wählen',
      color: 'from-purple-400 to-pink-400'
    }
  };

  const plan = tiers[tier];

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkout(tier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
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

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Upgrade zu {plan.name}
          </DialogTitle>
          <DialogDescription>{plan.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing */}
          <div className={`rounded-lg bg-gradient-to-br ${plan.color} p-6 text-white`}>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-sm opacity-90">{plan.currency}</span>
              <span className="text-sm opacity-90">{plan.period}</span>
            </div>
            <p className="text-sm mt-2 opacity-90">Kündigung jederzeit möglich</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Was ist enthalten:</h3>
            <ul className="space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleCheckout}
            disabled={isLoading || subLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Wird weitergeleitet...' : plan.cta}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Sichere Zahlung durch Stripe. Keine versteckten Gebühren.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
