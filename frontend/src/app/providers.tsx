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
                 console.debug("[CLERK-SYNC] Skip (no user signed in)");
                 return;
               }

               console.log("[CLERK-SYNC] Getting token...", { userId, isSignedIn });
               const token = await getToken({ template: "backend" });
               console.log("[CLERK-SYNC] Token received:", { 
                 hasToken: !!token, 
                 tokenLength: token?.length,
                 tokenStart: token?.substring(0, 20) + "..."
               });
               
               if (!token) {
                 console.warn("[CLERK-SYNC] Skip (no backend token from Clerk)");
                 return;
               }

               console.debug("[CLERK-SYNC] Syncing user to database...", { userId });

               const response = await fetchJson(apiUrl("/api/v1/users/sync"), {
                 method: "POST",
                 headers: {
                   "Content-Type": "application/json",
                   "Authorization": `Bearer ${token}`,
                 },
                 body: JSON.stringify({}), // Empty body - user info comes from JWT
               });

               console.log("[CLERK-SYNC] Success:", response);
             } catch (err) {
               // Ignore Chrome extension errors
               if (err instanceof Error && err.message.includes('runtime.lastError')) {
                 console.debug("[CLERK-SYNC] Chrome extension error ignored:", err.message);
                 return;
               }
               console.error("[CLERK-SYNC] Failed to sync user:", err);
               // bewusst kein throw – UI soll weiter laufen
             }
           })();
         }, [getToken, isSignedIn, userId]);

  return <>{children}</>;
}

// Default export für layout.tsx
export default Providers;