'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Settings, CreditCard, Bell, Shield } from 'lucide-react';

export type TabId = 'account' | 'billing' | 'notifications' | 'security';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'account', label: 'Account', icon: Settings },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export function TabNav({ active }: { active: TabId }) {
  const router = useRouter();
  const params = useSearchParams();

  const handleClick = (id: TabId) => {
    const next = new URLSearchParams(params?.toString() ?? '');
    next.set('tab', id);
    router.push(`/profile?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-1 border-b border-zinc-800 mb-6">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => handleClick(t.id)}
            className={
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ' +
              (isActive
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200')
            }
          >
            <Icon className="w-4 h-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
