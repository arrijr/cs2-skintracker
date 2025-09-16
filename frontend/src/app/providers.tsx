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

        const token = await getToken({ template: "backend" });
        if (!token) {
          console.warn("[CLERK-SYNC] Skip (no backend token from Clerk)");
          return;
        }

        const body = { userId, email: undefined, firstName: undefined, lastName: undefined };
        console.debug("[CLERK-SYNC] Syncing user to database...", { userId });

        await fetchJson(apiUrl("/api/v1/users/sync"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        console.debug("[CLERK-SYNC] OK");
      } catch (err) {
        console.error("[CLERK-SYNC] Failed to sync user:", err);
        // bewusst kein throw – UI soll weiter laufen
      }
    })();
  }, [getToken, isSignedIn, userId]);

  return <>{children}</>;
}

// Default export für layout.tsx
export default Providers;