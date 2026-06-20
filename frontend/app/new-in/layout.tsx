import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New In | Latest Premium Streetwear",
  description:
    "Shop the latest HRUSHE drop: quiet premium streetwear essentials, oversized fits, and refined basics for everyday wear.",
  alternates: {
    canonical: "https://hrushe.in/new-in",
  },
  openGraph: {
    title: "New In | HRUSHE",
    description:
      "Fresh HRUSHE essentials and oversized silhouettes from the latest premium streetwear edit.",
    url: "https://hrushe.in/new-in",
    type: "website",
  },
};

export default function NewInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
