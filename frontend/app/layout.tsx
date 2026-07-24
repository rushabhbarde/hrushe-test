import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import {
  HRUSHE_BRAND_NAME,
  HRUSHE_LOGO_PATH,
  HRUSHE_ORIGIN,
  HRUSHE_SYMBOL_LOGO_PATH,
} from "@/lib/brand-assets";
import "./globals.css";

const hrusheFont = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hrushe",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(HRUSHE_ORIGIN),
  applicationName: HRUSHE_BRAND_NAME,
  title: {
    default: "HRUSHE | Defined Quietly",
    template: "%s | HRUSHE",
  },
  description:
    "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
  alternates: {
    canonical: HRUSHE_ORIGIN,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: HRUSHE_SYMBOL_LOGO_PATH, sizes: "300x300", type: "image/png" },
    ],
    shortcut: HRUSHE_SYMBOL_LOGO_PATH,
    apple: HRUSHE_SYMBOL_LOGO_PATH,
  },
  openGraph: {
    title: "HRUSHE | Defined Quietly",
    description:
      "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
    url: HRUSHE_ORIGIN,
    siteName: HRUSHE_BRAND_NAME,
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
    title: "HRUSHE | Defined Quietly",
    description:
      "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeBootScript = `
    try {
      var storedTheme = localStorage.getItem("hrushe-theme");
      var isAdmin = location.pathname.indexOf("/admin") === 0;
      var theme = isAdmin && storedTheme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {}
  `;
  const organizationStructuredData = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: HRUSHE_BRAND_NAME,
      url: HRUSHE_ORIGIN,
      logo: `${HRUSHE_ORIGIN}${HRUSHE_LOGO_PATH}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: HRUSHE_BRAND_NAME,
      url: HRUSHE_ORIGIN,
      potentialAction: {
        "@type": "SearchAction",
        target: "https://hrushe.in/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "HRUSHE primary storefronts",
      itemListElement: [
        {
          "@type": "SiteNavigationElement",
          position: 1,
          name: "Women",
          url: "https://hrushe.in/women",
        },
        {
          "@type": "SiteNavigationElement",
          position: 2,
          name: "Men",
          url: "https://hrushe.in/men",
        },
      ],
    },
  ]);

  return (
    <html lang="en" className={hrusheFont.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationStructuredData }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
