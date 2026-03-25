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
import { AdminAuthPanel } from "@/components/admin-auth-panel";

type AdminAuthModalContextValue = {
  isOpen: boolean;
  openAdminLogin: (nextPath?: string) => void;
  closeAdminAuthModal: () => void;
  suppressAdminPrompt: boolean;
  suppressNextAdminPrompt: () => void;
  clearAdminPromptSuppression: () => void;
};

const AdminAuthModalContext = createContext<AdminAuthModalContextValue | undefined>(
  undefined
);

export function AdminAuthModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [suppressAdminPrompt, setSuppressAdminPrompt] = useState(false);

  const closeAdminAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openAdminLogin = useCallback((targetPath?: string) => {
    setNextPath(targetPath ?? pathname);
    setIsOpen(true);
  }, [pathname]);

  const suppressNextAdminPrompt = useCallback(() => {
    setSuppressAdminPrompt(true);
  }, []);

  const clearAdminPromptSuppression = useCallback(() => {
    setSuppressAdminPrompt(false);
  }, []);

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
      openAdminLogin,
      closeAdminAuthModal,
      suppressAdminPrompt,
      suppressNextAdminPrompt,
      clearAdminPromptSuppression,
    }),
    [
      clearAdminPromptSuppression,
      closeAdminAuthModal,
      isOpen,
      openAdminLogin,
      suppressAdminPrompt,
      suppressNextAdminPrompt,
    ]
  );

  return (
    <AdminAuthModalContext.Provider value={value}>
      {children}
      {isOpen ? (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close admin login popup"
            className="absolute inset-0 cursor-default"
            onClick={closeAdminAuthModal}
          />
          <div className="relative z-10 w-full max-w-[560px]">
            <button
              type="button"
              onClick={closeAdminAuthModal}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-black shadow-sm transition hover:bg-white"
              aria-label="Close"
            >
              ×
            </button>
            <AdminAuthPanel
              onSuccess={() => {
                closeAdminAuthModal();
                router.push(nextPath || "/admin");
              }}
              className="shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
      ) : null}
    </AdminAuthModalContext.Provider>
  );
}

export function useAdminAuthModal() {
  const context = useContext(AdminAuthModalContext);

  if (!context) {
    throw new Error("useAdminAuthModal must be used within AdminAuthModalProvider");
  }

  return context;
}
