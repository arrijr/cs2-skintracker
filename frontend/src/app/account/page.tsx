"use client";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, User as UserIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SteamConnectSection } from "./_components/SteamConnectSection";

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Settings" title="Account" maxWidth="3xl">
        <div className="space-y-6">
          <div className="h-48 rounded-xl bg-slate-900/40 border border-slate-700/50 animate-pulse" />
          <div className="h-32 rounded-xl bg-slate-900/40 border border-slate-700/50 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell eyebrow="Settings" title="Account" maxWidth="3xl">
        <p className="text-slate-300">Please sign in to access account settings.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Settings"
      title="Account"
      description="Manage your profile, connections, and how skintrackr works with your data."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Steam Connect — elevated hero */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <span>Connections</span>
          </h2>
          <SteamConnectSection />
        </section>

        {/* Profile — quieter secondary */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Profile
          </h2>
          <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="h-4 w-4 text-slate-400" />
                Your details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-500 w-28">Email</span>
                <span>{user.primaryEmailAddress?.emailAddress}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-slate-500 w-28">Member since</span>
                <span>{user.createdAt && new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
