"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRequireAuth } from "../hooks/useRequireAuth";
import Link from "next/link";
import { LogOut, Star, Trash2, Settings, Shield, AlertTriangle, Save, Mail, Bell, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { apiUrl, fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/layout/AppShell";

interface ProfileData {
  displayName?: string;
  timezone?: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  useRequireAuth();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [settings, setSettings] = useState({
    displayName: "",
    timezone: "",
    emailAlerts: true,
    pushAlerts: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showPwModal, setShowPwModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (isLoaded && user) loadProfileData();
  }, [isLoaded, user]);

  const loadProfileData = async () => {
    try {
      const token = await getToken({ template: "backend" });
      if (!token) return;
      const data = await fetchJson(apiUrl("/api/v1/users/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings({
        displayName: data.displayName || "",
        timezone: data.timezone || "",
        emailAlerts: data.emailAlerts,
        pushAlerts: data.pushAlerts,
      });
    } catch (error: any) {
      if (!String(error?.message ?? "").includes("401")) {
        console.error("Failed to load profile:", error);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await fetchJson(apiUrl("/api/v1/users/me"), {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettingsMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (error: any) {
      setSettingsMessage({ type: "error", text: error?.message || "Failed to save settings" });
    } finally {
      setSavingSettings(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPwError("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");
    try {
      await fetchJson(apiUrl("/api/v1/users/me/password"), {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      setPwSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setShowPwModal(false), 2000);
    } catch (error: any) {
      setPwError(error?.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setDeleteError("Please type DELETE to confirm");
      return;
    }
    setIsDeleting(true);
    try {
      await fetchJson(apiUrl("/api/v1/users/me"), { method: "DELETE" });
      window.location.href = "/";
    } catch {
      setDeleteError("Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <AppShell eyebrow="Account" title="Settings" maxWidth="3xl">
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Account"
      title="Settings"
      description="Manage your preferences and account security."
      maxWidth="3xl"
    >
      <div className="space-y-6 animate-fade-in">

        {/* Preferences */}
        <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                  placeholder="Enter display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {Intl.supportedValuesOf("timeZone").map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailAlerts"
                    checked={settings.emailAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked as boolean })}
                  />
                  <Label htmlFor="emailAlerts" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email alerts for price changes
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pushAlerts"
                    checked={settings.pushAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushAlerts: checked as boolean })}
                  />
                  <Label htmlFor="pushAlerts" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Push notifications
                  </Label>
                </div>
              </div>
            </div>

            {settingsMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                settingsMessage.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {settingsMessage.type === "success" ? <Save className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {settingsMessage.text}
              </div>
            )}

            <Button onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Settings</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={() => setShowPwModal(true)} variant="outline" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Change Password
              </Button>

              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link href="/portfolio">
                  <Star className="w-4 h-4" />
                  My Portfolio
                </Link>
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/20 bg-red-500/5 rounded-2xl animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Once you delete your account, there is no going back.</p>
            <Button onClick={() => setShowDelete(true)} variant="destructive" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-celadon">
                <Shield className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Min. 6 characters"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>

              {pwError && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />{pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-2">
                  <Save className="w-4 h-4" />{pwSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={changePassword} disabled={pwLoading} className="flex-1">
                  {pwLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Changing...</> : <><Shield className="w-4 h-4 mr-2" />Change Password</>}
                </Button>
                <Button onClick={() => { setShowPwModal(false); setPwError(""); setPwSuccess(""); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}
                  disabled={pwLoading} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-red-500/20 bg-red-500/5">
            <CardHeader className="text-center">
              <CardTitle className="text-red-400 flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">This will permanently delete your account and all data. This cannot be undone.</p>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
                </Label>
                <Input className="text-center font-mono" value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="DELETE" />
              </div>

              {deleteError && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />{deleteError}
                </div>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <Button onClick={deleteAccount} disabled={isDeleting || deleteConfirmation !== "DELETE"} variant="destructive">
                  {isDeleting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" />Delete Account</>}
                </Button>
                <Button onClick={() => { setShowDelete(false); setDeleteConfirmation(""); setDeleteError(""); }} disabled={isDeleting} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
