"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminStorefrontPage() {
  return (
    <AdminModulePage
      eyebrow="Storefront"
      title="Homepage, banners, and announcement control."
      description="A visual operations layer for the customer-facing side of the brand, with room for campaign sequencing and merchandising clarity."
      primaryAction={{ label: "Open banner editor", href: "/admin/homepage" }}
      secondaryAction={{ label: "Announcements", href: "/admin/announcements" }}
      stats={[
        { label: "Homepage banner", value: "Live", detail: "Current banner content is already editable." },
        { label: "Promo strip", value: "Live", detail: "Announcement messaging is part of the homepage model." },
        { label: "Featured rows", value: "Ready", detail: "Storefront sections can be controlled from this layer." },
        { label: "Scheduling", value: "Placeholder", detail: "Future publishing windows can sit here." },
      ]}
      sections={[
        {
          title: "Visual content",
          items: [
            { title: "Hero banner", description: "Control headline, description, CTAs, and campaign image from one place." },
            { title: "Featured products & collections", description: "Prepared for homepage merchandising order and visibility." },
            { title: "Announcement bar", description: "A simple surface for launch and shipping messaging." },
          ],
        },
        {
          title: "Operations",
          items: [
            { title: "Section ordering", description: "Prepared for rearranging homepage content as campaigns evolve." },
            { title: "Preview hooks", description: "Structured for future preview and scheduling workflows." },
          ],
        },
      ]}
    />
  );
}
