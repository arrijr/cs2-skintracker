// /frontend/src/app/dashboard/page.tsx (Frontend)
"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();

  // Client-side guard - redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back to your CS2 Skin Tracker</p>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">User Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Picture & Basic Info */}
            <div className="flex items-center space-x-4">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-2 border-gray-600"
                />
              )}
              <div>
                <h3 className="text-lg font-medium">
                  {user.fullName || "No name set"}
                </h3>
                <p className="text-gray-400 text-sm">
                  {user.username ? `@${user.username}` : "No username"}
                </p>
              </div>
            </div>

            {/* Email Information */}
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-400 block">Primary Email</label>
                <p className="text-white font-medium">
                  {user.primaryEmailAddress?.emailAddress || "No email"}
                </p>
              </div>
              
              {user.emailAddresses.length > 1 && (
                <div>
                  <label className="text-sm text-gray-400 block">All Emails</label>
                  <div className="space-y-1">
                    {user.emailAddresses.map((email) => (
                      <p key={email.id} className="text-white text-sm">
                        {email.emailAddress}
                        {email.id === user.primaryEmailAddress?.id && (
                          <span className="ml-2 text-green-400 text-xs">(Primary)</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional User Details */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-gray-400 block">User ID</label>
                <p className="text-white font-mono text-xs break-all">
                  {user.id}
                </p>
              </div>
              
              <div>
                <label className="text-gray-400 block">Created</label>
                <p className="text-white">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
              
              <div>
                <label className="text-gray-400 block">Last Sign In</label>
                <p className="text-white">
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">Portfolio</h3>
            <p className="text-gray-400 text-sm mb-4">
              View and manage your skin collection
            </p>
            <a
              href="/portfolio"
              className="inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Go to Portfolio
            </a>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition-colors">
            <h3 className="text-lg font-semibold mb-2 text-green-400">Watchlist</h3>
            <p className="text-gray-400 text-sm mb-4">
              Track skins you're interested in
            </p>
            <a
              href="/watchlist"
              className="inline-block px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors text-sm"
            >
              Go to Watchlist
            </a>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-colors">
            <h3 className="text-lg font-semibold mb-2 text-purple-400">Browse Skins</h3>
            <p className="text-gray-400 text-sm mb-4">
              Discover new skins and check prices
            </p>
            <a
              href="/skins"
              className="inline-block px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors text-sm"
            >
              Browse Skins
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
