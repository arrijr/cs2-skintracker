"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // {/* Redirect when unauthenticated */}
  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/sign-in");
    }
  }, [isLoaded, user, router]);

  // {/* Gate while auth is initializing */}
  if (!isLoaded) {
    return <div className="text-center text-zinc-400 py-10">Loading…</div>;
  }

  // {/* Block render while redirecting */}
  if (!user) return null;

  return <>{children}</>;
}
