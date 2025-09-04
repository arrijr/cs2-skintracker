// /frontend/src/app/layout.tsx  (Frontend)
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import ClerkNavBar from "./components/ClerkNavBar";

export const metadata = {
  title: "CS2 Skin Price Tracker",
  description: "Track and analyze CS2 skin prices",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-950 text-white min-h-screen">
          <Providers>
            {/* App Shell */}
            <header className="border-b border-zinc-800">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="font-bold">CS2 Skin Price Tracker</div>
                <nav className="text-sm text-zinc-400">
                  <ClerkNavBar />
                  {/* add nav links if you like */}
                </nav>
              </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
