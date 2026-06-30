"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminAuthModalProvider } from "@/components/admin-auth-modal-provider";
import { AdminAuthProvider } from "@/components/admin-auth-provider";
import { AuthModalProvider } from "@/components/auth-modal-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";
import { ConsentControlledTracking } from "@/components/consent-controlled-tracking";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { CustomerAuthProvider } from "@/components/customer-auth-provider";
import { SupportChatbot } from "@/components/support-chatbot";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import { WishlistDrawer } from "@/components/wishlist-drawer";
import { WishlistProvider } from "@/components/wishlist-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return (
      <ThemeProvider>
        <AdminAuthProvider>
          <ToastProvider>
            <AdminAuthModalProvider>{children}</AdminAuthModalProvider>
          </ToastProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <ToastProvider>
          <AuthModalProvider>
            <WishlistProvider>
              <CartProvider>
                {children}
                <CartDrawer />
                <WishlistDrawer />
                {pathname === "/" ? null : <SupportChatbot />}
                <ConsentControlledTracking />
                <CookieConsentBanner />
              </CartProvider>
            </WishlistProvider>
          </AuthModalProvider>
        </ToastProvider>
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
