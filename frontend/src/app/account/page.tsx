"use client";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Mail, Calendar, User as UserIcon, Settings, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { SteamConnectSection } from "./_components/SteamConnectSection";

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Account" title="Account" maxWidth="5xl">
        <div className="space-y-6">
          <div className="h-48 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell eyebrow="Account" title="Account" maxWidth="5xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-300">
          Please sign in to access account settings.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Account"
      title="Account"
      description="Manage your profile, connections, and how skintrackr works with your data."
      maxWidth="5xl"
      actions={
        <Button
          asChild
          variant="outline"
          className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <Link href="/profile">
            <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
            Full settings
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Steam Connect — elevated hero */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Connections
          </p>
          <SteamConnectSection />
        </section>

        {/* Profile — quieter secondary */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Profile
          </p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 border border-slate-800">
                <UserIcon className="h-5 w-5 text-fuchsia-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Your details</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Account identity. Edit in{' '}
                  <Link href="/profile?tab=account" className="text-fuchsia-300 hover:text-fuchsia-200 underline underline-offset-2">
                    Profile settings
                  </Link>
                  .
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  Email
                </dt>
                <dd className="mt-1.5 text-sm text-slate-200 truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  Member since
                </dt>
                <dd className="mt-1.5 text-sm text-slate-200">
                  {user.createdAt && new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex justify-end pt-4 border-t border-slate-800">
              <Button
                asChild
                variant="outline"
                className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                <Link href="/profile?tab=account">
                  <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                  Edit profile
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
