"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, Activity, Clock, Database, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import BuildInfo from "../components/BuildInfo";
import AdminMiniMetrics from "../components/AdminMiniMetrics";
import { safeLower } from "@/lib/strings";
import { apiUrl, fetchJson } from "@/lib/api";

type AdminTab = "overview" | "jobs" | "logs";

interface AdminOverview {
  lastPriceUpdate: string | null;
  pricesWritten24h: number;
  priceCoverage: number;
  portfolioSnapshotLastRun: string | null;
  alerts24h: {
    alertsChecked24h: number;
    alertsSent24h: number;
    alertsSkipped24h: number;
  };
}

interface AdminJob {
  name: string;
  lastRun: string;
  status: string;
  duration: string;
  resultCounts: Record<string, number>;
}

interface AdminLog {
  id: number;
  action: string;
  resource: string;
  details: string | null;
  createdAt: string;
  user: { email: string };
}

export default function AdminPage() {
  const { isSignedIn, isLoaded, user } = useUser();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [logs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use centralized role hook
  const { isAdmin } = useUserRole();

  // Load admin data if user is admin
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadAdminData();
  }, [isLoaded, isAdmin]);

  const loadAdminData = async () => {
    try {
      const [overviewRes, jobsRes, logsRes] = await Promise.all([
        fetchJson(apiUrl("/api/v1/admin/overview")),
        fetchJson(apiUrl("/api/v1/admin/jobs")),
        fetchJson(apiUrl("/api/v1/admin/logs"))
      ]);

      setOverview(overviewRes as AdminOverview);
      setJobs((jobsRes as any).jobs);
      setAdminLogs((logsRes as any).logs);
    } catch (err) {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (safeLower(status)) {
      case "completed":
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "running":
        return <Activity className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (safeLower(status)) {
      case "completed":
      case "success":
        return "text-green-400";
      case "failed":
      case "error":
        return "text-red-400";
      case "running":
        return "text-blue-400";
      default:
        return "text-yellow-400";
    }
  };

  // Show access denied for non-admins
  if (!loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <Shield className="w-24 h-24 mx-auto mb-6 text-red-400" />
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-6">
              You don't have permission to access the admin area.
            </p>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show loading
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <Activity className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
            <p>Checking admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container-cs2 section-cs2">
        <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-sm">
              Admin Only
            </span>
          </div>
          <p className="text-gray-400">
            System monitoring and administration (read-only)
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 animate-slide-up">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 btn-enhanced ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
            <Activity className="inline w-4 h-4 mr-2" />
            Overview
          </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 btn-enhanced ${
                activeTab === "jobs"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Clock className="inline w-4 h-4 mr-2" />
              Jobs
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 btn-enhanced ${
                activeTab === "logs"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
            <Database className="inline w-4 h-4 mr-2" />
            Logs
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">System Overview</h2>
            
            {/* Build Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BuildInfo showDetails={true} />
              <div className="card-brand">
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>System Status</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">API Status:</span>
                      <span className="text-brand-green">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Database:</span>
                      <span className="text-brand-green">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Clerk Auth:</span>
                      <span className="text-brand-green">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Mini Metrics */}
            <AdminMiniMetrics showDetails={true} />
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-brand card-enhanced hover-lift p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="font-medium">Last Price Update</h3>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {overview ? formatTimestamp(overview.lastPriceUpdate) : "—"}
                </div>
              </div>

              <div className="card-brand card-enhanced hover-lift p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-green-400" />
                  <h3 className="font-medium">Prices (24h)</h3>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {overview?.pricesWritten24h || "—"}
                </div>
              </div>

              <div className="card-brand card-enhanced hover-lift p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h3 className="font-medium">Price Coverage</h3>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {overview ? `${overview.priceCoverage}%` : "—"}
                </div>
              </div>

              <div className="card-brand card-enhanced hover-lift p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h3 className="font-medium">Portfolio Snapshot</h3>
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {overview ? formatTimestamp(overview.portfolioSnapshotLastRun) : "—"}
                </div>
              </div>
            </div>

            {/* Alerts Summary */}
            {overview && (
              <div className="card-brand card-enhanced hover-lift p-6">
                <h3 className="text-lg font-medium mb-4">Alerts (24h)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {overview.alerts24h.alertsChecked24h}
                    </div>
                    <div className="text-sm text-gray-400">Checked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {overview.alerts24h.alertsSent24h}
                    </div>
                    <div className="text-sm text-gray-400">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {overview.alerts24h.alertsSkipped24h}
                    </div>
                    <div className="text-sm text-gray-400">Skipped</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Cron Jobs</h2>
            
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Job Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Results
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {jobs.map((job, index) => (
                    <tr key={index} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{job.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatTimestamp(job.lastRun)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className={getStatusColor(job.status)}>
                            {job.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {job.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {Object.entries(job.resultCounts).map(([key, value]) => (
                            <div key={key} className="text-gray-300">
                              {key}: {value}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Audit Logs</h2>
            
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{log.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.action === 'view' ? 'bg-blue-600/20 text-blue-400' :
                          log.action === 'create' ? 'bg-green-600/20 text-green-400' :
                          log.action === 'update' ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-red-600/20 text-red-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 max-w-xs truncate">
                          {log.details || "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No logs available
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
