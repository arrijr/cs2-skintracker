// frontend/src/context/ErrorContext.tsx — [Frontend]
// {/* Global Error Context for managing app-wide errors and notifications */}

"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { setErrorContext } from "@/lib/http";

interface ErrorState {
  globalError: string | null;
  type: "error" | "warning" | "info" | "success";
  persistent: boolean;
}

interface ErrorContextType {
  error: ErrorState;
  showError: (message: string, type?: ErrorState["type"], persistent?: boolean) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  clearError: () => void;
  showToast: (message: string, type?: "success" | "error" | "loading") => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorState>({
    globalError: null,
    type: "error",
    persistent: false,
  });

  const showError = useCallback((
    message: string, 
    type: ErrorState["type"] = "error", 
    persistent = false
  ) => {
    setError({ globalError: message, type, persistent });
    
    // Also show toast for immediate feedback
    if (type === "error") {
      toast.error(message, { duration: persistent ? 0 : 4000 });
    } else if (type === "warning") {
      toast(message, { 
        icon: "⚠️", 
        duration: persistent ? 0 : 4000,
        style: {
          background: "#f59e0b",
          color: "#fff",
        },
      });
    } else if (type === "info") {
      toast(message, { 
        icon: "ℹ️", 
        duration: persistent ? 0 : 4000,
        style: {
          background: "#3b82f6",
          color: "#fff",
        },
      });
    } else if (type === "success") {
      toast.success(message, { duration: 4000 });
    }
  }, []);

  const showSuccess = useCallback((message: string) => {
    showError(message, "success", false);
  }, [showError]);

  const showWarning = useCallback((message: string) => {
    showError(message, "warning", false);
  }, [showError]);

  const showInfo = useCallback((message: string) => {
    showError(message, "info", false);
  }, [showError]);

  const clearError = useCallback(() => {
    setError({ globalError: null, type: "error", persistent: false });
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "loading" = "success") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else if (type === "loading") {
      toast.loading(message);
    }
  }, []);

  // Set error context for HTTP client
  useEffect(() => {
    setErrorContext({
      showError,
      showSuccess,
      showWarning,
      showInfo,
      clearError,
      showToast,
    });
  }, [showError, showSuccess, showWarning, showInfo, clearError, showToast]);

  return (
    <ErrorContext.Provider
      value={{
        error,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        clearError,
        showToast,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}
