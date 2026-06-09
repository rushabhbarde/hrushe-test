import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New In",
  description: "Fresh HRUSHE pieces from the latest minimal premium streetwear drop.",
  alternates: {
    canonical: "https://hrushe.in/new-in",
  },
};

export default function NewInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
