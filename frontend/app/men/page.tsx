import type { Metadata } from "next";
import { AudienceHomePage } from "@/components/audience-home-page";

// Built once, reused for a minute, rebuilt in the background (see STOREFRONT_REVALIDATE_SECONDS).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Men",
  description: "HRUSHE for men: refined everyday essentials with clean silhouettes and honest materials. Defined quietly.",
  alternates: {
    canonical: "/men",
  },
  openGraph: {
    title: "Men | HRUSHE",
    description: "HRUSHE for men: refined everyday essentials with clean silhouettes and honest materials. Defined quietly.",
    url: "/men",
  },
};

export default function MenHome() {
  return <AudienceHomePage audience="men" />;
}
