'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Sparkles, ExternalLink, AlertTriangle, RefreshCw, Crown, Zap, XCircle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscription } from '@/hooks/useSubscription';
import { analytics } from '@/lib/analytics';
import { apiUrl } from '@/lib/api';

type Tier = 'free' | 'lite' | 'pro';

function TierPill({ tier }: { tier: Tier }) {
  if (tier === 'pro') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pink-300">
        <Crown className="h-3 w-3" />
        Pro
      </span>
    );
  }
  if (tier === 'lite') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
        <Zap className="h-3 w-3" />
        Lite
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
      Free
    </span>
  );
}

export function BillingTab() {
  const {
    subscription,
    tier,
    status,
    cycle,
    isActive,
    renewalDate,
    cancelAtPeriodEnd,
    hasStripeCustomer,
    openPortal,
    checkout,
    cancel,
    reactivate,
    isLoading,
  } = useSubscription();
  const { getToken } = useAuth();

  const [busy, setBusy] = useState<'portal' | 'checkout' | 'cancel' | 'reactivate' | 'export' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const stripeSubId = subscription?.stripeSubId ?? null;

  // German locale per user profile. Intl.DateTimeFormat avoids re-instantiating
  // the formatter on every render (locale + options are stable).
  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const renewalLabel = renewalDate ? dateFormatter.format(new Date(renewalDate)) : null;

  const cycleLabel =
    cycle === 'annual' ? 'Jährlich' : cycle === 'monthly' ? 'Monatlich' : null;

  // Status pill copy — kept short, color-coded. Past-due gets amber to nudge
  // the user toward the Customer Portal without being alarmist.
  const statusPill = (() => {
    if (status === 'past_due') {
      return {
        label: 'Past due',
        className:
          'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      };
    }
    if (status === 'canceled') {
      return {
        label: 'Canceled',
        className: 'bg-slate-700/40 text-slate-300 border border-slate-600/40',
      };
    }
    if (status === 'incomplete' || status === 'pending') {
      return {
        label: 'Incomplete',
        className: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      };
    }
    if (isActive) {
      return {
        label: 'Active',
        className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      };
    }
    return null;
  })();

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

  const handleCancel = async () => {
    setBusy('cancel');
    setErr(null);
    try {
      await cancel();
      setShowCancel(false);
      setNotice('Subscription set to cancel at period end.');
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't cancel subscription. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleReactivate = async () => {
    setBusy('reactivate');
    setErr(null);
    try {
      await reactivate();
      setNotice('Subscription reactivated.');
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't reactivate. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleExportCsv = async () => {
    setBusy('export');
    setErr(null);
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        apiUrl('/api/v1/portfolio/export?format=csv'),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          // CSV success path won't be JSON
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      analytics.track({ name: 'csv_export_used' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't export portfolio. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const csvExportReady = true;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="h-6 w-32 rounded bg-slate-800/60 animate-pulse mb-4" />
        <div className="h-32 rounded bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-white">Current plan</h3>
          <TierPill tier={tier as Tier} />
        </div>
        <div className="mt-4 border-t border-slate-800" />

        {tier !== 'free' ? (
          <>
            <dl className="mt-5 space-y-3 text-sm">
              {cycleLabel && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Cycle</dt>
                  <dd className="text-slate-200 font-medium">{cycleLabel}</dd>
                </div>
              )}
              {renewalLabel && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">
                    {cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}
                  </dt>
                  <dd className="text-slate-200 font-medium tabular-nums">
                    {renewalLabel}
                  </dd>
                </div>
              )}
              {statusPill && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Status</dt>
                  <dd>
                    <Badge className={statusPill.className}>
                      {statusPill.label}
                    </Badge>
                  </dd>
                </div>
              )}
            </dl>

            {cancelAtPeriodEnd && renewalLabel && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Your subscription will end on{' '}
                  <span className="font-medium text-amber-100">{renewalLabel}</span>.
                  Reactivate to continue.
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="mt-5 relative overflow-hidden rounded-xl border border-pink-500/30 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-pink-500/10 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">Free plan</div>
                <p className="mt-1 text-sm text-slate-300">
                  Upgrade to Pro for full price history, research panels, CSV export,
                  and unlimited alerts.
                </p>
              </div>
            </div>
          </div>
        )}

        <div aria-live="polite" className="mt-5 min-h-[0] space-y-2">
          {err && (
            <div
              role="alert"
              className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {err}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="p-3 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              {notice}
            </div>
          )}
        </div>

        {!hasStripeCustomer && tier === 'free' && (
          <p className="mt-4 text-xs text-slate-400">
            Subscribe first to manage billing through the Stripe Customer Portal.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3 justify-end pt-4 border-t border-slate-800">
          {tier !== 'free' && stripeSubId && !cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={() => setShowCancel(true)}
              disabled={busy !== null}
              className="border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40"
            >
              <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
              Cancel subscription
            </Button>
          )}
          {cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={handleReactivate}
              disabled={busy !== null}
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
            >
              {busy === 'reactivate' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Reactivating…
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Reactivate
                </>
              )}
            </Button>
          )}
          {hasStripeCustomer && (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={busy !== null}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
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
            <Button
              onClick={handleUpgrade}
              disabled={busy !== null}
              className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white"
            >
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
      </div>

      {/* Data export (Pro) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 border border-slate-800">
            <FileDown className="h-5 w-5 text-fuchsia-300" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white">Export portfolio</h3>
              {tier !== 'pro' && (
                <Badge variant="outline" className="border-pink-500/40 text-pink-300 bg-pink-500/10 text-xs">
                  Available on Pro
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Download your full portfolio as a CSV — perfect for spreadsheets and accounting.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end pt-4 border-t border-slate-800">
          {tier === 'pro' ? (
            <Button
              disabled={!csvExportReady || busy !== null}
              className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleExportCsv}
            >
              {busy === 'export' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Exporting…
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" aria-hidden="true" />
                  Export as CSV
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={busy !== null}
              className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>

      {/* Cancel confirmation */}
      <Dialog open={showCancel} onOpenChange={(o) => !busy && setShowCancel(o)}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-400" aria-hidden="true" />
              Cancel subscription?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Your plan stays active until{' '}
              <span className="text-slate-200 font-medium">
                {renewalLabel ?? 'the end of the current period'}
              </span>
              . After that, your account drops to the Free tier — research panels,
              CSV export and unlimited alerts will no longer be available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancel(false)}
              disabled={busy === 'cancel'}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              Keep subscription
            </Button>
            <Button
              onClick={handleCancel}
              disabled={busy === 'cancel'}
              className="bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              {busy === 'cancel' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Cancelling…
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                  Confirm cancel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
