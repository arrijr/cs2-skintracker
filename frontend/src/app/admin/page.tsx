"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, Activity, Clock, Database, AlertTriangle, CheckCircle, XCircle, RefreshCw, BarChart3, Settings, FileText, Search, TrendingUp, BookOpen, Edit, Users } from "lucide-react";
import BuildInfo from "../components/BuildInfo";
import AdminMiniMetrics from "../components/AdminMiniMetrics";
import { apiUrl, fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeToFixed } from "@/lib/num";
import AdminControls from "../components/AdminControls";
import UsersPanel from "../components/admin/UsersPanel";
import { AppShell } from "@/components/layout/AppShell";

type AdminTab = "overview" | "jobs" | "logs" | "controls" | "coverage" | "users";

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

interface CoverageOverview {
  totalSkins: number;
  skinsWithRecentPrices: number;
  coveragePercentage: number;
  skinsWithoutHistory: number;
  medianLastPriceAge: string | null;
  sevenDaysAgo: string;
  thirtyDaysAgo: string;
}

interface SegmentCoverage {
  segment: string;
  totalSkins: number;
  coveragePercentage: number;
  stalePercentage: number;
  withoutHistory: number;
  withRecentPrices: number;
}

interface MissingSkin {
  id: number;
  name: string;
  category: string;
  rarity: string;
  wear: string;
  lastPriceUpdate: string | null;
  hadPrice: boolean;
  watchlistCount: number;
  daysSinceUpdate: number | null;
}

