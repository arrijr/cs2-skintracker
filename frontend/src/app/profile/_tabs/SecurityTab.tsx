'use client';

import { useState } from 'react';
import { useAuth, UserProfile } from '@clerk/nextjs';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
export function SecurityTab() {
  const { getToken } = useAuth();

  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const resetDeleteModal = () => {
    setDeleteConfirmation('');
    setDeleteError('');
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      const token = await getToken({ template: 'backend' });
      await fetchJson(apiUrl('/api/v1/users/me'), {
        method: 'DELETE',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      window.location.href = '/';
    } catch {
      setDeleteError("Couldn't delete account. Contact support if this continues.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sign-in & Security (Clerk-managed, inline) */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Account
          </p>
          <h2 className="text-lg font-semibold text-white">Sign-in & Security</h2>
          <p className="text-sm text-slate-400">
            Manage your password, two-factor authentication, active sessions, email addresses, and profile picture.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 overflow-hidden max-w-full">
          <UserProfile
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: '#ec4899', // pink-500
                colorBackground: '#0f172a', // slate-900
                colorText: '#f1f5f9', // slate-100
                colorTextSecondary: '#94a3b8', // slate-400
                colorInputBackground: '#020617', // slate-950
                colorInputText: '#f1f5f9',
                colorNeutral: '#64748b', // slate-500
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: 'w-full max-w-full',
                card: 'bg-slate-900/50 border border-slate-800 rounded-2xl shadow-none',
                navbar: 'bg-slate-950/40 border-r border-slate-800',
                navbarButton: 'text-slate-300 hover:text-white hover:bg-slate-800',
                navbarButtonActive: 'text-white bg-slate-800/70',
                headerTitle: 'text-white',
                headerSubtitle: 'text-slate-400',
                formButtonPrimary:
                  'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white',
                formFieldLabel: 'text-slate-300',
                formFieldInput: 'bg-slate-950 border-slate-800 text-slate-100',
                badge: 'bg-slate-800 text-slate-300',
                // TODO: Clerk's internal modals (MFA setup, password change) may
                // still render with default light styling — verify after deploy.
              },
            }}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400/80">
          Danger zone
        </p>
        <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Delete account</h3>
              <p className="mt-1 text-sm text-slate-400">
                Permanently delete your account. Your portfolio, watchlist,
                alerts, and history will be erased and cannot be recovered.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end pt-4 border-t border-red-500/20">
            <Button
              onClick={() => setShowDelete(true)}
              className="bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Delete account
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Dialog */}
      <Dialog
        open={showDelete}
        onOpenChange={(open) => {
          setShowDelete(open);
          if (!open) resetDeleteModal();
        }}
      >
        <DialogContent className="bg-slate-900 border border-red-500/40 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              Delete account
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This permanently removes your portfolio, watchlist, alerts, and history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="deleteConfirmation" className="text-sm font-medium text-slate-200">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
            </Label>
            <Input
              id="deleteConfirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="font-mono bg-slate-950 border-slate-800 text-white focus:border-red-500"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {deleteError && (
            <div
              role="alert"
              className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={isDeleting}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={deleteAccount}
              disabled={isDeleting || deleteConfirmation !== 'DELETE'}
              className="bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Delete account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
