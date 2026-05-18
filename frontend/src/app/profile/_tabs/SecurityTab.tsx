'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Trash2, AlertTriangle, Save, RefreshCw, LogOut } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SteamConnectSection } from '@/app/account/_components/SteamConnectSection';

export function SecurityTab() {
  // Password modal state
  const [showPwModal, setShowPwModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Delete modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const resetPwModal = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwError('');
    setPwSuccess('');
  };

  const resetDeleteModal = () => {
    setDeleteConfirmation('');
    setDeleteError('');
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPwError("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await fetchJson(apiUrl('/api/v1/users/me/password'), {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      setPwSuccess('Password updated.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPwModal(false);
        setPwSuccess('');
      }, 1500);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      setPwError(msg || "Couldn't change password. Check your current password and try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      await fetchJson(apiUrl('/api/v1/users/me'), { method: 'DELETE' });
      window.location.href = '/';
    } catch {
      setDeleteError("Couldn't delete account. Contact support if this continues.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SteamConnectSection />

      {/* Password */}
      <Card className="bg-slate-900/60 border-slate-700/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" aria-hidden="true" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">
            Update the password used to sign in.
          </p>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button asChild variant="ghost">
              <Link href="/sign-in">
                <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                Sign out
              </Link>
            </Button>
            <Button onClick={() => setShowPwModal(true)} variant="outline">
              <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
              Change password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">
            Deleting your account is permanent. Your portfolio, watchlist, alerts, and history will be gone.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setShowDelete(true)} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog
        open={showPwModal}
        onOpenChange={(open) => {
          setShowPwModal(open);
          if (!open) resetPwModal();
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-700/40 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-blue-400" aria-hidden="true" />
              Change password
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your current password and a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          {pwError && (
            <div
              role="alert"
              className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
              {pwSuccess}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPwModal(false)} disabled={pwLoading}>
              Cancel
            </Button>
            <Button onClick={changePassword} disabled={pwLoading}>
              {pwLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Changing…
                </>
              ) : (
                'Change password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={showDelete}
        onOpenChange={(open) => {
          setShowDelete(open);
          if (!open) resetDeleteModal();
        }}
      >
        <DialogContent className="bg-slate-900 border-red-500/30 text-white">
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
            <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
            </Label>
            <Input
              id="deleteConfirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {deleteError && (
            <div
              role="alert"
              className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onClick={deleteAccount}
              disabled={isDeleting || deleteConfirmation !== 'DELETE'}
              variant="destructive"
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
