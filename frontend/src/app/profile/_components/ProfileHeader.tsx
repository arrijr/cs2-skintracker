'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Calendar, Crown, Zap } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';

type ProfileLite = {
  displayName?: string | null;
  email?: string;
  createdAt?: string;
};

import { useSubscription } from '@/hooks/useSubscription';

export function ProfileHeader() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { tier } = useSubscription();
  const [profile, setProfile] = useState<ProfileLite | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      try {
        const token = await getToken({ template: 'backend' });
        if (!token) return;
        const data = await fetchJson(apiUrl('/api/v1/users/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile({
          displayName: data.displayName,
          email: data.email,
          createdAt: data.createdAt,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('401')) console.error('ProfileHeader load failed:', err);
      }
    })();
  }, [isLoaded, user, getToken]);

  const displayName = profile?.displayName || user?.firstName || 'User';
  const email = profile?.email || user?.primaryEmailAddress?.emailAddress || '';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
        })
      : null;

  const initials = (() => {
    const first = user?.firstName || displayName;
    const last = user?.lastName || '';
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first[0]?.toUpperCase() ?? 'U';
    return email[0]?.toUpperCase() ?? 'U';
  })();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 md:p-6 flex items-center gap-4">
      <span
        className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-display font-bold text-xl md:text-2xl shadow-lg shrink-0"
        aria-hidden="true"
      >
        {initials}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg md:text-xl font-display font-semibold text-white truncate">
            {displayName}
          </h2>
          <TierPill tier={(tier as 'free' | 'lite' | 'pro') ?? 'free'} />
        </div>
        <div className="text-slate-400 text-sm truncate">{email}</div>
        {memberSince && (
          <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            Member since {memberSince}
          </div>
        )}
      </div>
    </div>
  );
}

function TierPill({ tier }: { tier: 'free' | 'lite' | 'pro' }) {
  if (tier === 'pro') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-pink-300">
        <Crown className="h-3 w-3" />
        Pro
      </span>
    );
  }
  if (tier === 'lite') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
        <Zap className="h-3 w-3" />
        Lite
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
      Free
    </span>
  );
}
