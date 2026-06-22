import type { NextConfig } from "next";

const configuredImageHosts = [
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  process.env.NEXT_PUBLIC_API_URL,
  process.env.API_URL,
]
  .filter(Boolean)
  .flatMap((value) => {
    try {
      const url = new URL(String(value));
      return [{ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname }];
    } catch {
      return [];
    }
  });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hrushe.in" },
      { protocol: "https", hostname: "www.hrushe.in" },
      { protocol: "https", hostname: "media.hrushe.in" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.onrender.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      ...configuredImageHosts,
    ],
  },
  async redirects() {
    return [
      {
        source: "/product/begie-solid-tee-oversize",
        destination: "/product/beige-solid-tee-oversize",
        permanent: true,
      },
      {
        source: "/product/begie-oversized-tshirt",
        destination: "/product/beige-oversized-tshirt",
        permanent: true,
      },
      {
        source: "/product/begie-oversized-t-shirt",
        destination: "/product/beige-oversized-t-shirt",
        permanent: true,
      },
    ];
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com https://www.googletagmanager.com https://connect.facebook.net`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
