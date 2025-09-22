"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, Activity, Clock, Database, AlertTriangle, CheckCircle, XCircle, RefreshCw, BarChart3, Settings, FileText } from "lucide-react";
import BuildInfo from "../components/BuildInfo";
import AdminMiniMetrics from "../components/AdminMiniMetrics";
import { safeLower } from "@/lib/strings";
import { apiUrl, fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatUSD, safeToFixed } from "@/lib/num";

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
  const { isAdmin } = useUserRole();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [logs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && isAdmin) {
      loadAdminData();
    }
  }, [isLoaded, isSignedIn, isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [overviewRes, jobsRes, logsRes] = await Promise.all([
        fetchJson(apiUrl("/api/v1/admin/overview")),
        fetchJson(apiUrl("/api/v1/admin/jobs")),
        fetchJson(apiUrl("/api/v1/admin/logs"))
      ]);

      setOverview(overviewRes as AdminOverview);
      setJobs((jobsRes as any).jobs); // Type assertion for jobs
      setAdminLogs((logsRes as any).logs); // Type assertion for logs
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
    switch (status.toLowerCase()) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return <div className="text-white p-6">Loading...</div>;
  }

  // Redirect if not signed in or not admin
  if (!isSignedIn || !isAdmin) {
    return (
      <div className="dashboard-bg text-white flex items-center justify-center">
        <div className="text-center relative z-10">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg text-white">
      <div className="container-cs2 section-cs2 relative z-10">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-brand-orange" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)} className="w-full animate-slide-up">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Logs
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">System Overview</h2>
                <Button
                  onClick={loadAdminData}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="btn-enhanced"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            
              {/* Build Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BuildInfo showDetails={true} />
                <Card className="card-enhanced hover-lift">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Status:</span>
                        <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                          Online
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Database:</span>
                        <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                          Connected
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clerk Auth:</span>
                        <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Mini Metrics */}
              <AdminMiniMetrics showDetails={true} />
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="card-enhanced hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <h3 className="font-medium">Last Price Update</h3>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {overview ? formatTimestamp(overview.lastPriceUpdate) : "—"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-enhanced hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5 text-green-400" />
                      <h3 className="font-medium">Prices (24h)</h3>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {overview?.pricesWritten24h || "—"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-enhanced hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-medium">Coverage</h3>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {overview?.priceCoverage || "—"}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-enhanced hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-orange-400" />
                      <h3 className="font-medium">Portfolio Snapshot</h3>
                    </div>
                    <div className="text-2xl font-bold text-orange-400">
                      {overview ? formatTimestamp(overview.portfolioSnapshotLastRun) : "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts Summary */}
              {overview?.alerts24h && (
                <Card className="card-enhanced hover-lift">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Alerts Summary (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {overview.alerts24h.alertsChecked24h}
                        </div>
                        <div className="text-sm text-muted-foreground">Checked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {overview.alerts24h.alertsSent24h}
                        </div>
                        <div className="text-sm text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {overview.alerts24h.alertsSkipped24h}
                        </div>
                        <div className="text-sm text-muted-foreground">Skipped</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Cron Jobs</h2>
                <Button
                  onClick={loadAdminData}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="btn-enhanced"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            
              <Card>
                <CardHeader>
                  <CardTitle>Job Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobs.map((job, index) => (
                      <Card key={index} className="card-enhanced hover-lift">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">{job.name}</h3>
                            <Badge
                              variant={job.status === "success" ? "default" : job.status === "error" ? "destructive" : "secondary"}
                              className={
                                job.status === "success"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : job.status === "error"
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              {job.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Last Run</p>
                              <p className="font-medium">{formatTimestamp(job.lastRun)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Duration</p>
                              <p className="font-medium">{job.duration}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Results</p>
                              <div className="space-y-1">
                                {Object.entries(job.resultCounts).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    {key}: {value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Audit Logs</h2>
                <Button
                  onClick={loadAdminData}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="btn-enhanced"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <Card key={log.id} className="card-enhanced hover-lift">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {log.action}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {log.resource}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(log.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <p className="text-muted-foreground mb-1">
                              User: {log.user.email}
                            </p>
                            {log.details && (
                              <p className="text-muted-foreground">
                                {log.details}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No logs available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}