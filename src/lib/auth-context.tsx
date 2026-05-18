"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  pin: string;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  status: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        setIsAuthenticated(false);
        setPin("");
        setStatus("Session expired (Auto-locked)");
      }, 5 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const login = useCallback(async (password: string) => {
    setStatus("Verifying...");
    try {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ password, action: "verify" }),
      });
      if (response.ok) {
        setPin(password);
        setIsAuthenticated(true);
        setStatus("");
        return true;
      } else {
        const data = await response.json();
        setStatus(
          `Unauthorized${data.debug ? ` (received ${data.debug.receivedLength} chars, expected ${data.debug.expectedLength})` : ""}`
        );
        return false;
      }
    } catch {
      setStatus("Server error. Check Vercel logs.");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setPin("");
    setStatus("Locked");
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, pin, login, logout, status }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
