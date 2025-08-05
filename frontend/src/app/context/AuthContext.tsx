"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: any;
  token: string | null | undefined;
  loading: boolean;
  login: (token: string, user: any) => void;
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
  const [user, setUser] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Token & User aus LocalStorage holen (nur einmalig nach Mount)
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
    } else {
      setToken(null);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
        localStorage.removeItem("user");
      }
    } else {
      setUser(null);
    }

    setLoading(false); // Nach erstem Check: Laden beendet!
  }, []);

  const login = (token: string, user: any) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
