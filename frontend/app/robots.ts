import type { MetadataRoute } from "next";

const siteUrl = "https://hrushe.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/account",
          "/cart",
          "/checkout",
          "/login",
          "/signup",
          "/my-orders",
          "/track-order",
          "/search",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
