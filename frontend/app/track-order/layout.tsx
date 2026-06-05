import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Track Order | HRUSHE",
  },
  description:
    "Track your HRUSHE order using your order ID with the email or phone number used at checkout.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://hrushe.in/track-order",
  },
};

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
