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
import { SupportChatbot } from "@/components/support-chatbot";
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
  metadataBase: new URL("https://hrushe.in"),
  applicationName: "HRUSHE",
  title: {
    default: "HRUSHE | Modern Minimal Premium Streetwear",
    template: "%s | HRUSHE",
  },
  description:
    "Modern, minimal, premium streetwear by HRUSHE. Defined quietly through clean silhouettes, everyday comfort, and subtle confidence.",
  alternates: {
    canonical: "https://hrushe.in",
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
    title: "HRUSHE | Modern Minimal Premium Streetwear",
    description:
      "Modern, minimal, premium streetwear by HRUSHE. Defined quietly through clean silhouettes, everyday comfort, and subtle confidence.",
    url: "https://hrushe.in",
    siteName: "HRUSHE",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "HRUSHE | Defined Quietly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HRUSHE | Modern Minimal Premium Streetwear",
    description:
      "Modern, minimal, premium streetwear by HRUSHE. Defined quietly through clean silhouettes, everyday comfort, and subtle confidence.",
    images: ["/opengraph-image"],
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
  const organizationStructuredData = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "HRUSHE",
      url: "https://hrushe.in",
      logo: "https://hrushe.in/brand/hrushe-sylogo-512.png",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "HRUSHE",
      url: "https://hrushe.in",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://hrushe.in/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ]);

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
                        <SupportChatbot />
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
