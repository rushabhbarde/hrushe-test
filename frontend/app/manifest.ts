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
        src: "/NEW_LOGO_SYMB.png",
        sizes: "200x200",
        type: "image/png",
      },
    ],
  };
}
