// /frontend/src/app/components/ProfileDropdown.tsx — [Frontend]
"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Shield,
  LogOut,
  User2,
  BarChart3,
  Heart,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";
import { useSteamConnection } from "@/hooks/useSteamConnection";

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className = "" }: ProfileDropdownProps) {
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { isAdmin } = useUserRole();
  const { status: steamStatus } = useSteamConnection();

  if (!isSignedIn || !user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  const getInitials = () => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (user.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.emailAddresses?.[0]?.emailAddress || "User";
  };

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 p-0 rounded-full hover:bg-transparent transition-all duration-200 group"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-pink-500/30 group-hover:ring-pink-500/70 group-hover:shadow-lg group-hover:shadow-pink-500/30 transition-all duration-200">
              {getInitials()}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 bg-slate-900 border-slate-800 text-slate-100 rounded-xl shadow-xl shadow-black/40"
        >
          {/* User Info */}
          <DropdownMenuLabel className="flex items-center gap-3 p-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold ring-2 ring-pink-500/30">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{getUserDisplayName()}</p>
              <p className="text-xs text-slate-400 truncate">
                {user.emailAddresses?.[0]?.emailAddress}
              </p>
              {isAdmin && (
                <Badge variant="outline" className="mt-1 border-amber-500/40 text-amber-300 bg-amber-500/10 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />

          <DropdownMenuItem
            asChild
            className="focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 cursor-pointer"
          >
            <Link href="/profile" className="flex items-center gap-3 p-3">
              <User2 className="h-4 w-4 text-slate-400" />
              <div>
                <p className="font-medium text-slate-100">Profile</p>
                <p className="text-xs text-slate-400">View and edit your profile</p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            className="focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 cursor-pointer"
          >
            <Link href="/dashboard" className="flex items-center gap-3 p-3">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <div>
                <p className="font-medium text-slate-100">Dashboard</p>
                <p className="text-xs text-slate-400">Portfolio at a glance</p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            className="focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 cursor-pointer"
          >
            <Link href="/portfolio" className="flex items-center gap-3 p-3">
              <Heart className="h-4 w-4 text-slate-400" />
              <div>
                <p className="font-medium text-slate-100">Portfolio</p>
                <p className="text-xs text-slate-400">Manage your skins</p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-800" />

          {/* Steam connection status */}
          <DropdownMenuItem
            asChild
            className="focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 cursor-pointer"
          >
            <Link
              href="/profile?tab=account#steam"
              className="flex items-center gap-3 p-3"
            >
              <Gamepad2
                className={`h-4 w-4 ${steamStatus?.connected ? "text-emerald-400" : "text-slate-400"}`}
              />
              <div className="flex-1 min-w-0">
                {steamStatus?.connected ? (
                  <>
                    <p className="font-medium text-slate-100">Steam connected</p>
                    <p className="text-xs text-slate-400 truncate">
                      {steamStatus.steamId ?? "Linked"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-slate-100">Connect Steam</p>
                    <p className="text-xs text-slate-400">Import your inventory</p>
                  </>
                )}
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            className="focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 cursor-pointer"
          >
            <Link href="/profile?tab=account" className="flex items-center gap-3 p-3">
              <Settings className="h-4 w-4 text-slate-400" />
              <div>
                <p className="font-medium text-slate-100">Settings</p>
                <p className="text-xs text-slate-400">Account preferences</p>
              </div>
            </Link>
          </DropdownMenuItem>

          {/* Re-run the new-user onboarding flow (currency + Steam + first alert). */}
          <DropdownMenuItem
            asChild
            className="focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 cursor-pointer"
          >
            <Link href="/onboarding" className="flex items-center gap-3 p-3">
              <Sparkles className="h-4 w-4 text-purple-300" />
              <div>
                <p className="font-medium text-slate-100">Re-run setup</p>
                <p className="text-xs text-slate-400">
                  Replay the 3-step onboarding
                </p>
              </div>
            </Link>
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 cursor-pointer"
              >
                <Link href="/admin" className="flex items-center gap-3 p-3">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-300">Admin panel</p>
                    <p className="text-xs text-slate-400">System administration</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-slate-800" />

          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-3 p-3 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            <div>
              <p className="font-medium">Sign out</p>
              <p className="text-xs text-red-400/70">Sign out of your account</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
