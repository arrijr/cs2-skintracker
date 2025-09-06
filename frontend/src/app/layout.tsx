// /frontend/src/app/layout.tsx  (Frontend)
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import AppHeader from "./components/AppHeader";
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
            
            {/* Toast Notifications */}
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
