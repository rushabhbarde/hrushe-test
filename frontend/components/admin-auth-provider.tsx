"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import {
  clearAdminToken,
  getAdminAuthHeaders,
  setAdminToken,
} from "@/lib/admin-auth";

type AdminAuthContextValue = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

type AuthResponse = {
  token?: string;
  user: {
    role: string;
  };
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiRequest<AuthResponse>("/auth/me", {
          headers: getAdminAuthHeaders(),
        });
        if (active) {
          setIsAuthenticated(response.user.role === "admin");
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
          clearAdminToken();
        }
      } finally {
        if (active) {
          setIsChecked(true);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login: async (username: string, password: string) => {
        try {
          const response = await apiRequest<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
          });
          setAdminToken(response.token || "");
          setIsAuthenticated(response.user.role === "admin");
          if (response.user.role !== "admin") {
            clearAdminToken();
            return false;
          }
          return true;
        } catch {
          setIsAuthenticated(false);
          clearAdminToken();
          return false;
        }
      },
      logout: async () => {
        try {
          await apiRequest("/auth/logout", {
            method: "POST",
            headers: getAdminAuthHeaders(),
          });
        } finally {
          setIsAuthenticated(false);
          clearAdminToken();
        }
      },
    }),
    [isAuthenticated]
  );

  if (!isChecked) {
    return null;
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return context;
}
