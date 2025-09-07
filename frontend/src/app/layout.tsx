// /frontend/src/app/layout.tsx  (Frontend)
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import AppHeader from "./components/AppHeader";
import BuildInfo from "./components/BuildInfo";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "CS2 Skin Price Tracker",
  description: "Track and analyze CS2 skin prices",
};

// Defensive Clerk configuration component
function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Show clear error message if Clerk key is missing
  if (!publishableKey) {
    return (
      <html lang="en" className="dark">
        <body className="bg-neutral-950 text-white min-h-screen flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Configuration Error
            </h1>
            <p className="text-neutral-300 mb-4">
              Clerk authentication is not configured. Please set the following environment variable:
            </p>
            <code className="bg-neutral-800 p-3 rounded block text-sm text-green-400 mb-4">
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            </code>
            <p className="text-sm text-neutral-400">
              This error occurs when the Clerk publishable key is missing from environment variables.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkWrapper>
      <html lang="en" className="dark">
        <body className="bg-neutral-950 text-white min-h-screen">
          <Providers>
            {/* App Shell */}
            <AppHeader />
            
            <main className="min-h-screen">
              {children}
            </main>

            {/* Footer with Build Info */}
            <footer className="border-t border-neutral-800 bg-neutral-950/50 backdrop-blur">
              <div className="container-cs2 py-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-neutral-400">
                    © 2024 CS2 Skin Price Tracker. Built with Next.js & Clerk.
                  </div>
                  <BuildInfo className="max-w-md" />
                </div>
              </div>
            </footer>

            {/* Toast Notifications */}
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkWrapper>
  );
}
