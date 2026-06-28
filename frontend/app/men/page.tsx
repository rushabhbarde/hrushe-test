import type { Metadata } from "next";
import { AudienceHomePage } from "@/components/audience-home-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Men",
  description: "Shop HRUSHE menswear: new arrivals, vacation edits, t-shirts, tank tops, pants, and shorts.",
  alternates: {
    canonical: "/men",
  },
  openGraph: {
    title: "Men | HRUSHE",
    description: "Shop HRUSHE menswear: new arrivals, vacation edits, t-shirts, tank tops, pants, and shorts.",
    url: "/men",
  },
};

export default function MenHome() {
  return <AudienceHomePage audience="men" />;
}
