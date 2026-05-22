// /frontend/src/app/components/AppHeader.tsx (Frontend)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileDropdown from "./ProfileDropdown";
import Logo from "@/components/Logo";
import { CommandPalette, useCommandPalette } from "@/components/CommandPalette";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const { isSignedIn, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const cmd = useCommandPalette();

  const navigation = isSignedIn
    ? [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Portfolio", href: "/portfolio" },
        { name: "Watchlist", href: "/watchlist" },
        { name: "Alerts", href: "/alerts" },
        { name: "Skins", href: "/skins" },
        { name: "Cases", href: "/cases" },
        { name: "Items", href: "/items" },
      ]
    : [
        { name: "Skins", href: "/skins" },
        { name: "Cases", href: "/cases" },
        { name: "Items", href: "/items" },
        { name: "Pricing", href: "/pricing" },
        { name: "Blog", href: "/blog" },
      ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-700/30 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Logo size="md" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-white bg-slate-800/80"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Spacer + Search-shortcut button (opens command palette) */}
            <button
              onClick={() => cmd.setOpen(true)}
              className="hidden lg:flex items-center gap-2 ml-auto bg-slate-900/70 border border-slate-700/40 px-3 py-1.5 rounded-md min-w-[260px] text-sm text-slate-400 hover:text-slate-300 hover:border-slate-600/60 transition-colors focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              aria-label="Open command palette"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="flex-1 text-left">Search a skin, page or action…</span>
              <kbd className="text-[10.5px] font-mono bg-slate-800/60 border border-slate-700/40 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Desktop Auth + Notifications */}
            <div className="hidden md:flex items-center gap-2 ml-auto lg:ml-0">
              {isSignedIn && <NotificationsDropdown />}
              {!isLoaded ? (
                <div className="h-8 w-8 animate-pulse bg-slate-800 rounded-full" />
              ) : (
                <ProfileDropdown />
              )}
            </div>

            {/* Mobile */}
            <div className="md:hidden ml-auto flex items-center gap-2" data-testid="mobile-menu">
              <button
                onClick={() => cmd.setOpen(true)}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-[9px] bg-slate-900/70 border border-slate-700/40 inline-flex items-center justify-center text-slate-300 hover:text-white"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
              {isSignedIn && <NotificationsDropdown />}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-300">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[360px] bg-slate-950 border-slate-700/40">
                  <div className="flex flex-col gap-6 mt-2">
                    <Logo size="md" />
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        cmd.setOpen(true);
                      }}
                      className="flex items-center gap-2 bg-slate-900/70 border border-slate-700/40 px-3 py-2 rounded-md text-sm text-slate-400"
                    >
                      <Search className="h-4 w-4" />
                      <span className="flex-1 text-left">Search…</span>
                    </button>
                    <nav className="flex flex-col gap-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive(item.href) ? "text-white bg-slate-800/80" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                          )}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    {isLoaded && (
                      <div className="pt-4 border-t border-slate-700/40">
                        <ProfileDropdown />
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <CommandPalette open={cmd.open} onOpenChange={cmd.setOpen} />
    </>
  );
}
