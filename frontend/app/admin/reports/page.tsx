"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminReportsPage() {
  return (
    <AdminModulePage
      eyebrow="Reports"
      title="Sales, orders, customers, and product reporting."
      description="A reporting layer designed to sit on top of the live commerce data as the brand grows from launch mode to repeatable operations."
      stats={[
        { label: "Sales reports", value: "Ready", detail: "Revenue, AOV, and trend data are already present in the dashboard layer." },
        { label: "Order reports", value: "Ready", detail: "Order status and payment data are structured for exports." },
        { label: "Customer reports", value: "Ready", detail: "Spend and repeat behavior can feed reporting next." },
        { label: "Product reports", value: "Ready", detail: "Merchandising flags and category performance can be layered in." },
      ]}
      sections={[
        {
          title: "Report surfaces",
          items: [
            { title: "Sales reports", description: "Daily, weekly, and campaign-linked performance views." },
            { title: "Order reports", description: "Fulfillment speed, payment state, and dispatch outcomes." },
            { title: "Customer reports", description: "Spend tiers, repeat buying, and retention risk." },
          ],
        },
        {
          title: "Exports",
          items: [
            { title: "CSV / spreadsheet handoff", description: "Prepared for finance and operations exports." },
            { title: "Internal dashboards", description: "Clean enough to support future charts without rework." },
          ],
        },
      ]}
    />
  );
}
