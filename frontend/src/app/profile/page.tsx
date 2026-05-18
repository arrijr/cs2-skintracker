'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { TabNav, type TabId } from './_components/TabNav';
import { ProfileHeader } from './_components/ProfileHeader';
import { AccountTab } from './_tabs/AccountTab';
import { BillingTab } from './_tabs/BillingTab';
import { NotificationsTab } from './_tabs/NotificationsTab';
import { SecurityTab } from './_tabs/SecurityTab';

const VALID_TABS: TabId[] = ['account', 'billing', 'notifications', 'security'];

function ProfilePageInner() {
  const { user, isLoaded } = useUser();
  useRequireAuth();

  const params = useSearchParams();
  const raw = params?.get('tab') ?? '';
  const active: TabId = (VALID_TABS as string[]).includes(raw) ? (raw as TabId) : 'account';

  if (!isLoaded || !user) {
    return <div className="text-white p-6">Loading…</div>;
  }

  return (
    <div className="dashboard-bg text-white">
      <div className="container-cs2 section-cs2 relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Profile</h1>
            <p className="text-zinc-400 text-sm">
              Manage your account, subscription, and preferences.
            </p>
          </div>

          {/* Overview header */}
          <ProfileHeader />

          {/* Tabs */}
          <TabNav active={active} />

          {active === 'account' && <AccountTab />}
          {active === 'billing' && <BillingTab />}
          {active === 'notifications' && <NotificationsTab />}
          {active === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-white p-6">Loading…</div>}>
      <ProfilePageInner />
    </Suspense>
  );
}
