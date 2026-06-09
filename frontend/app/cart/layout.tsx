import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: "Review your HRUSHE shopping bag and continue to secure checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
