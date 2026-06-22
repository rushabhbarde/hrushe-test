import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New In",
  description:
    "Shop the latest HRUSHE everyday uniforms, available fits, colours, and materials.",
  alternates: {
    canonical: "https://hrushe.in/new-in",
  },
  openGraph: {
    title: "New In | HRUSHE",
    description:
      "Explore the latest HRUSHE everyday uniforms and available silhouettes.",
    url: "https://hrushe.in/new-in",
    type: "website",
  },
};

export default function NewInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
