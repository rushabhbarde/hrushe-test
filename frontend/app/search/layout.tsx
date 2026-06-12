import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search HRUSHE products by style, color, category, or everyday fit.",
  alternates: {
    canonical: "https://hrushe.in/search",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
