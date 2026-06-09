import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collection",
  description: "Explore a focused HRUSHE collection edit.",
};

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
