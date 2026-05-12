// /frontend/src/app/layout.tsx  (Frontend)
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import Providers from "./providers";
import AppHeader from "./components/AppHeader";
import BuildInfo from "./components/BuildInfo";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import ErrorBanner from "@/components/ErrorBanner";
import { ErrorProvider } from "@/context/ErrorContext";


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
        <body className="bg-slate-950 text-white min-h-screen">
          {process.env.NODE_ENV === 'production' && (
            <Script
              data-domain="skintrackr.com"
              src="https://plausible.io/js/script.js"
              strategy="afterInteractive"
            />
          )}
          <ErrorProvider>
            <Providers>
              {/* Global Error Banner */}
              <ErrorBanner />
              
              {/* App Shell */}
              <AppHeader />
              
              <main className="min-h-screen">
                {children}
              </main>

              {/* Build Info - dev only */}
              <BuildInfo className="max-w-md" />

              {/* Toast Notifications */}
              <Toaster />
              <SonnerToaster richColors />
              <HotToaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1f2937",
                    color: "#f9fafb",
                    border: "1px solid #374151",
                  },
                  success: {
                    style: {
                      background: "#065f46",
                      color: "#f0fdf4",
                      border: "1px solid #10b981",
                    },
                  },
                  error: {
                    style: {
                      background: "#7f1d1d",
                      color: "#fef2f2",
                      border: "1px solid #ef4444",
                    },
                  },
                }}
              />
            </Providers>
          </ErrorProvider>
        </body>
      </html>
    </ClerkWrapper>
  );
}
