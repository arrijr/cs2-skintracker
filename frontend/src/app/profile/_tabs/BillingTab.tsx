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
      setErr(e instanceof Error ? e.message : 'Could not open portal');
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
      setErr(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <div className="text-zinc-400 p-4">Loading…</div>;

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-wide">Current plan</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold capitalize">{tier}</span>
              {isActive && tier !== 'free' && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              )}
              {cancelAtPeriodEnd && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                  Cancels {renewalLabel ?? 'soon'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {tier !== 'free' && renewalLabel && (
          <div className="text-sm text-zinc-400">
            {cancelAtPeriodEnd
              ? `Your subscription ends on ${renewalLabel}.`
              : `Renews on ${renewalLabel}.`}
          </div>
        )}

        {tier === 'free' && (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 text-blue-300 font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
            </div>
            <p className="text-sm text-zinc-300">
              Unlock research panels, full price history, and CSV export.
            </p>
          </div>
        )}

        {err && (
          <div className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {err}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {tier === 'free' && (
            <Button onClick={handleUpgrade} disabled={busy !== null} className="btn-enhanced">
              {busy === 'checkout' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </>
              )}
            </Button>
          )}
          {hasStripeCustomer && (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={busy !== null}
              className="btn-enhanced"
            >
              {busy === 'portal' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Opening portal…
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage subscription
                </>
              )}
            </Button>
          )}
        </div>

        {!hasStripeCustomer && tier === 'free' && (
          <p className="text-xs text-zinc-500">
            Subscribe first to manage billing through the Stripe Customer Portal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
