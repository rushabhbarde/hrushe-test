import type { Metadata } from "next";
import { AudienceHomePage } from "@/components/audience-home-page";

// Built once, reused for a minute, rebuilt in the background (see STOREFRONT_REVALIDATE_SECONDS).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Women",
  description: "HRUSHE for women: refined everyday essentials with clean silhouettes and honest materials. Defined quietly.",
  alternates: {
    canonical: "/women",
  },
  openGraph: {
    title: "Women | HRUSHE",
    description: "HRUSHE for women: refined everyday essentials with clean silhouettes and honest materials. Defined quietly.",
    url: "/women",
  },
};

export default function WomenHome() {
  return <AudienceHomePage audience="women" />;
}
