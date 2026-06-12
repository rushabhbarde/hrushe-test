"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useAdminAuthModal } from "@/components/admin-auth-modal-provider";
import { useAdminAuth } from "@/components/admin-auth-provider";

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isChecked } = useAdminAuth();
  const pathname = usePathname();
  const {
    openAdminLogin,
    isOpen,
    suppressAdminPrompt,
    clearAdminPromptSuppression,
  } = useAdminAuthModal();
  const isHydrated = useHydrated();

  useEffect(() => {
    if (isHydrated && isChecked && !isAuthenticated && !isOpen) {
      if (suppressAdminPrompt) {
        clearAdminPromptSuppression();
        return;
      }
      openAdminLogin(pathname);
    }
  }, [
    clearAdminPromptSuppression,
    isAuthenticated,
    isChecked,
    isHydrated,
    isOpen,
    openAdminLogin,
    pathname,
    suppressAdminPrompt,
  ]);

  if (!isHydrated || !isChecked || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
