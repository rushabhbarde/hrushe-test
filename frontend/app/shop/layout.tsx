import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse HRUSHE modern minimal premium streetwear collections.",
  alternates: {
    canonical: "https://hrushe.in/shop",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
