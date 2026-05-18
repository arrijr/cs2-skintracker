'use client';

import { useState } from 'react';
import { CreditCard, Sparkles, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';

export function BillingTab() {
  const {
    tier,
    isActive,
    renewalDate,
    cancelAtPeriodEnd,
    hasStripeCustomer,
    openPortal,
    checkout,
    isLoading,
  } = useSubscription();

  const [busy, setBusy] = useState<'portal' | 'checkout' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const renewalLabel = renewalDate
    ? new Date(renewalDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const handlePortal = async () => {
    setBusy('portal');
    setErr(null);
    try {
      await openPortal();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't open the billing portal.");
    } finally {
      setBusy(null);
    }
  };

  const handleUpgrade = async () => {
    setBusy('checkout');
    setErr(null);
    try {
      await checkout('pro');
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't start checkout. Try again.");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-slate-400 p-4" role="status" aria-busy="true">
        Loading billing…
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-700/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CreditCard className="w-5 h-5" aria-hidden="true" />
          Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Current plan
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-display font-semibold capitalize text-white">
                {tier}
              </span>
              {isActive && tier !== 'free' && (
                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                  Active
                </Badge>
              )}
              {cancelAtPeriodEnd && (
                <Badge variant="outline" className="text-amber-300 border-amber-500/30">
                  Cancels {renewalLabel ?? 'soon'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {tier !== 'free' && renewalLabel && (
          <div className="text-sm text-slate-400">
            {cancelAtPeriodEnd
              ? `Your subscription ends on ${renewalLabel}.`
              : `Renews on ${renewalLabel}.`}
          </div>
        )}

        {tier === 'free' && (
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
            <div className="flex items-center gap-2 text-purple-300 font-semibold mb-1">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Upgrade to Pro
            </div>
            <p className="text-sm text-slate-300">
              Get full price history, research panels, and CSV export.
            </p>
          </div>
        )}

        <div aria-live="polite" className="min-h-[0]">
          {err && (
            <div
              role="alert"
              className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {err}
            </div>
          )}
        </div>

        {!hasStripeCustomer && tier === 'free' && (
          <p className="text-xs text-slate-400">
            Subscribe first to manage billing through the Stripe Customer Portal.
          </p>
        )}

        <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-slate-700/40">
          {hasStripeCustomer && (
            <Button variant="outline" onClick={handlePortal} disabled={busy !== null}>
              {busy === 'portal' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Opening portal…
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                  Manage subscription
                </>
              )}
            </Button>
          )}
          {tier === 'free' && (
            <Button onClick={handleUpgrade} disabled={busy !== null}>
              {busy === 'checkout' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Redirecting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                  Upgrade to Pro
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
