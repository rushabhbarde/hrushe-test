"use client";

import { useParams } from "next/navigation";
import { AdminModulePage } from "@/components/admin-module-page";

const reportConfig = {
  sales: {
    title: "Sales reports.",
    description: "Revenue, average order value, daily trend, and campaign performance views for business clarity.",
    stats: [
      { label: "Revenue trend", value: "Live-ready", detail: "Dashboard revenue pulse already uses order data." },
      { label: "AOV", value: "Ready", detail: "Average order value is calculated from live orders." },
      { label: "Campaigns", value: "Placeholder", detail: "Campaign attribution can attach later." },
      { label: "Exports", value: "Planned", detail: "CSV handoff belongs here." },
    ],
  },
  orders: {
    title: "Order reports.",
    description: "Fulfillment status, payment state, dispatch outcomes, and operational bottleneck reporting.",
    stats: [
      { label: "Status mix", value: "Live-ready", detail: "Order statuses already power admin queues." },
      { label: "Payment state", value: "Ready", detail: "Razorpay states can be analyzed here." },
      { label: "Dispatch speed", value: "Placeholder", detail: "Courier timestamps can improve this later." },
      { label: "Export orders", value: "Ready", detail: "Operational exports fit here." },
    ],
  },
  customers: {
    title: "Customer reports.",
    description: "Customer value, repeat purchase, VIP, at-risk, and acquisition cohort views.",
    stats: [
      { label: "VIP customers", value: "Live-ready", detail: "Customer status logic already exists." },
      { label: "Repeat buyers", value: "Ready", detail: "Order-linked customer data is available." },
      { label: "At risk", value: "Ready", detail: "Churn signals can be refined later." },
      { label: "Segments", value: "Prepared", detail: "Audience module can consume this data." },
    ],
  },
  products: {
    title: "Product reports.",
    description: "Catalog quality, category performance, merchandising flags, and future sell-through visibility.",
    stats: [
      { label: "Catalog health", value: "Live-ready", detail: "Image and setup gaps are already surfaced." },
      { label: "Best sellers", value: "Ready", detail: "Merchandising flags support ranking." },
      { label: "Category mix", value: "Ready", detail: "Product categories are already structured." },
      { label: "Sell-through", value: "Future", detail: "Requires variant inventory history." },
    ],
  },
} as const;

export default function AdminReportSectionPage() {
  const params = useParams<{ section: keyof typeof reportConfig }>();
  const config = reportConfig[params.section] || reportConfig.sales;

  return (
    <AdminModulePage
      eyebrow="Reports"
      title={config.title}
      description={config.description}
      stats={config.stats}
      sections={[
        {
          title: "Primary views",
          items: [
            { title: "Snapshot", description: "A clean headline view for fast business checks." },
            { title: "Trend analysis", description: "Prepared for weekly, monthly, and campaign-level comparisons." },
            { title: "Export workflow", description: "Designed for finance, operations, and marketing handoff." },
          ],
        },
        {
          title: "Next data upgrades",
          items: [
            { title: "Advanced filtering", description: "Date range, campaign, collection, and channel filters can be added here." },
            { title: "Saved reports", description: "Team-ready saved views can come later without changing the navigation." },
          ],
        },
      ]}
    />
  );
}
