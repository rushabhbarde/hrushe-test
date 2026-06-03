import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HRUSHE",
    short_name: "HRUSHE",
    description:
      "HRUSHE is a modern fashion brand for elevated essentials, seasonal drops, and statement silhouettes.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      {
        src: "/brand/hrushe-search-logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/hrushe-search-logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
