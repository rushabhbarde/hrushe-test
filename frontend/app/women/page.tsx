import type { Metadata } from "next";
import { AudienceHomePage } from "@/components/audience-home-page";

export const dynamic = "force-dynamic";

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
