"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  // {/* Redirect when unauthenticated */}
  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  // {/* Gate while auth is initializing */}
  if (loading) {
    return <div className="text-center text-zinc-400 py-10">Loading…</div>;
  }

  // {/* Block render while redirecting */}
  if (!token) return null;

  return <>{children}</>;
}
