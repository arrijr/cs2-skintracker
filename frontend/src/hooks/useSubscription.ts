/**
 * useSubscription Hook
 * Manages subscription status and tier gating
 */

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';

export interface Subscription {
  id: number;
  tier: 'free' | 'lite' | 'pro';
  status: 'active' | 'inactive' | 'canceled' | 'pending';
  stripeSubId?: string | null;
  stripeCustomerId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  renewalDate?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  canCreatePortfolio: boolean;
  canAccessResearch: boolean;
  canExportCSV: boolean;
}

const FREE_FALLBACK: Subscription = {
  id: 0,
  tier: 'free',
  status: 'inactive',
  stripeSubId: null,
  stripeCustomerId: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  renewalDate: null,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  canCreatePortfolio: true,
  canAccessResearch: false,
  canExportCSV: false,
};

export function useSubscription() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!isSignedIn) {
      setSubscription(FREE_FALLBACK);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSubscription(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
      setSubscription(FREE_FALLBACK);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const checkout = async (
    tier: 'lite' | 'pro',
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ) => {
    // Centralized error UX: any failure between auth, POST, JSON, or missing
    // URL surfaces as a sonner toast so the click is never silent. Errors
    // are still re-thrown so callers can clear loading state.
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tier, billingCycle }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      if (!url) throw new Error('No checkout URL returned');
      analytics.track({
        name: 'checkout_started',
        properties: { tier, billing: billingCycle },
      });
      window.location.href = url;
    } catch (err) {
      console.error('Checkout failed:', err);
      toast.error('Could not start checkout. Please contact support.');
      throw err;
    }
  };

  const cancel = async () => {
    const token = await getToken({ template: 'backend' });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/cancel`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    analytics.track({ name: 'subscription_canceled' });
    await fetchSubscription();
  };

  const reactivate = async () => {
    const token = await getToken({ template: 'backend' });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/reactivate`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) msg = body.error;
      } catch {
        // ignore parse failures
      }
      throw new Error(msg);
    }
    analytics.track({ name: 'subscription_reactivated' });
    await fetchSubscription();
  };

  const openPortal = async () => {
    const token = await getToken({ template: 'backend' });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/portal`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { url } = await res.json();
    if (!url) throw new Error('No portal URL returned');
    window.location.href = url;
  };

  return {
    subscription,
    isLoading,
    error,
    tier: subscription?.tier || 'free',
    isActive: subscription?.status === 'active',
    canAccessResearch: subscription?.canAccessResearch || false,
    renewalDate: subscription?.renewalDate ?? subscription?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    hasStripeCustomer: !!subscription?.stripeCustomerId,
    refresh: fetchSubscription,
    checkout,
    cancel,
    reactivate,
    openPortal,
  };
}
