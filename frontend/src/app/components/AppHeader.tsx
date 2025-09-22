// /frontend/src/app/components/AppHeader.tsx (Frontend)
"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import SkinSearchBar from "./SkinSearchBar";
import ProfileDropdown from "./ProfileDropdown";
import Logo from "@/components/Logo";
import { useUserRole } from "@/hooks/useUserRole";

export default function AppHeader() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use centralized role hook
  const { isAdmin } = useUserRole();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Skins', href: '/skins' },
    ...(isSignedIn ? [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Portfolio', href: '/portfolio' },
    ] : []),
  ];

  const mobileNavigation = navigation;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container-cs2">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo size="lg" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-4">
            <SkinSearchBar
              onSelect={(skinId) => {
                window.location.href = `/skins/${skinId}`;
              }}
            />
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {!isLoaded ? (
              <div className="h-8 w-8 animate-pulse bg-slate-700 rounded-full" />
            ) : (
              <ProfileDropdown />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6">
                  {/* Mobile Logo */}
                  <Logo size="lg" />

                  {/* Mobile Search */}
                  <div className="w-full">
                    <SkinSearchBar
                      onSelect={(skinId) => {
                        setIsMobileMenuOpen(false);
                        window.location.href = `/skins/${skinId}`;
                      }}
                    />
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-2">
                    {mobileNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Profile Dropdown */}
                  {isLoaded && (
                    <div className="pt-4 border-t border-neutral-800">
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
  );
}
