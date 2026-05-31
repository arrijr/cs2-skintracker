'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Mail, Bell, AlertTriangle } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type State = {
  emailAlerts: boolean;
  pushAlerts: boolean;
};

type ToggleKey = keyof State;

export function NotificationsTab() {
  const { getToken } = useAuth();
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<ToggleKey, boolean>>({
    emailAlerts: false,
    pushAlerts: false,
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken({ template: 'backend' });
        if (!token) return;
        const u = await fetchJson(apiUrl('/api/v1/users/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData({
          emailAlerts: !!u.emailAlerts,
          pushAlerts: !!u.pushAlerts,
        });
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : '';
        if (!m.includes('401')) {
          console.error('Failed to load notification settings:', err);
          setMsg({ type: 'error', text: "Couldn't load notifications. Refresh the page." });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  /**
   * Optimistic toggle: flip immediately, send PATCH in background.
   * On error: roll back + show toast.
   * No re-fetch needed.
   */
  const onToggle = async (key: ToggleKey, next: boolean) => {
    if (!data) return;
    const prev = data[key];
    setData({ ...data, [key]: next });
    setPending((p) => ({ ...p, [key]: true }));
    setMsg(null);
    try {
      const token = await getToken({ template: 'backend' });
      await fetchJson(apiUrl('/api/v1/users/me'), {
        method: 'PATCH',
        body: JSON.stringify({ [key]: next }),
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
    } catch (err: unknown) {
      // rollback
      setData((d) => (d ? { ...d, [key]: prev } : d));
      const text = err instanceof Error ? err.message : '';
      setMsg({
        type: 'error',
        text: text || "Couldn't save. Check your connection and try again.",
      });
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="h-6 w-32 rounded bg-slate-800/60 animate-pulse mb-4" />
        <div className="h-32 rounded bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-red-400" role="alert">
        Couldn&apos;t load notifications. Refresh the page.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h3 className="text-lg font-semibold text-white">Notifications</h3>
      <p className="mt-1 text-sm text-slate-400">
        Choose how skintrackr reaches you when prices and alerts change. Changes save instantly.
      </p>

      <div className="mt-6 space-y-3">
        <ToggleRow
          icon={<Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />}
          id="emailAlerts"
          title="Email alerts"
          description="Triggered alerts arrive in your inbox."
          checked={data.emailAlerts}
          pending={pending.emailAlerts}
          onChange={(v) => onToggle('emailAlerts', v)}
        />
        {/* In-app notifications are always on (the bell icon in the header).
            Per-alert opt-out lives on each Alert row in /alerts. */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 opacity-70">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-800">
              <Bell className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Browser push notifications</p>
              <p className="mt-0.5 text-xs text-slate-400">Live pings without keeping the tab open.</p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Coming soon
          </span>
        </div>
      </div>

      <div aria-live="polite" className="mt-5 min-h-[0]">
        {msg && (
          <div
            role={msg.type === 'error' ? 'alert' : 'status'}
            className={
              'p-3 rounded-md flex items-center gap-2 text-sm ' +
              (msg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30')
            }
          >
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  id,
  title,
  description,
  checked,
  pending,
  onChange,
}: {
  icon: React.ReactNode;
  id: string;
  title: string;
  description: string;
  checked: boolean;
  pending: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-800">
          {icon}
        </div>
        <div className="min-w-0">
          <Label htmlFor={id} className="text-sm font-medium text-white cursor-pointer">
            {title}
          </Label>
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={pending}
        onCheckedChange={(v) => onChange(v === true)}
        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 data-[state=unchecked]:bg-slate-800"
      />
    </div>
  );
}
