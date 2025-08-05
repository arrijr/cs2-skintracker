"use client";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/portfolio");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-4xl font-bold mb-2">CS2 Skin Price Tracker</h1>
      <p className="mb-8 text-gray-400">
        Verwalte und beobachte dein Skin-Portfolio – kostenlos!
      </p>
      {!user && (
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Registrieren
          </Link>
        </div>
      )}
    </div>
  );
}
