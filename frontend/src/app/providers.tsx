"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchJson, apiUrl } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, userId } = useAuth();

         useEffect(() => {
           (async () => {
             try {
               if (!isSignedIn || !userId) {
                 return;
               }

               const token = await getToken({ template: "backend" });

               if (!token) {
                 return;
               }

               await fetchJson(apiUrl("/api/v1/users/sync"), {
                 method: "POST",
                 headers: {
                   "Content-Type": "application/json",
                   "Authorization": `Bearer ${token}`,
                 },
                 body: JSON.stringify({}), // Empty body - user info comes from JWT
               });
             } catch (err) {
               // Ignore Chrome extension errors
               if (err instanceof Error && err.message.includes('runtime.lastError')) {
                 return;
               }
               if (process.env.NODE_ENV !== 'production') {
                 console.error("[CLERK-SYNC] Failed to sync user:", err);
               }
               // bewusst kein throw – UI soll weiter laufen
             }
           })();
         }, [getToken, isSignedIn, userId]);

  return <>{children}</>;
}

// Default export für layout.tsx
export default Providers;