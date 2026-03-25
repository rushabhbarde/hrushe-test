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

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
};

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  otp: string;
};

type UpdateProfilePayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type CustomerAuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isChecking: boolean;
  signup: (payload: SignupPayload) => Promise<boolean>;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | undefined>(
  undefined
);

type AuthResponse = {
  user: AuthUser;
};

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const refreshUser = async () => {
    const response = await apiRequest<AuthResponse>("/auth/me");
    setUser(response.user);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiRequest<AuthResponse>("/auth/me");

        if (active) {
          setUser(response.user);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsChecking(false);
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
      user,
      isAuthenticated: Boolean(user),
      isChecking,
      signup: async (payload: SignupPayload) => {
        try {
          const response = await apiRequest<AuthResponse>("/auth/signup", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setUser(response.user);
          return true;
        } catch {
          setUser(null);
          return false;
        }
      },
      login: async (identifier: string, password: string) => {
        try {
          const response = await apiRequest<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ identifier, password }),
          });
          setUser(response.user);
          return true;
        } catch {
          setUser(null);
          return false;
        }
      },
      logout: async () => {
        try {
          await apiRequest("/auth/logout", { method: "POST" });
        } finally {
          setUser(null);
        }
      },
      refreshUser: async () => {
        try {
          await refreshUser();
        } catch {
          setUser(null);
        }
      },
      updateProfile: async (payload: UpdateProfilePayload) => {
        try {
          const response = await apiRequest<AuthResponse>("/auth/me", {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setUser(response.user);
          return true;
        } catch {
          return false;
        }
      },
      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          await apiRequest("/auth/change-password", {
            method: "PUT",
            body: JSON.stringify({ currentPassword, newPassword }),
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    [isChecking, user]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);

  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }

  return context;
}
