import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HRUSHE",
    short_name: "HRUSHE",
    description:
      "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      {
        src: "/brand/hrushe-sylogo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/hrushe-sylogo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
