import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product",
  description: "View HRUSHE product details, sizing, fabric notes, reviews, and related pieces.",
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
