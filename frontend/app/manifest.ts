import type { MetadataRoute } from "next";
import {
  HRUSHE_BRAND_NAME,
  HRUSHE_SYMBOL_LOGO_PATH,
} from "@/lib/brand-assets";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: HRUSHE_BRAND_NAME,
    short_name: HRUSHE_BRAND_NAME,
    description:
      "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      {
        src: HRUSHE_SYMBOL_LOGO_PATH,
        sizes: "300x300",
        type: "image/png",
      },
    ],
  };
}
