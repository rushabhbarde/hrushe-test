import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact HRUSHE for product, order, return, sizing, or account support.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
