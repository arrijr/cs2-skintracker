"use client";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertCard } from "./AlertCard";
import { CreateAlertModal } from "./CreateAlertModal";

export default function AlertsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { alerts, isLoading, error, createAlert, updateAlert, deleteAlert } = useAlerts();

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300">Please sign in to manage alerts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-7 w-7 text-purple-400" />
              Alerts
            </h1>
            <p className="text-slate-400 mt-1">Get notified when your conditions trigger.</p>
          </div>
          <CreateAlertModal onCreate={createAlert} />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        )}

        {error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 text-red-400">{error}</CardContent>
          </Card>
        )}

        {!isLoading && !error && alerts.length === 0 && (
          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No alerts yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Create your first alert to get notified about price changes, volatility, or case-EV inversions.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={(id, isActive) => updateAlert(id, { isActive } as Partial<typeof alert>)}
                onDelete={deleteAlert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
