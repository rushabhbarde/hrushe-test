"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthPanel, type AuthMode } from "@/components/auth-panel";

type AuthModalContextValue = {
  isOpen: boolean;
  openLogin: (nextPath?: string) => void;
  openSignup: (nextPath?: string) => void;
  closeAuthModal: () => void;
  suppressAuthPrompt: boolean;
  suppressNextAuthPrompt: () => void;
  clearAuthPromptSuppression: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined
);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [suppressAuthPrompt, setSuppressAuthPrompt] = useState(false);

  const isProtectedAccountPath =
    pathname.startsWith("/account") || pathname.startsWith("/my-orders");

  const closeAuthModal = useCallback(() => {
    if (isProtectedAccountPath) {
      setSuppressAuthPrompt(true);
    }

    setIsOpen(false);

    if (isProtectedAccountPath) {
      router.push("/");
    }
  }, [isProtectedAccountPath, router]);

  const suppressNextAuthPrompt = useCallback(() => {
    setSuppressAuthPrompt(true);
  }, []);

  const clearAuthPromptSuppression = useCallback(() => {
    setSuppressAuthPrompt(false);
  }, []);

  const openLogin = useCallback((targetPath?: string) => {
    setMode("login");
    setNextPath(targetPath ?? pathname);
    setIsOpen(true);
  }, [pathname]);

  const openSignup = useCallback((targetPath?: string) => {
    setMode("signup");
    setNextPath(targetPath ?? pathname);
    setIsOpen(true);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const value = useMemo(
    () => ({
      isOpen,
      openLogin,
      openSignup,
      closeAuthModal,
      suppressAuthPrompt,
      suppressNextAuthPrompt,
      clearAuthPromptSuppression,
    }),
    [
      clearAuthPromptSuppression,
      closeAuthModal,
      isOpen,
      openLogin,
      openSignup,
      suppressAuthPrompt,
      suppressNextAuthPrompt,
    ]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close account popup"
            className="absolute inset-0 cursor-default"
            onClick={closeAuthModal}
          />
          <div className="relative z-10 w-full max-w-[560px]">
            <button
              type="button"
              onClick={closeAuthModal}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-black shadow-sm transition hover:bg-white"
              aria-label="Close"
            >
              ×
            </button>
            <AuthPanel
              initialMode={mode}
              onModeChange={setMode}
              onSuccess={() => {
                closeAuthModal();
                if (nextPath) {
                  router.push(nextPath);
                }
              }}
              className="shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
      ) : null}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }

  return context;
}
