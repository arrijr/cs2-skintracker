"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '@/lib/api';

// Clerk→DB Sync Component
function ClerkDBSync() {
  const { user, isLoaded } = useUser();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  useEffect(() => {
    const syncUserToDB = async () => {
      if (!isLoaded || !user) return;
      
      // Check if we already synced this session
      const syncKey = `clerk_sync_${user.id}`;
      if (sessionStorage.getItem(syncKey)) {
        console.log('✅ [CLERK-SYNC] User already synced this session');
        return;
      }

      try {
        setSyncStatus('syncing');
        console.log('🔄 [CLERK-SYNC] Syncing user to database...', {
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName
        });

        const response = await fetchJson(apiUrl('/api/v1/users/sync'), {
          method: 'POST',
          body: JSON.stringify({
            clerkUserId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName
          })
        });

        console.log('✅ [CLERK-SYNC] User synced successfully:', response);
        setSyncStatus('synced');
        sessionStorage.setItem(syncKey, 'true');
      } catch (error) {
        console.error('❌ [CLERK-SYNC] Failed to sync user:', error);
        setSyncStatus('error');
        
        // Don't block the UI on sync errors - just log them
        console.warn('⚠️ [CLERK-SYNC] User sync failed, but continuing...');
      }
    };

    syncUserToDB();
  }, [user, isLoaded]);

  // Optional: Show sync status in development
  if (process.env.NODE_ENV === 'development' && syncStatus !== 'idle') {
    return (
      <div className="fixed top-4 right-4 z-50 bg-neutral-800 text-white px-3 py-2 rounded text-sm">
        {syncStatus === 'syncing' && '🔄 Syncing user...'}
        {syncStatus === 'synced' && '✅ User synced'}
        {syncStatus === 'error' && '❌ Sync failed'}
      </div>
    );
  }

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClerkDBSync />
      {children}
    </>
  );
}