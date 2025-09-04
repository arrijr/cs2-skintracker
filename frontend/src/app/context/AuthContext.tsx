"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuth, clearAuth, getCurrentUser, isAuthenticated, AuthUser } from "@/lib/auth";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null | undefined;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: undefined, // Start mit undefined = noch nicht geladen
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use hardened auth utilities to load user state
    try {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        const storedToken = localStorage.getItem("token");
        
        if (currentUser && storedToken) {
          setUser(currentUser);
          setToken(storedToken);
        } else {
          // Invalid state, clear everything
          clearAuth();
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error("🚨 Error loading auth state:", error);
      clearAuth();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token: string, user: AuthUser) => {
    try {
      setAuth(token, user);
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error("🚨 Error during login:", error);
      clearAuth();
      setToken(null);
      setUser(null);
    }
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
