import type { Metadata } from "next";
import { AudienceHomePage } from "@/components/audience-home-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Women",
  description: "Shop HRUSHE womenswear: new arrivals, summer edits, dresses, shirts, and everyday uniforms.",
  alternates: {
    canonical: "/women",
  },
  openGraph: {
    title: "Women | HRUSHE",
    description: "Shop HRUSHE womenswear: new arrivals, summer edits, dresses, shirts, and everyday uniforms.",
    url: "/women",
  },
};

export default function WomenHome() {
  return <AudienceHomePage audience="women" />;
}
