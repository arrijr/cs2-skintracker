// /frontend/src/app/layout.tsx  (Frontend)
import "./globals.css";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
import Providers from "./providers";
import { PostHogProvider } from "./providers/PostHogProvider";
import AppHeader from "./components/AppHeader";
import BuildInfo from "./components/BuildInfo";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import ErrorBanner from "@/components/ErrorBanner";
import { ErrorProvider } from "@/context/ErrorContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CookieBanner } from "@/components/CookieBanner";

// {/* Debug logging for ENV variables */}
if (typeof window !== 'undefined') {
  console.log('[ENV] NEXT_PUBLIC_API_ORIGIN =', process.env.NEXT_PUBLIC_API_ORIGIN);
}

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
      <html lang="en" className={`dark ${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}>
        <body className="bg-slate-950 text-white min-h-screen font-sans antialiased">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-fuchsia-500 focus:text-white focus:font-medium focus:shadow-lg"
          >
            Skip to main content
          </a>
          <ErrorProvider>
            <Providers>
              <PostHogProvider>
                <CurrencyProvider>
                  {/* Global Error Banner */}
                  <ErrorBanner />

                  {/* App Shell */}
                  <AppHeader />

                  <main id="main-content" className="min-h-screen">
                    {children}
                  </main>

                  {/* GDPR cookie consent — appears bottom-right on first visit
                      until the user makes a choice. */}
                  <CookieBanner />
                </CurrencyProvider>
              </PostHogProvider>

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
