"use client";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertCard } from "./AlertCard";
import { CreateAlertModal } from "./CreateAlertModal";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyBell } from "@/components/ui/empty-illustrations";

export default function AlertsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { alerts, isLoading, error, createAlert, updateAlert, deleteAlert } = useAlerts();

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Notifications" title="Alerts" maxWidth="5xl">
        <div className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg bg-slate-800/40" />)}
        </div>
      </AppShell>
    );
  }
  if (!isSignedIn) {
    return (
      <AppShell eyebrow="Notifications" title="Alerts" maxWidth="5xl">
        <p className="text-slate-300">Please sign in to manage alerts.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Notifications"
      title="Alerts"
      description="Get notified when your conditions trigger."
      maxWidth="5xl"
      actions={<CreateAlertModal onCreate={createAlert} />}
    >
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg bg-slate-800/40" />)}
        </div>
      )}

      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-red-400">{error}</CardContent>
        </Card>
      )}

      {!isLoading && !error && alerts.length === 0 && (
        <EmptyState
          illustration={<EmptyBell size={120} />}
          title="No alerts yet"
          description="Create your first alert to get notified about price changes, volatility, or case-EV inversions."
        />
      )}

      {!isLoading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={async (id, isActive) => {
                try {
                  await updateAlert(id, { isActive } as Partial<typeof alert>);
                  toast.success(isActive ? 'Alert resumed' : 'Alert paused');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to update alert');
                }
              }}
              onDelete={async (id) => {
                try {
                  await deleteAlert(id);
                  toast.success('Alert deleted');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to delete alert');
                }
              }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
