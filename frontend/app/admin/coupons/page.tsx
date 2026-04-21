"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminCouponsPage() {
  return (
    <AdminModulePage
      eyebrow="Marketing"
      title="Promotions with clean business rules."
      description="Percentage, flat, and shipping-led offers designed for fast launch use today and more precise targeting later."
      primaryAction={{ label: "Create coupon", href: "/admin/coupons" }}
      stats={[
        { label: "Active coupons", value: "0", detail: "No active discount rules yet." },
        { label: "Usage cap", value: "Configurable", detail: "Per-user and global caps supported conceptually." },
        { label: "Minimum cart", value: "Supported", detail: "Threshold rules are ready in the UX." },
        { label: "Analytics", value: "Placeholder", detail: "Usage and redemption insights can plug in next." },
      ]}
      sections={[
        {
          title: "Offer rules",
          items: [
            { title: "Percentage / flat / shipping", description: "Core promotion types designed for Indian storefront expectations." },
            { title: "Expiry and usage limits", description: "Timeboxing and redemption control live naturally in this module." },
          ],
        },
        {
          title: "Targeting",
          items: [
            { title: "Category and collection scopes", description: "Prepared for catalog-aware offer conditions." },
            { title: "Audience overlays", description: "Connect coupons to segments once marketing automation deepens." },
          ],
        },
      ]}
    />
  );
}
