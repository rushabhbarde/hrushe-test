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
import type {
  AccountPreferences,
  AddressRecord,
  CommunicationPreferences,
} from "@/lib/account";
import {
  CUSTOMER_SESSION_CHANGED_EVENT,
  clearCustomerToken,
  getCustomerToken,
  setCustomerToken,
} from "@/lib/customer-auth";
import { clearAdminToken } from "@/lib/admin-auth";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string | null;
  profilePictureUrl?: string;
  role: string;
  addresses?: AddressRecord[];
  preferences?: AccountPreferences;
  communicationPreferences?: CommunicationPreferences;
  wishlistCount?: number;
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
  token?: string;
  user: AuthUser;
};

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const refreshUser = async () => {
    const response = await apiRequest<AuthResponse>("/auth/me");

    if (response.user.role === "admin") {
      clearCustomerToken();
      setUser(null);
      return;
    }

    setUser(response.user);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiRequest<AuthResponse>("/auth/me");

        if (active) {
          if (response.user.role === "admin") {
            clearCustomerToken();
            setUser(null);
            return;
          }

          if (response.token) {
            setCustomerToken(response.token);
          }
          setUser(response.user);
        }
      } catch {
        if (active) {
          clearCustomerToken();
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncCustomerSession = () => {
      if (!getCustomerToken()) {
        setUser(null);
      }
    };

    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncCustomerSession);

    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncCustomerSession);
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

          if (response.user.role === "admin") {
            clearCustomerToken();
            setUser(null);
            return false;
          }

          clearAdminToken();
          if (response.token) {
            setCustomerToken(response.token);
          }
          setUser(response.user);
          return true;
        } catch {
          clearCustomerToken();
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

          if (response.user.role === "admin") {
            clearCustomerToken();
            setUser(null);
            return false;
          }

          clearAdminToken();
          if (response.token) {
            setCustomerToken(response.token);
          }
          setUser(response.user);
          return true;
        } catch {
          clearCustomerToken();
          setUser(null);
          return false;
        }
      },
      logout: async () => {
        try {
          await apiRequest("/auth/logout", { method: "POST" });
        } finally {
          clearCustomerToken();
          setUser(null);
        }
      },
      refreshUser: async () => {
        try {
          await refreshUser();
        } catch {
          clearCustomerToken();
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
