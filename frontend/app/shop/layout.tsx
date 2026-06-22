import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse HRUSHE everyday uniforms by category, fit, colour, and material.",
  alternates: {
    canonical: "https://hrushe.in/shop",
  },
  openGraph: {
    title: "Shop | HRUSHE",
    description: "Browse HRUSHE everyday uniforms by category, fit, colour, and material.",
    url: "https://hrushe.in/shop",
    type: "website",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
