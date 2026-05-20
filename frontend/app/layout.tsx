import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin-auth-provider";
import { AdminAuthModalProvider } from "@/components/admin-auth-modal-provider";
import { AuthModalProvider } from "@/components/auth-modal-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { CustomerAuthProvider } from "@/components/customer-auth-provider";
import { ToastProvider } from "@/components/toast-provider";
import { ThemeProvider } from "@/components/theme-provider";
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
  const themeBootScript = `
    try {
      var storedTheme = localStorage.getItem("hrushe-theme");
      var theme = storedTheme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {}
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
