"use client";

import { AdminShell } from "@/components/admin-shell";
import {
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSubhead,
} from "@/components/admin-ui";
import { buildSalesSeries, buildTopSellingProducts } from "@/lib/admin-analytics";
import { formatAdminCurrency } from "@/lib/admin";
import { useAdminData } from "@/lib/use-admin-data";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";
import { useStorefrontData } from "@/lib/use-storefront";

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const { orders, customers } = useAdminData();
  const { products } = useStorefrontData();
  const { workspace } = useAdminWorkspace();

  const monthlySales = buildSalesSeries(orders, "monthly");
  const topProducts = buildTopSellingProducts(orders, products);

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Reports"
          title="Export the commercial story behind HRUSHE."
          description="Review sales, revenue, customers, orders, products, and coupon performance, then hand clean exports to finance, marketing, or operations."
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <AdminPanel>
            <AdminSubhead title="Revenue report" description="Monthly revenue progression." />
            <div className="space-y-3">
              {monthlySales.map((point) => (
                <div key={point.label} className="flex items-center justify-between border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold">{point.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{point.orders} orders</p>
                  </div>
                  <p className="text-sm font-semibold">{formatAdminCurrency(point.revenue)}</p>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="Top product performance" description="Best-performing products by quantity sold." />
            <div className="space-y-3">
              {topProducts.map((product) => (
                <div key={product.productId} className="flex items-center justify-between border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{product.quantity} units sold</p>
                  </div>
                  <p className="text-sm font-semibold">{formatAdminCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <ExportCard
            title="Sales report"
            description="Orders, revenue, payment state, and dates."
            onExport={() =>
              downloadCsv("hrushe-sales-report.csv", [
                ["Order", "Customer", "Amount", "Payment", "Status", "Date"],
                ...orders.map((order) => [
                  String(order.orderNumber || order.id),
                  order.customerName,
                  String(order.totalAmount),
                  order.paymentStatus,
                  order.orderStatus,
                  order.createdAt,
                ]),
              ])
            }
          />
          <ExportCard
            title="Customer report"
            description="Profiles, spend, order count, and last order date."
            onExport={() =>
              downloadCsv("hrushe-customer-report.csv", [
                ["Customer", "Email", "Orders", "Spend", "Last order", "Status"],
                ...customers.map((customer) => [
                  customer.name,
                  customer.email,
                  String(customer.orderCount),
                  String(customer.totalSpend),
                  customer.lastOrderDate || "",
                  customer.status,
                ]),
              ])
            }
          />
          <ExportCard
            title="Coupon performance"
            description="Coupon type, usage, expiry, and targeting."
            onExport={() =>
              downloadCsv("hrushe-coupon-report.csv", [
                ["Code", "Title", "Type", "Usage", "Limit", "Expiry", "Customer"],
                ...workspace.coupons.map((coupon) => [
                  coupon.code,
                  coupon.title,
                  coupon.type,
                  String(coupon.usedCount),
                  String(coupon.usageLimit),
                  coupon.expiresAt || "",
                  coupon.customerEmail,
                ]),
              ])
            }
          />
        </div>

        <AdminPanel>
          <AdminSubhead title="Report coverage" description="All core business views currently mapped inside the dashboard." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              "Sales report",
              "Product performance",
              "Revenue report",
              "Customer report",
              "Order report",
              "Coupon performance",
              "Export CSV",
              "Export Excel-ready CSV",
            ].map((item) => (
              <div key={item} className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
                <AdminSectionLabel>{item}</AdminSectionLabel>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Available from the reporting dashboard for finance and operations handoff.
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function ExportCard({
  title,
  description,
  onExport,
}: {
  title: string;
  description: string;
  onExport: () => void;
}) {
  return (
    <AdminPanel>
      <p className="text-lg font-semibold tracking-[-0.03em]">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
      <button type="button" onClick={onExport} className="button-primary mt-5 px-5 py-3 text-sm font-medium">
        Export CSV
      </button>
    </AdminPanel>
  );
}

