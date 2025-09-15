// /frontend/src/app/components/AdminMiniMetrics.tsx (Frontend)
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Heart, 
  Package, 
  TrendingUp, 
  Activity, 
  Clock,
  Database,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { apiUrl, fetchJson } from "@/lib/api";

interface AdminMetrics {
  users: {
    total: number;
    admins: number;
    regular: number;
    growth24h: number;
    growthRate: string;
  };
  watchlist: {
    totalItems: number;
    uniqueSkins: number;
    growth24h: number;
    growthRate: string;
  };
  portfolio: {
    totalItems: number;
    totalValue: number;
    uniqueUsers: number;
    growth24h: number;
    growthRate: string;
  };
  priceHistory: {
    totalEntries: number;
    uniqueSkins: number;
    last24h: number;
    coverage: string;
  };
  portfolioHistory: {
    totalEntries: number;
    avgValue: number;
    uniqueUsers: number;
  };
  transactions: {
    total: number;
    totalValue: number;
    last24h: number;
    byType: Array<{
      type: string;
      count: number;
      value: number;
    }>;
  };
  jobs: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
    byJob: Array<{
      jobName: string;
      status: string;
      count: number;
    }>;
  };
  system: {
    health: {
      database: string;
      api: string;
      cron: string;
      memory: string;
    };
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
    timestamp: string;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    details: string | null;
    userEmail: string;
    createdAt: string;
  }>;
}

interface AdminMiniMetricsProps {
  className?: string;
  showDetails?: boolean;
}

export default function AdminMiniMetrics({ className = "", showDetails = false }: AdminMiniMetricsProps) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchJson(apiUrl('/api/v1/admin/metrics/overview'));
      
      if (response.success) {
        setMetrics(response.metrics);
        setLastRefresh(new Date());
      } else {
        throw new Error(response.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-3 w-3" />;
      case 'warning': return <AlertTriangle className="h-3 w-3" />;
      case 'error': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (loading && !metrics) {
    return (
      <Card className={`card-brand ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-neutral-400">Loading metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !metrics) {
    return (
      <Card className={`card-brand ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">Metrics unavailable</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchMetrics}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>System Metrics</span>
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchMetrics}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {lastRefresh && (
            <span className="text-xs text-neutral-500">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <Card className="card-brand">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-brand-blue" />
              <Badge variant="outline" className="text-xs">
                +{metrics.users.growth24h}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-brand-blue">
              {formatNumber(metrics.users.total)}
            </div>
            <div className="text-xs text-neutral-400">
              {metrics.users.admins} admins, {metrics.users.regular} users
            </div>
            <div className="text-xs text-brand-green mt-1">
              +{metrics.users.growthRate}% 24h
            </div>
          </CardContent>
        </Card>

        {/* Watchlist */}
        <Card className="card-brand">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-4 w-4 text-brand-orange" />
              <Badge variant="outline" className="text-xs">
                +{metrics.watchlist.growth24h}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-brand-orange">
              {formatNumber(metrics.watchlist.totalItems)}
            </div>
            <div className="text-xs text-neutral-400">
              {metrics.watchlist.uniqueSkins} unique skins
            </div>
            <div className="text-xs text-brand-green mt-1">
              +{metrics.watchlist.growthRate}% 24h
            </div>
          </CardContent>
        </Card>

        {/* Portfolio */}
        <Card className="card-brand">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-4 w-4 text-brand-green" />
              <Badge variant="outline" className="text-xs">
                +{metrics.portfolio.growth24h}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-brand-green">
              ${formatNumber(metrics.portfolio.totalValue)}
            </div>
            <div className="text-xs text-neutral-400">
              {metrics.portfolio.totalItems} items, {metrics.portfolio.uniqueUsers} users
            </div>
            <div className="text-xs text-brand-green mt-1">
              +{metrics.portfolio.growthRate}% 24h
            </div>
          </CardContent>
        </Card>

        {/* Price History */}
        <Card className="card-brand">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-brand-blue" />
              <Badge variant="outline" className="text-xs">
                {metrics.priceHistory.last24h}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-brand-blue">
              {formatNumber(metrics.priceHistory.totalEntries)}
            </div>
            <div className="text-xs text-neutral-400">
              {metrics.priceHistory.uniqueSkins} skins tracked
            </div>
            <div className="text-xs text-brand-green mt-1">
              {metrics.priceHistory.coverage}% coverage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="card-brand">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Server className="h-4 w-4" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">Database:</span>
              <div className={`flex items-center space-x-1 ${getHealthColor(metrics.system.health.database)}`}>
                {getHealthIcon(metrics.system.health.database)}
                <span className="text-xs capitalize">{metrics.system.health.database}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">API:</span>
              <div className={`flex items-center space-x-1 ${getHealthColor(metrics.system.health.api)}`}>
                {getHealthIcon(metrics.system.health.api)}
                <span className="text-xs capitalize">{metrics.system.health.api}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">Cron:</span>
              <div className={`flex items-center space-x-1 ${getHealthColor(metrics.system.health.cron)}`}>
                {getHealthIcon(metrics.system.health.cron)}
                <span className="text-xs capitalize">{metrics.system.health.cron}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">Memory:</span>
              <div className={`flex items-center space-x-1 ${getHealthColor(metrics.system.health.memory)}`}>
                {getHealthIcon(metrics.system.health.memory)}
                <span className="text-xs">{metrics.system.memory.used}MB</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-neutral-700">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Uptime: {formatUptime(metrics.system.uptime)}</span>
              <span>Jobs: {metrics.jobs.successful}/{metrics.jobs.total} ({metrics.jobs.successRate}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {showDetails && metrics.recentActivity.length > 0 && (
        <Card className="card-brand">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {metrics.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-400">{activity.action}</span>
                    {activity.details && (
                      <span className="text-neutral-500 truncate max-w-xs">
                        {activity.details}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-neutral-500">
                    <span>{activity.userEmail}</span>
                    <span>{new Date(activity.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
