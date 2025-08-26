"use client";
import { useAuth } from "../context/AuthContext";
import { useRequireAuth } from "../hooks/useRequireAuth";
import Link from "next/link";
import { LogOut, User2, Star, Eye, Trash2, Settings, Shield, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/http";

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
  const { user, token, loading, logout } = useAuth();
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
    if (token) {
      loadProfileData();
      loadKPIData();
    }
  }, [token]);

  const loadProfileData = async () => {
    try {
      const data = await apiFetch("/api/v1/users/me");
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
      const kpiResponse = await apiFetch("/api/v1/portfolio/kpis");
      
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
      const updatedProfile = await apiFetch("/api/v1/users/me", {
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
      await apiFetch("/api/v1/users/me/password", {
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
      await apiFetch("/api/v1/users/me", { method: "DELETE" });
      logout();
      window.location.href = "/";
    } catch (error) {
      setPwError("Failed to delete account");
      setIsDeleting(false);
    }
  };

  // Show loading state while auth is being checked
  if (token === undefined || !user) {
    return <div className="text-white p-6">Loading...</div>;
  }

  if (loadingProfile || loadingKPI) {
    return <div className="text-white p-6">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 mt-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-zinc-400">Manage your account settings and preferences</p>
      </div>

      {/* Overview Section */}
      <div className="bg-zinc-900 rounded-xl p-6 mb-8">
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
              {profileData?.displayName || user.username || "User"}
            </div>
            <div className="text-zinc-400">{profileData?.email}</div>
            <div className="text-sm text-zinc-500">
              Member since {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : "Unknown"}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{kpiData?.portfolioCount || 0}</div>
            <div className="text-xs text-zinc-400">Portfolio Skins</div>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-green-400">
              ${kpiData?.portfolioValue?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-zinc-400">Total Value</div>
            <div className="text-xs text-zinc-500">
              {kpiData?.portfolioChange24h !== 0 && kpiData && (
                <span className={kpiData.portfolioChange24h > 0 ? "text-green-400" : "red-400"}>
                  {kpiData.portfolioChange24h > 0 ? "+" : ""}{kpiData.portfolioChange24h.toFixed(1)}% 24h
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-blue-400">
              ${kpiData?.totalInvested?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-zinc-400">Total Invested</div>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-purple-400">
              ${kpiData?.unrealizedPL?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-zinc-400">Unrealized P/L</div>
            <div className="text-xs text-zinc-500">
              {kpiData?.portfolioChange7d !== 0 && kpiData && (
                <span className={kpiData.portfolioChange7d > 0 ? "text-green-400" : "text-red-400"}>
                  {kpiData.portfolioChange7d > 0 ? "+" : ""}{kpiData.portfolioChange7d.toFixed(1)}% 7d
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{kpiData?.watchlistCount || 0}</div>
            <div className="text-xs text-zinc-400">Watchlist</div>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{kpiData?.activeAlerts || 0}</div>
            <div className="text-xs text-zinc-400">Active Alerts</div>
          </div>
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
      <div className="bg-zinc-900 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              className="input-main w-full"
              value={settings.displayName}
              onChange={(e) => setSettings({...settings, displayName: e.target.value})}
              placeholder="Enter display name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              className="input-main w-full"
              value={settings.timezone}
              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
            >
              <option value="">Select timezone</option>
              {Intl.supportedValuesOf('timeZone').map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked})}
              className="rounded"
            />
            <span>Receive email alerts for price changes</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.pushAlerts}
              onChange={(e) => setSettings({...settings, pushAlerts: e.target.checked})}
              className="rounded"
            />
            <span>Receive push notifications</span>
          </label>
        </div>
        
        {settingsMessage && (
          <div className={`mt-4 p-3 rounded ${
            settingsMessage.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}>
            {settingsMessage.text}
          </div>
        )}
        
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="btn-main mt-4 flex items-center gap-2"
        >
          {savingSettings ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={() => setShowPwModal(true)}
          className="btn-main flex items-center gap-2"
        >
          <Shield className="w-5 h-5" />
          Change Password
        </button>
        
        <Link
          href="/portfolio"
          className="btn-main flex items-center gap-2"
        >
          <Star className="w-5 h-5" />
          My Portfolio
        </Link>
        
        <button
          onClick={logout}
          className="btn-main bg-red-700 hover:bg-red-800 flex items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        
        <p className="text-zinc-300 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        <button
          onClick={() => setShowDelete(true)}
          className="btn-main bg-red-700 hover:bg-red-800 flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Delete Account
        </button>
      </div>

      {/* Password Change Modal */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-xl p-8 shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Change Password</h2>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current password"
                className="input-main w-full"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              />
              
              <input
                type="password"
                placeholder="New password (min. 6 chars)"
                className="input-main w-full"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                minLength={6}
              />
              
              <input
                type="password"
                placeholder="Confirm new password"
                className="input-main w-full"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                minLength={6}
              />
            </div>
            
            {pwError && <div className="text-red-400 mt-3 text-sm">{pwError}</div>}
            {pwSuccess && <div className="text-green-400 mt-3 text-sm">{pwSuccess}</div>}
            
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={changePassword}
                disabled={pwLoading}
                className="btn-main min-w-[100px]"
              >
                {pwLoading ? "Changing..." : "Change Password"}
              </button>
              <button
                onClick={() => {
                  setShowPwModal(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPwError("");
                  setPwSuccess("");
                }}
                disabled={pwLoading}
                className="btn-main"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-xl p-8 shadow-lg w-full max-w-md text-center">
            <h2 className="text-xl font-bold mb-4 text-red-400">Delete Account</h2>
            <p className="mb-4 text-zinc-300">
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                className="input-main w-full text-center font-mono"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            
            {pwError && <div className="text-red-400 mb-3 text-sm">{pwError}</div>}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={deleteAccount}
                disabled={isDeleting || deleteConfirmation !== "DELETE"}
                className="btn-main bg-red-700 hover:bg-red-800 min-w-[100px]"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
              <button
                onClick={() => {
                  setShowDelete(false);
                  setDeleteConfirmation("");
                  setPwError("");
                }}
                disabled={isDeleting}
                className="btn-main"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
