"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminAudiencePage() {
  return (
    <AdminModulePage
      eyebrow="Marketing"
      title="Audience and lifecycle marketing."
      description="A lightweight marketing intelligence layer connected to customer behavior, repeat buying, and future campaign targeting."
      stats={[
        { label: "Recent signups", value: "Live", detail: "Customer records are already flowing in from account creation." },
        { label: "Repeat buyers", value: "Ready", detail: "Order-linked customer value data is available." },
        { label: "High value", value: "VIP signal", detail: "VIP and at-risk states already exist in customer profiles." },
        { label: "Campaigns", value: "Placeholder", detail: "Email/SMS targeting can attach here next." },
      ]}
      sections={[
        {
          title: "Segments",
          items: [
            { title: "Repeat customers", description: "Use order history and spend to identify retention opportunities." },
            { title: "High-value customers", description: "Built around VIP tagging and total spend logic." },
            { title: "Inactive customers", description: "At-risk states give the marketing team a clean reactivation starting point." },
          ],
        },
        {
          title: "Activation",
          items: [
            { title: "Announcement targets", description: "Prepared for product drops, restocks, and offer messaging." },
            { title: "Coupon campaign audiences", description: "Ready to merge with future offer logic and segment exports." },
          ],
        },
      ]}
    />
  );
}
