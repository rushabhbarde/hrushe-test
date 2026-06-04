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
  metadataBase: new URL("https://www.hrushe.in"),
  applicationName: "HRUSHE",
  title: {
    default: "HRUSHE | Modern Fashion Brand",
    template: "%s | HRUSHE",
  },
  description:
    "HRUSHE is a modern fashion brand for elevated essentials, seasonal drops, and statement silhouettes.",
  alternates: {
    canonical: "https://www.hrushe.in",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/hrushe-sylogo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/hrushe-sylogo-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/brand/hrushe-sylogo-192.png",
    apple: "/brand/hrushe-sylogo-apple-touch-icon.png",
  },
  openGraph: {
    title: "HRUSHE | Modern Fashion Brand",
    description:
      "HRUSHE is a modern fashion brand for elevated essentials, seasonal drops, and statement silhouettes.",
    url: "https://www.hrushe.in",
    siteName: "HRUSHE",
    type: "website",
    images: [
      {
        url: "/brand/hrushe-sylogo-512.png",
        width: 512,
        height: 512,
        alt: "HRUSHE symbol logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HRUSHE | Modern Fashion Brand",
    description:
      "HRUSHE is a modern fashion brand for elevated essentials, seasonal drops, and statement silhouettes.",
    images: ["/brand/hrushe-sylogo-512.png"],
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
  const organizationStructuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HRUSHE",
    url: "https://www.hrushe.in",
    logo: "https://www.hrushe.in/brand/hrushe-sylogo-512.png",
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationStructuredData }}
        />
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
