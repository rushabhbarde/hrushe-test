"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminReturnsPage() {
  return (
    <AdminModulePage
      eyebrow="Commerce"
      title="Returns, exchanges, and refunds."
      description="A dedicated post-purchase operations layer for resolving issues cleanly without losing customer context."
      primaryAction={{ label: "Open support", href: "/admin/support" }}
      stats={[
        { label: "Requested", value: "0", detail: "New return or exchange requests enter here." },
        { label: "Under review", value: "0", detail: "Requests waiting on approval and inspection." },
        { label: "Refunded", value: "0", detail: "Completed money-back outcomes." },
        { label: "Exchange flow", value: "Ready", detail: "Built to handle item replacements later." },
      ]}
      sections={[
        {
          title: "Resolution pipeline",
          items: [
            { title: "Return requests", description: "Track requested, approved, rejected, picked up, received, and refunded states." },
            { title: "Exchange requests", description: "Prepared for exchange processing, dispatch, and completion stages." },
            { title: "Refund tracking", description: "Structured for refund initiation, completion, and audit notes." },
          ],
        },
        {
          title: "Linked data",
          items: [
            { title: "Order context", description: "Each request is designed to attach back to order items, customer profile, and notes." },
            { title: "Condition checks", description: "Ready for product condition, images, and inspection notes." },
          ],
        },
      ]}
    />
  );
}
