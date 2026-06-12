import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Discover HRUSHE and the thinking behind Defined Quietly: modern, minimal streetwear made with restraint.",
  alternates: { canonical: "/story" },
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
