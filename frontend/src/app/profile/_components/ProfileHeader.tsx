'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { User2, Calendar } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';

type ProfileLite = {
  displayName?: string | null;
  email?: string;
  createdAt?: string;
};

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

  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'lite' ? 'Lite' : 'Free';
  const tierTone =
    tier === 'pro'
      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      : tier === 'lite'
        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        : 'bg-slate-500/15 text-slate-300 border-slate-500/30';

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur p-5 md:p-6 flex items-center gap-4">
      <span
        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg shrink-0"
        aria-hidden="true"
      >
        <User2 className="w-7 h-7 md:w-8 md:h-8" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg md:text-xl font-display font-semibold text-white truncate">
            {displayName}
          </h2>
          <Badge variant="outline" className={tierTone}>
            {tierLabel}
          </Badge>
        </div>
        <div className="text-slate-400 text-sm truncate">{email}</div>
        {memberSince && (
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            Member since {memberSince}
          </div>
        )}
      </div>
    </div>
  );
}
