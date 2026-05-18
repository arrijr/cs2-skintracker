'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Settings, CreditCard, Bell, Shield } from 'lucide-react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileHeader } from './_components/ProfileHeader';
import { AccountTab } from './_tabs/AccountTab';
import { BillingTab } from './_tabs/BillingTab';
import { NotificationsTab } from './_tabs/NotificationsTab';
import { SecurityTab } from './_tabs/SecurityTab';

type TabId = 'account' | 'billing' | 'notifications' | 'security';
const VALID_TABS: TabId[] = ['account', 'billing', 'notifications', 'security'];

function ProfileSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading profile">
      <div className="h-32 rounded-2xl bg-slate-800/40 border border-slate-700/40 animate-pulse" />
      <div className="h-10 rounded-lg bg-slate-800/40 border border-slate-700/40 animate-pulse" />
      <div className="h-72 rounded-2xl bg-slate-800/40 border border-slate-700/40 animate-pulse" />
    </div>
  );
}

function ProfilePageInner() {
  const { user, isLoaded } = useUser();
  useRequireAuth();

  const router = useRouter();
  const params = useSearchParams();
  const raw = params?.get('tab') ?? '';
  const active: TabId = (VALID_TABS as string[]).includes(raw) ? (raw as TabId) : 'account';

  const handleChange = (value: string) => {
    const next = new URLSearchParams(params?.toString() ?? '');
    next.set('tab', value);
    router.replace(`/profile?${next.toString()}`, { scroll: false });
  };

  if (!isLoaded || !user) {
    return (
      <AppShell eyebrow="Settings" title="Profile" maxWidth="5xl">
        <ProfileSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Settings"
      title="Profile"
      description="Manage account, subscription, and preferences."
      maxWidth="5xl"
    >
      <ProfileHeader />

      <Tabs value={active} onValueChange={handleChange} className="mt-6">
        <TabsList className="h-auto w-full justify-start gap-1 bg-slate-900/60 border border-slate-700/40 p-1 overflow-x-auto rounded-xl">
          <TabsTrigger
            value="account"
            className="gap-2 min-h-[44px] px-4 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 hover:text-slate-200"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="gap-2 min-h-[44px] px-4 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 hover:text-slate-200"
          >
            <CreditCard className="w-4 h-4" aria-hidden="true" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 min-h-[44px] px-4 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 hover:text-slate-200"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-2 min-h-[44px] px-4 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 hover:text-slate-200"
          >
            <Shield className="w-4 h-4" aria-hidden="true" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6 focus-visible:ring-0">
          <AccountTab />
        </TabsContent>
        <TabsContent value="billing" className="mt-6 focus-visible:ring-0">
          <BillingTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6 focus-visible:ring-0">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="security" className="mt-6 focus-visible:ring-0">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <AppShell eyebrow="Settings" title="Profile" maxWidth="5xl">
          <ProfileSkeleton />
        </AppShell>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}
