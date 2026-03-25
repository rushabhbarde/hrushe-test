"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function AccountGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isChecking } = useCustomerAuth();
  const pathname = usePathname();
  const { openLogin, isOpen } = useAuthModal();
  const isHydrated = useHydrated();

  useEffect(() => {
    if (isHydrated && !isChecking && !isAuthenticated && !isOpen) {
      openLogin(pathname);
    }
  }, [isAuthenticated, isChecking, isHydrated, isOpen, openLogin, pathname]);

  if (!isHydrated || isChecking || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
