// frontend/src/components/ErrorBanner.tsx — [Frontend]
// {/* Global Error Banner for API errors and system notifications */}

"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useError } from "@/context/ErrorContext";

interface ErrorBannerProps {
  error?: string | null;
  type?: "error" | "warning" | "info" | "success";
  onRetry?: () => void;
  onDismiss?: () => void;
  persistent?: boolean;
  showNetworkStatus?: boolean;
}

export default function ErrorBanner({
  error: propError,
  type: propType = "error",
  onRetry,
  onDismiss,
  persistent = false,
  showNetworkStatus = true,
}: ErrorBannerProps) {
  const { error: contextError, clearError } = useError();
  const [isOnline, setIsOnline] = useState(true);
  
  // Use context error if no prop error provided
  const error = propError ?? contextError.globalError;
  const type = propType ?? contextError.type;
  const isPersistent = persistent || contextError.persistent;
  const [isVisible, setIsVisible] = useState(!!error);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-dismiss non-persistent errors
  useEffect(() => {
    if (error && !isPersistent) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
        if (!propError) clearError(); // Clear context error if using context
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, isPersistent, onDismiss, propError, clearError]);

  // Update visibility when error changes
  useEffect(() => {
    setIsVisible(!!error);
  }, [error]);

  // Show network status if offline
  if (showNetworkStatus && !isOnline) {
    return (
      <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-3">
        <div className="container-cs2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-orange-400" />
            <span className="text-orange-400 font-medium">
              You're offline. Some features may not work.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-orange-400 hover:text-orange-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Show error banner if error exists and is visible
  if (!error || !isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      case "warning":
        return "bg-orange-500/10 border-orange-500/20 text-orange-400";
      case "info":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-400";
      default:
        return "bg-red-500/10 border-red-500/20 text-red-400";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
        return <Wifi className="h-5 w-5" />;
      case "success":
        return <Wifi className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className={`border-b px-4 py-3 ${getTypeStyles()}`}>
      <div className="container-cs2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="font-medium">{error}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="text-current hover:bg-current/10"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          
          {(onDismiss || !propError) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                onDismiss?.();
                if (!propError) clearError(); // Clear context error if using context
              }}
              className="text-current hover:bg-current/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
