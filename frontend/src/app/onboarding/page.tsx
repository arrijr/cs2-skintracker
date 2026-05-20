"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { ProgressBar } from "./_components/ProgressBar";
import { Step1Currency } from "./_steps/Step1Currency";
import { Step2Steam } from "./_steps/Step2Steam";
import { Step3Alert } from "./_steps/Step3Alert";

type Step = 1 | 2 | 3;

/**
 * /onboarding — 3-step new-user setup.
 * - Step 1: Welcome + currency preference (EUR/USD).
 * - Step 2: Optional Steam connect.
 * - Step 3: Optional first price alert.
 *
 * Each step is skippable. "Skip setup" / finish stamp `onboardingCompletedAt`
 * server-side and route to /dashboard.
 *
 * Step persists in `?step=1|2|3` so reloads/back-button keep their place.
 *
 * Next.js 15 requires `useSearchParams()` to live inside a `<Suspense>`
 * boundary or static prerendering will bail. Wrap the inner component
 * accordingly so this page can be statically generated.
 */
export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingSkeleton() {
  return (
    <main className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(217,70,239,0.18),transparent_70%)]"
      />
      <div className="relative container mx-auto px-4 py-12 max-w-2xl">
        <div className="h-2 rounded-full bg-slate-900/60 animate-pulse mb-8" />
        <div className="h-96 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse" />
      </div>
    </main>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Derive step from query string; fall back to 1.
  const initialStep = useMemo<Step>(() => {
    const raw = parseInt(params.get("step") ?? "1", 10);
    return raw === 2 || raw === 3 ? (raw as Step) : 1;
  }, [params]);
  const [step, setStep] = useState<Step>(initialStep);

  // Keep URL in sync so back-button + reloads work.
  useEffect(() => {
    const current = params.get("step");
    if (current !== String(step)) {
      const sp = new URLSearchParams(params.toString());
      sp.set("step", String(step));
      router.replace(`/onboarding?${sp.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Mark onboarding complete server-side, then land on /dashboard.
  const finish = useCallback(async () => {
    try {
      const token = await getToken({ template: "backend" });
      await fetch(`${apiBase}/api/v1/users/me/onboarded`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      // Non-fatal — user still proceeds. The unflagged record means we may
      // bounce them here again, but the dashboard works either way.
      console.warn("[onboarding] failed to stamp completion:", e);
    }
    router.push("/dashboard");
  }, [apiBase, getToken, router]);

  if (!isLoaded) {
    return <OnboardingSkeleton />;
  }

  if (!isSignedIn) {
    return (
      <main className="relative min-h-screen bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <p className="text-slate-300">Please sign in to continue setup.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Atmospheric backdrop — fuchsia tint to match landing hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(217,70,239,0.18),transparent_70%)]"
      />

      <div className="relative container mx-auto px-4 py-10 md:py-14 max-w-2xl">
        <ProgressBar
          step={step}
          onJump={(n) => setStep(n)}
        />

        {step === 1 && (
          <Step1Currency
            firstName={user?.firstName ?? null}
            onContinue={() => setStep(2)}
            onSkipAll={finish}
          />
        )}
        {step === 2 && (
          <Step2Steam
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3Alert
            onBack={() => setStep(2)}
            onFinish={finish}
          />
        )}
      </div>
    </main>
  );
}
