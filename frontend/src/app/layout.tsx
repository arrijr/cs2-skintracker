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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
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
    </ClerkProvider>
  );
}
