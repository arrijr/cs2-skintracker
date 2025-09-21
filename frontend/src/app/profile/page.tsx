"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRequireAuth } from "../hooks/useRequireAuth";
import Link from "next/link";
import { LogOut, User2, Star, Eye, Trash2, Settings, Shield, AlertTriangle, Save, Calendar, Mail, Bell, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { apiUrl, fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatUSD, safeToFixed } from "@/lib/num";

interface ProfileData {
  id: number;
  email: string;
  displayName?: string;
  timezone?: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  createdAt: string;
}

interface KPIData {
  portfolioCount: number;
  portfolioValue: number;
  portfolioChange24h: number;
  portfolioChange7d: number;
  totalInvested: number;
  unrealizedPL: number;
  watchlistCount: number;
  activeAlerts: number;
  lastUpdated?: string;
  // Risk metrics
  volatility?: number;
  volatilityMessage?: string;
  maxDrawdown?: number;
  maxDrawdownMessage?: string;
  hasEnoughRiskData?: boolean;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  useRequireAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingKPI, setLoadingKPI] = useState(true);
  
  // Settings state
  const [settings, setSettings] = useState({
    displayName: "",
    timezone: "",
    emailAlerts: true,
    pushAlerts: false
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Password state
  const [showPwModal, setShowPwModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  
  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Load profile data
  useEffect(() => {
    if (isLoaded && user) {
      loadProfileData();
      loadKPIData();
    }
  }, [isLoaded, user]);

  const loadProfileData = async () => {
    try {
      const token = await getToken({ template: "backend" });
      const data = await fetchJson(apiUrl("/api/v1/users/me"), {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      setProfileData(data);
      setSettings({
        displayName: data.displayName || "",
        timezone: data.timezone || "",
        emailAlerts: data.emailAlerts,
        pushAlerts: data.pushAlerts
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadKPIData = async () => {
    try {
      // Use new KPI endpoint for better performance
      const token = await getToken({ template: "backend" });
      const kpiResponse = await fetchJson(apiUrl("/api/v1/portfolio/kpis"), {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      setKpiData({
        portfolioCount: kpiResponse.portfolioCount || 0,
        portfolioValue: kpiResponse.portfolioValue || 0,
        portfolioChange24h: kpiResponse.portfolioChange24h || 0,
        portfolioChange7d: kpiResponse.portfolioChange7d || 0,
        totalInvested: kpiResponse.totalInvested || 0,
        unrealizedPL: kpiResponse.unrealizedPL || 0,
        watchlistCount: kpiResponse.watchlistCount || 0,
        activeAlerts: kpiResponse.activeAlerts || 0,
        lastUpdated: kpiResponse.lastUpdated
      });
    } catch (error) {
      console.error("Failed to load KPI data:", error);
      // Set fallback data
      setKpiData({
        portfolioCount: 0,
        portfolioValue: 0,
        portfolioChange24h: 0,
        portfolioChange7d: 0,
        totalInvested: 0,
        unrealizedPL: 0,
        watchlistCount: 0,
        activeAlerts: 0
      });
    } finally {
      setLoadingKPI(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);
    
    try {
      const updatedProfile = await fetchJson(apiUrl("/api/v1/users/me"), {
        method: "PATCH",
        body: JSON.stringify(settings)
      });
      
      setProfileData(updatedProfile);
      setSettingsMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (error: any) {
      setSettingsMessage({ 
        type: 'error', 
        text: error?.message || 'Failed to save settings' 
      });
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
          newPassword: passwordData.newPassword
        })
      });
      
      setPwSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      // Close modal after 2 seconds
      setTimeout(() => setShowPwModal(false), 2000);
    } catch (error: any) {
      setPwError(error?.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setPwError("Please type DELETE to confirm");
      return;
    }
    
    setIsDeleting(true);
    try {
      await fetchJson(apiUrl("/api/v1/users/me"), { method: "DELETE" });
      // Clerk will handle the logout and redirect
      window.location.href = "/";
    } catch (error) {
      setPwError("Failed to delete account");
      setIsDeleting(false);
    }
  };

  // Show loading state while auth is being checked
  if (!isLoaded || !user) {
    return <div className="text-white p-6">Loading...</div>;
  }

  if (loadingProfile || loadingKPI) {
    return <div className="text-white p-6">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container-cs2 section-cs2">
        <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-zinc-400">Manage your account settings and preferences</p>
      </div>

          {/* Overview Section */}
          <div className="card-brand card-enhanced hover-lift mb-8 animate-slide-up">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User2 className="w-5 h-5" />
          Overview
        </h2>
        
        {/* Avatar & Basic Info */}
        <div className="flex items-center gap-4 mb-6">
          <span className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white shadow-lg text-2xl">
            <User2 className="w-8 h-8" />
          </span>
          <div>
            <div className="text-xl font-bold">
              {profileData?.displayName || user.firstName || "User"}
            </div>
            <div className="text-zinc-400">{profileData?.email || user.primaryEmailAddress?.emailAddress}</div>
            <div className="text-sm text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Member since {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
            </div>
          </div>
        </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="card-enhanced hover-lift">
                <CardContent className="p-4 text-center">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-lg font-bold">{kpiData?.portfolioCount || 0}</div>
                  <div className="text-xs text-muted-foreground">Portfolio Skins</div>
                </CardContent>
              </Card>
          
              <Card className="card-enhanced hover-lift">
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-green-400">
                    {formatUSD(kpiData?.portfolioValue || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Value</div>
                  {kpiData?.portfolioChange24h !== 0 && kpiData && (
                    <Badge 
                      variant={kpiData.portfolioChange24h > 0 ? "default" : "destructive"}
                      className={`text-xs mt-1 ${
                        kpiData.portfolioChange24h > 0 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {kpiData.portfolioChange24h > 0 ? "+" : ""}{safeToFixed(kpiData.portfolioChange24h, 1)}% 24h
                    </Badge>
                  )}
                </CardContent>
              </Card>
          
              <Card className="card-enhanced hover-lift">
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {formatUSD(kpiData?.totalInvested || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Invested</div>
                </CardContent>
              </Card>
          
              <Card className="card-enhanced hover-lift">
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {formatUSD(kpiData?.unrealizedPL || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Unrealized P/L</div>
                  {kpiData?.portfolioChange7d !== 0 && kpiData && (
                    <Badge 
                      variant={kpiData.portfolioChange7d > 0 ? "default" : "destructive"}
                      className={`text-xs mt-1 ${
                        kpiData.portfolioChange7d > 0 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {kpiData.portfolioChange7d > 0 ? "+" : ""}{safeToFixed(kpiData.portfolioChange7d, 1)}% 7d
                    </Badge>
                  )}
                </CardContent>
              </Card>
          
              <Card className="card-enhanced hover-lift">
                <CardContent className="p-4 text-center">
                  <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-bold">{kpiData?.watchlistCount || 0}</div>
                  <div className="text-xs text-muted-foreground">Watchlist</div>
                </CardContent>
              </Card>
          
              <Card className="card-enhanced hover-lift">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-lg font-bold">{kpiData?.activeAlerts || 0}</div>
                  <div className="text-xs text-muted-foreground">Active Alerts</div>
                </CardContent>
              </Card>
            </div>

        {/* Last Updated */}
        {kpiData?.lastUpdated && (
          <div className="mt-4 text-center text-sm text-zinc-500">
            Last updated: {new Date(kpiData.lastUpdated).toLocaleString()}
          </div>
        )}

        {/* Risk Metrics */}
        {kpiData?.hasEnoughRiskData && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-zinc-300">Risk Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">30-Day Volatility</div>
                <div className="text-xl font-bold text-orange-400">
                  {kpiData.volatility?.toFixed(2)}%
                </div>
                <div className="text-xs text-zinc-500">Daily return volatility</div>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Max Drawdown (90d)</div>
                <div className="text-xl font-bold text-red-400">
                  {kpiData.maxDrawdown?.toFixed(2)}%
                </div>
                <div className="text-xs text-zinc-500">Peak to trough decline</div>
              </div>
            </div>
          </div>
        )}
      </div>

          {/* Settings Section */}
          <Card className="card-enhanced hover-lift mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
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
                    onChange={(e) => setSettings({...settings, displayName: e.target.value})}
                    placeholder="Enter display name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({...settings, timezone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Intl.supportedValuesOf('timeZone').map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailAlerts"
                      checked={settings.emailAlerts}
                      onCheckedChange={(checked) => setSettings({...settings, emailAlerts: checked as boolean})}
                    />
                    <Label htmlFor="emailAlerts" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Receive email alerts for price changes
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pushAlerts"
                      checked={settings.pushAlerts}
                      onCheckedChange={(checked) => setSettings({...settings, pushAlerts: checked as boolean})}
                    />
                    <Label htmlFor="pushAlerts" className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Receive push notifications
                    </Label>
                  </div>
                </div>
              </div>
              
              {settingsMessage && (
                <div className={`p-3 rounded-md flex items-center gap-2 ${
                  settingsMessage.type === 'success' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {settingsMessage.type === 'success' ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {settingsMessage.text}
                </div>
              )}
              
              <Button
                onClick={saveSettings}
                disabled={savingSettings}
                className="btn-enhanced w-full sm:w-auto"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="card-enhanced hover-lift mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowPwModal(true)}
                  variant="outline"
                  className="btn-enhanced hover-lift flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Change Password
                </Button>
                
                <Button asChild variant="outline" className="btn-enhanced hover-lift flex items-center gap-2">
                  <Link href="/portfolio">
                    <Star className="w-4 h-4" />
                    My Portfolio
                  </Link>
                </Button>
                
                <Button asChild variant="destructive" className="btn-enhanced hover-lift flex items-center gap-2">
                  <Link href="/sign-in">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-red-500/5 hover-lift animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          <Button
            onClick={() => setShowDelete(true)}
            variant="destructive"
            className="btn-enhanced hover-lift flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password (min. 6 chars)"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    minLength={6}
                  />
                </div>
              </div>
              
              {pwError && (
                <div className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="p-3 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {pwSuccess}
                </div>
              )}
              
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={changePassword}
                  disabled={pwLoading}
                  className="btn-enhanced min-w-[120px]"
                >
                  {pwLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowPwModal(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setPwError("");
                    setPwSuccess("");
                  }}
                  disabled={pwLoading}
                  variant="outline"
                  className="btn-enhanced"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
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
              <p className="text-muted-foreground">
                This action cannot be undone. This will permanently delete your account and remove all your data.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
                </Label>
                <Input
                  id="deleteConfirmation"
                  type="text"
                  className="text-center font-mono"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              
              {pwError && (
                <div className="p-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {pwError}
                </div>
              )}
              
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={deleteAccount}
                  disabled={isDeleting || deleteConfirmation !== "DELETE"}
                  variant="destructive"
                  className="btn-enhanced min-w-[120px]"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowDelete(false);
                    setDeleteConfirmation("");
                    setPwError("");
                  }}
                  disabled={isDeleting}
                  variant="outline"
                  className="btn-enhanced"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
