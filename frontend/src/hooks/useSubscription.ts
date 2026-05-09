/**
 * useSubscription Hook
 * Manages subscription status and tier gating
 */

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';

interface Subscription {
  id: number;
  tier: 'free' | 'creator' | 'pro';
  status: 'active' | 'inactive' | 'canceled' | 'pending';
  stripeSubId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  canCreatePortfolio: boolean;
  canAccessResearch: boolean;
  canExportCSV: boolean;
}

export function useSubscription() {
  const { isSignedIn, getToken } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setSubscription({
        id: 0,
        tier: 'free',
        status: 'inactive',
        canCreatePortfolio: true,
        canAccessResearch: false,
        canExportCSV: false
      });
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/status`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setSubscription(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
        // Fallback to free tier
        setSubscription({
          id: 0,
          tier: 'free',
          status: 'inactive',
          canCreatePortfolio: true,
          canAccessResearch: false,
          canExportCSV: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [isSignedIn, getToken]);

  const checkout = async (tier: 'creator' | 'pro') => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tier })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const { sessionId, url } = await res.json();

      // Use Stripe.js redirectToCheckout (avoids apiKey issues with direct URL)
      if (sessionId && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId });
          if (error) throw new Error(error.message);
          return;
        }
      }

      // Fallback: direct URL redirect
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      throw err;
    }
  };

  const cancel = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Refetch subscription
      setSubscription(null);
      setIsLoading(true);
    } catch (err) {
      console.error('Cancellation failed:', err);
      throw err;
    }
  };

  return {
    subscription,
    isLoading,
    error,
    tier: subscription?.tier || 'free',
    isActive: subscription?.status === 'active',
    canAccessResearch: subscription?.canAccessResearch || false,
    checkout,
    cancel
  };
}
