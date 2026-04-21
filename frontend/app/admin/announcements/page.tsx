"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminAnnouncementsPage() {
  return (
    <AdminModulePage
      eyebrow="Storefront"
      title="Announcement and promo messaging."
      description="A simple communications layer for shipping messages, campaign hooks, and limited-time store notices."
      primaryAction={{ label: "Edit announcement", href: "/admin/homepage" }}
      stats={[
        { label: "Announcement bar", value: "Live", detail: "Currently controlled through homepage content." },
        { label: "Campaign copy", value: "Ready", detail: "Supports launch and promo messaging." },
        { label: "Scheduling", value: "Placeholder", detail: "Future publish windows can be added later." },
        { label: "Audience targeting", value: "Future", detail: "Can connect to marketing segmentation next." },
      ]}
      sections={[
        {
          title: "Use cases",
          items: [
            { title: "Shipping promotions", description: "Free shipping or dispatch messages." },
            { title: "Drop countdowns", description: "Timed campaign copy for launches and restocks." },
            { title: "Trust signals", description: "Short lines that keep shoppers oriented and reassured." },
          ],
        },
        {
          title: "Future extensions",
          items: [
            { title: "Schedule and expire", description: "Turn messages on and off automatically." },
            { title: "Audience-aware copy", description: "Support segmented messaging later." },
          ],
        },
      ]}
    />
  );
}
