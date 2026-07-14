import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const hrusheFont = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hrushe",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hrushe.in"),
  applicationName: "HRUSHE",
  title: {
    default: "HRUSHE | Defined Quietly",
    template: "%s | HRUSHE",
  },
  description:
    "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
  alternates: {
    canonical: "https://hrushe.in",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/NEW_LOGO_SYMB.png", sizes: "200x200", type: "image/png" },
    ],
    shortcut: "/NEW_LOGO_SYMB.png",
    apple: "/NEW_LOGO_SYMB.png",
  },
  openGraph: {
    title: "HRUSHE | Defined Quietly",
    description:
      "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
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
    title: "HRUSHE | Defined Quietly",
    description:
      "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
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
      name: "HRUSHE",
      url: "https://hrushe.in",
      logo: "https://hrushe.in/NEW_LOGO.png",
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
