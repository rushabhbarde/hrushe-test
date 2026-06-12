import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policies",
  description: "Read HRUSHE shipping, returns, privacy, and shopping policies.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