export default function AdminPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { isAdmin } = useUserRole();
  const { getToken } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [logs, setAdminLogs] = useState<AdminLog[]>([]);
  const [coverageOverview, setCoverageOverview] = useState<CoverageOverview | null>(null);
  const [segmentCoverage, setSegmentCoverage] = useState<SegmentCoverage[]>([]);
  const [missingSkins, setMissingSkins] = useState<MissingSkin[]>([]);
  const [coverageSegmentType, setCoverageSegmentType] = useState<'weaponType' | 'rarity' | 'wear'>('weaponType');
  const [coveragePage, setCoveragePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && isAdmin) {
      loadAdminData();
    }
  }, [isLoaded, isSignedIn, isAdmin]);

  useEffect(() => {
    if (activeTab === "coverage" && isLoaded && isSignedIn && isAdmin) {
      loadCoverageData();
    }
  }, [activeTab, coverageSegmentType, coveragePage, isLoaded, isSignedIn, isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken({ template: "backend" });
      const authHeaders = { ...(token && { Authorization: `Bearer ${token}` }) } as Record<string, string>;
      const [overviewRes, jobsRes, logsRes] = await Promise.all([
        fetchJson(apiUrl("/api/v1/admin/overview"), { headers: authHeaders }),
        fetchJson(apiUrl("/api/v1/admin/jobs"), { headers: authHeaders }),
        fetchJson(apiUrl("/api/v1/admin/logs"), { headers: authHeaders })
      ]);

      setOverview(overviewRes as AdminOverview);
      setJobs((jobsRes as any).jobs); // Type assertion for jobs
      // Normalize logs to always have user.email
      const rawLogs = (logsRes as any).logs as any[];
      const normalizedLogs = (rawLogs || []).map((l) => ({
        ...l,
        user: l.user ?? l.admin ?? { email: "System" }
      }));
      setAdminLogs(normalizedLogs as AdminLog[]);
    } catch (err) {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const loadCoverageData = async () => {
    try {
      const token = await getToken({ template: "backend" });
      const authHeaders = { ...(token && { Authorization: `Bearer ${token}` }) } as Record<string, string>;
      
      const [overviewRes, segmentRes, missingRes] = await Promise.all([
        fetchJson(apiUrl("/api/v1/admin/coverage/overview"), { headers: authHeaders }),
        fetchJson(apiUrl(`/api/v1/admin/coverage/segments?segmentType=${coverageSegmentType}&page=${coveragePage}&limit=20`), { headers: authHeaders }),
        fetchJson(apiUrl("/api/v1/admin/coverage/missing-skins?limit=50"), { headers: authHeaders })
      ]);

      setCoverageOverview(overviewRes as CoverageOverview);
      setSegmentCoverage((segmentRes as any).coverage || []);
      setMissingSkins((missingRes as any) || []);
    } catch (err) {
      console.error("Failed to load coverage data:", err);
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
    return (
      <AppShell eyebrow="Admin" title="Admin Panel">
        <div className="h-32 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
      </AppShell>
    );
  }

  // Redirect if not signed in or not admin
  if (!isSignedIn || !isAdmin) {
    return (
      <AppShell eyebrow="Admin" title="Access Denied">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Shield className="w-16 h-16 text-red-400" />
          <p className="text-slate-400">You need admin privileges to access this page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="System"
      title="Admin Panel"
      description="System monitoring and administration"
      maxWidth="7xl"
    >
      <div className="animate-fade-in">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as AdminTab)} className="w-full animate-slide-up">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="grid w-max grid-cols-6 sm:w-full">
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
              <TabsTrigger value="coverage" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Coverage
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="controls" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Controls
              </TabsTrigger>
            </TabsList>
            </div>

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
              <div data-testid="admin-metrics">
                <AdminMiniMetrics showDetails={true} />
              </div>

              {/* Quick Actions */}
              <Card className="card-enhanced hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a 
                      href="/admin/blog" 
                      className="flex items-center gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                    >
                      <BookOpen className="w-6 h-6 text-brand-celadon-400 group-hover:text-brand-celadon-300" />
                      <div>
                        <div className="font-medium">Manage Blog</div>
                        <div className="text-sm text-muted-foreground">View all posts</div>
                      </div>
                    </a>

                    <a 
                      href="/admin/blog/editor" 
                      className="flex items-center gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                    >
                      <Edit className="w-6 h-6 text-brand-celadon-400 group-hover:text-brand-celadon-300" />
                      <div>
                        <div className="font-medium">New Blog Post</div>
                        <div className="text-sm text-muted-foreground">Create article</div>
                      </div>
                    </a>

                    <a 
                      href="/admin/update-prices" 
                      className="flex items-center gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                    >
                      <RefreshCw className="w-6 h-6 text-brand-celadon-400 group-hover:text-brand-celadon-300" />
                      <div>
                        <div className="font-medium">Update Prices</div>
                        <div className="text-sm text-muted-foreground">Manual trigger</div>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
              
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
                    {jobs.map((job: AdminJob, index: number) => (
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
                    {logs.map((log: AdminLog) => (
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

            {/* Coverage Tab */}
            <TabsContent value="coverage" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Data Coverage Explorer</h2>
                <Button 
                  onClick={loadCoverageData} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
              <p className="text-muted-foreground">Analyze data quality and identify missing or stale price information.</p>

              {/* Coverage Overview */}
              {coverageOverview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Skins</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{coverageOverview.totalSkins.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Coverage</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{safeToFixed(coverageOverview.coveragePercentage, 1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        {coverageOverview.skinsWithRecentPrices.toLocaleString()} with recent prices
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Missing History</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{coverageOverview.skinsWithoutHistory.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        No price data in 30 days
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Median Age</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {coverageOverview.medianLastPriceAge 
                          ? Math.floor((Date.now() - new Date(coverageOverview.medianLastPriceAge).getTime()) / (1000 * 60 * 60 * 24))
                          : "—"
                        }d
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Since last update
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Segment Analysis */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Coverage by Segment</CardTitle>
                    <Select
                      value={coverageSegmentType}
                      onValueChange={(v) => {
                        setCoverageSegmentType(v as 'weaponType' | 'rarity' | 'wear');
                        setCoveragePage(1);
                      }}
                    >
                      <SelectTrigger className="w-36 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weaponType">Weapon Type</SelectItem>
                        <SelectItem value="rarity">Rarity</SelectItem>
                        <SelectItem value="wear">Wear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {segmentCoverage.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-slate-700/50 rounded-xl bg-slate-800/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{segment.segment}</span>
                            <Badge variant="outline">{segment.totalSkins} skins</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Coverage: {safeToFixed(segment.coveragePercentage, 1)}%</span>
                            <span>Stale: {safeToFixed(segment.stalePercentage, 1)}%</span>
                            <span>No History: {segment.withoutHistory}</span>
                          </div>
                        </div>
                        <div className="w-32">
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                segment.coveragePercentage >= 95 ? 'bg-brand-green' :
                                segment.coveragePercentage >= 80 ? 'bg-yellow-400' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(segment.coveragePercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Missing Skins */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Missing Skins</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Skins without recent price data, ordered by relevance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {missingSkins.slice(0, 20).map((skin) => (
                      <div key={skin.id} className="flex items-center justify-between p-3 border border-slate-700/50 rounded-xl bg-slate-800/30">
                        <div className="flex-1">
                          <div className="font-medium">{skin.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {skin.category} • {skin.rarity} • {skin.wear}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {skin.hadPrice && <Badge variant="outline">Had Price</Badge>}
                          {skin.watchlistCount > 0 && (
                            <Badge variant="secondary">{skin.watchlistCount} watchlists</Badge>
                          )}
                          {skin.daysSinceUpdate && (
                            <span>{skin.daysSinceUpdate}d ago</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 mt-6">
              <UsersPanel />
            </TabsContent>

            <TabsContent value="controls" className="space-y-6 mt-6">
              <h2 className="text-2xl font-semibold mb-2">Controls</h2>
              <p className="text-muted-foreground mb-4">Safeguarded admin operations. In production, writes are disabled unless explicitly enabled via environment.</p>
              <AdminControls />
            </TabsContent>
          </Tabs>
      </div>
    </AppShell>
  );
}