"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SkinSearchBar from "../components/SkinSearchBar";

export default function NavBar() {
  const router = useRouter();

  return (
    <header className="bg-neutral-950 py-4 sticky top-0 shadow mb-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4">
        {/* Links und Logo (ganz links) */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
            {/* Optional: <img src="/logo.svg" className="w-7 h-7" /> */}
            SKIN<span className="text-green-400">TRACKER</span>
          </Link>
          {/* Navigation */}
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition">Home</Link>
          <Link href="/skins" className="text-blue-400 hover:text-blue-300 transition">Skins</Link>
          <Link href="/watchlist" className="text-blue-400 hover:text-blue-300 transition">Watchlist</Link>
          <Link href="/portfolio" className="text-blue-400 hover:text-blue-300 transition">Portfolio</Link>
        </div>

        {/* Zentrale Suchleiste */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg">
            <SkinSearchBar
              onSelect={(skinId) => router.push(`/skins/${skinId}`)}
              className="h-11 text-base px-5 rounded-xl w-full input-main"
            />
          </div>
        </div>

        {/* Profile-Link ganz rechts */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-blue-400 hover:text-blue-300 transition">Profile</Link>
          <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition">Admin</Link>
        </div>
      </div>
    </header>
  );
}
