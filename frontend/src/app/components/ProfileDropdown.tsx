// /frontend/src/app/components/ProfileDropdown.tsx — [Frontend]
// {/* Profile Dropdown with Icon and Notification Bell */}
"use client";
import { useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  ChevronDown,
  User2,
  BarChart3,
  Heart
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
import NotificationBell from "./NotificationBell";

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className = "" }: ProfileDropdownProps) {
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { isAdmin } = useUserRole();

  if (!isSignedIn || !user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button asChild variant="outline" size="sm">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">Sign Up</Link>
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
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Notification Bell */}
      <NotificationBell />

      {/* Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-10 w-10 p-0 hover:bg-muted/50 transition-all duration-200 hover-scale group"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-semibold text-sm group-hover:shadow-lg group-hover:shadow-brand-blue/25 transition-all duration-200">
              {getInitials()}
            </div>
            <ChevronDown className="h-3 w-3 absolute -bottom-1 -right-1 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* User Info */}
          <DropdownMenuLabel className="flex items-center gap-3 p-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-semibold">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{getUserDisplayName()}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.emailAddresses?.[0]?.emailAddress}
              </p>
              {isAdmin && (
                <Badge variant="outline" className="mt-1 border-brand-orange/30 text-brand-orange text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Quick Actions */}
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-3 p-3 cursor-pointer">
              <User2 className="h-4 w-4" />
              <div>
                <p className="font-medium">Profile</p>
                <p className="text-xs text-muted-foreground">View your profile</p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-3 p-3 cursor-pointer">
              <BarChart3 className="h-4 w-4" />
              <div>
                <p className="font-medium">Dashboard</p>
                <p className="text-xs text-muted-foreground">View your dashboard</p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/portfolio" className="flex items-center gap-3 p-3 cursor-pointer">
              <Heart className="h-4 w-4" />
              <div>
                <p className="font-medium">Portfolio</p>
                <p className="text-xs text-muted-foreground">Manage your skins</p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Settings */}
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-3 p-3 cursor-pointer">
              <Settings className="h-4 w-4" />
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground">Account preferences</p>
              </div>
            </Link>
          </DropdownMenuItem>

          {/* Admin Section */}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-3 p-3 cursor-pointer">
                  <Shield className="h-4 w-4 text-brand-orange" />
                  <div>
                    <p className="font-medium text-brand-orange">Admin Panel</p>
                    <p className="text-xs text-muted-foreground">System administration</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="flex items-center gap-3 p-3 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
