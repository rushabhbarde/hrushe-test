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
import type { AdminPermission } from "@/lib/admin-workspace";

type AdminAuthContextValue = {
  isAuthenticated: boolean;
  isChecked: boolean;
  user: AdminSessionUser | null;
  permissions: AdminPermission[];
  hasPermission: (permission?: AdminPermission) => boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

type AdminSessionUser = {
  role: string;
  adminRole?: string;
  adminRoleName?: string;
  adminPermissions?: AdminPermission[];
  name?: string;
  email?: string;
};

type AuthResponse = {
  user: AdminSessionUser;
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiRequest<AuthResponse>("/auth/me", {
          headers: getAdminAuthHeaders(),
        });
        if (active) {
          const isAdmin = response.user.role === "admin";
          if (isAdmin) {
            setAdminToken();
          }
          setUser(isAdmin ? response.user : null);
          setIsAuthenticated(isAdmin);
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
          setUser(null);
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
        setUser(null);
      }
    };

    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, syncAdminSession);

    return () => {
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, syncAdminSession);
    };
  }, []);

  const value = useMemo(
    () => {
      const permissions = user?.adminPermissions || [];

      return {
        isAuthenticated,
        isChecked,
        user,
        permissions,
        hasPermission: (permission?: AdminPermission) =>
          !permission || permissions.includes(permission),
        login: async (username: string, password: string) => {
          try {
            const response = await apiRequest<AuthResponse>("/auth/admin-login", {
              method: "POST",
              body: JSON.stringify({
                identifier: username,
                email: username,
                password,
              }),
            });

            if (response.user.role !== "admin") {
              clearAdminToken();
              setUser(null);
              setIsAuthenticated(false);
              return { ok: false, error: "This account does not have admin access." };
            }

            clearCustomerToken();
            setAdminToken();
            setUser(response.user);
            setIsAuthenticated(true);
            return { ok: true };
          } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            clearAdminToken();
            return {
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Could not sign in to the admin panel.",
            };
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
            setUser(null);
            clearAdminToken();
          }
        },
      };
    },
    [isAuthenticated, isChecked, user]
  );

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
