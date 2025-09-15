// /frontend/src/app/components/BuildInfo.tsx (Frontend)
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  GitBranch, 
  GitCommit, 
  Calendar, 
  Clock, 
  Server, 
  Code,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { safeLower } from "@/lib/strings";

interface BuildInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  gitBranch: string;
  nodeVersion: string;
  environment: string;
  lastDeploy: string;
  uptime: string;
}

interface BuildInfoProps {
  showDetails?: boolean;
  className?: string;
}

export default function BuildInfo({ showDetails = false, className = "" }: BuildInfoProps) {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(showDetails);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchBuildInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { apiFetch } = await import('@/lib/http');
      const response = await apiFetch('/api/v1/health/build-info');
      
      if (response.ok) {
        setBuildInfo(response);
        setLastRefresh(new Date());
      } else {
        throw new Error(response.error || 'Failed to fetch build info');
      }
    } catch (err) {
      console.error('Error fetching build info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to static build info
      setBuildInfo({
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
        gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown',
        gitBranch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'main',
        nodeVersion: process.env.NEXT_PUBLIC_NODE_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        lastDeploy: process.env.NEXT_PUBLIC_LAST_DEPLOY || new Date().toISOString(),
        uptime: '0s'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildInfo();
  }, []);

  const formatUptime = (uptime: string) => {
    const seconds = parseInt(uptime);
    if (isNaN(seconds)) return uptime;
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (safeLower(env)) {
      case 'production': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'staging': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'development': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading && !buildInfo) {
    return (
      <Card className={`card-brand ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-neutral-400">Loading build info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !buildInfo) {
    return (
      <Card className={`card-brand ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">Build info unavailable</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchBuildInfo}
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

  if (!buildInfo) return null;

  return (
    <Card className={`card-brand ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Build Info</span>
            <Badge className={getEnvironmentColor(buildInfo.environment)}>
              {buildInfo.environment}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchBuildInfo}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <GitCommit className="h-3 w-3 text-neutral-400" />
              <span className="text-neutral-400">Version:</span>
              <span className="font-mono text-brand-blue">{buildInfo.version}</span>
            </div>
            <div className="flex items-center space-x-2">
              <GitBranch className="h-3 w-3 text-neutral-400" />
              <span className="text-neutral-400">Branch:</span>
              <span className="font-mono text-brand-green">{buildInfo.gitBranch}</span>
            </div>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="space-y-2 pt-2 border-t border-neutral-700">
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <GitCommit className="h-3 w-3 text-neutral-400" />
                  <span className="text-neutral-400">Commit:</span>
                  <span className="font-mono text-neutral-300">{buildInfo.gitCommit.substring(0, 8)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-neutral-400" />
                  <span className="text-neutral-400">Built:</span>
                  <span className="text-neutral-300">{formatDate(buildInfo.buildTime)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Server className="h-3 w-3 text-neutral-400" />
                  <span className="text-neutral-400">Node:</span>
                  <span className="font-mono text-neutral-300">{buildInfo.nodeVersion}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-neutral-400" />
                  <span className="text-neutral-400">Uptime:</span>
                  <span className="text-brand-orange">{formatUptime(buildInfo.uptime)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-neutral-400" />
                  <span className="text-neutral-400">Deployed:</span>
                  <span className="text-neutral-300">{formatDate(buildInfo.lastDeploy)}</span>
                </div>
              </div>
              
              {lastRefresh && (
                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-700">
                  Last refreshed: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
