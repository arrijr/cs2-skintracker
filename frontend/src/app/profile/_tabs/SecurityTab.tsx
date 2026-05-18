'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Trash2, AlertTriangle, Save, RefreshCw, LogOut } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      setPwSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPwModal(false), 2000);
    } catch (error: unknown) {
      setPwError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      await fetchJson(apiUrl('/api/v1/users/me'), { method: 'DELETE' });
      window.location.href = '/';
    } catch {
      setDeleteError('Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Steam connection */}
      <SteamConnectSection />

      {/* Password */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-400">
            Change the password used to sign in to your account.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => setShowPwModal(true)} variant="outline" className="btn-enhanced">
              <Shield className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button asChild variant="ghost" className="btn-enhanced">
              <Link href="/sign-in">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            onClick={() => setShowDelete(true)}
            variant="destructive"
            className="btn-enhanced"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Password modal */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Shield className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  minLength={6}
                />
              </div>

              {pwError && (
                <div className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="p-3 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" />
                  {pwSuccess}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPwModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPwError('');
                    setPwSuccess('');
                  }}
                  disabled={pwLoading}
                >
                  Cancel
                </Button>
                <Button onClick={changePassword} disabled={pwLoading}>
                  {pwLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Changing…
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete your account and remove
                all your data.
              </p>
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
                />
              </div>

              {deleteError && (
                <div className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDelete(false);
                    setDeleteConfirmation('');
                    setDeleteError('');
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={deleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                  variant="destructive"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
