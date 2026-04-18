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
  ADMIN_SESSION_CHANGED_EVENT,
  clearAdminToken,
  getAdminAuthHeaders,
  getAdminToken,
  setAdminToken,
} from "@/lib/admin-auth";
import { clearCustomerToken } from "@/lib/customer-auth";

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncAdminSession = () => {
      if (!getAdminToken()) {
        setIsAuthenticated(false);
      }
    };

    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, syncAdminSession);

    return () => {
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, syncAdminSession);
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

          if (response.user.role !== "admin") {
            clearAdminToken();
            setIsAuthenticated(false);
            return false;
          }

          clearCustomerToken();
          setAdminToken(response.token || "");
          setIsAuthenticated(true);
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
