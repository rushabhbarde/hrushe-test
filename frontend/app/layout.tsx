import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin-auth-provider";
import { AdminAuthModalProvider } from "@/components/admin-auth-modal-provider";
import { AuthModalProvider } from "@/components/auth-modal-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { CustomerAuthProvider } from "@/components/customer-auth-provider";
import { ToastProvider } from "@/components/toast-provider";
import { WishlistDrawer } from "@/components/wishlist-drawer";
import { WishlistProvider } from "@/components/wishlist-provider";
import { Manrope, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Hrushetest | Modern Fashion Brand",
  description:
    "A modern fashion storefront for elevated essentials, seasonal drops, and statement silhouettes.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <CustomerAuthProvider>
          <AdminAuthProvider>
            <ToastProvider>
              <AdminAuthModalProvider>
                <AuthModalProvider>
                  <WishlistProvider>
                    <CartProvider>
                      {children}
                      <CartDrawer />
                      <WishlistDrawer />
                    </CartProvider>
                  </WishlistProvider>
                </AuthModalProvider>
              </AdminAuthModalProvider>
            </ToastProvider>
          </AdminAuthProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
