"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/portfolio");
    }
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-4xl font-bold mb-2">CS2 Skin Price Tracker</h1>
      <p className="mb-8 text-gray-400">
        Verwalte und beobachte dein Skin-Portfolio – kostenlos!
      </p>
      {isLoaded && !user && (
        <div className="flex gap-4">
          <Link
            href="/sign-in"
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}
