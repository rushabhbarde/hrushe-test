"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSubhead,
} from "@/components/admin-ui";
import {
  buildRecentCustomerActivity,
  buildSalesSeries,
  buildTopSellingProducts,
} from "@/lib/admin-analytics";
import {
  formatAdminCurrency,
  formatCompactNumber,
  orderStatusTone,
} from "@/lib/admin";
import { resolveProductAdminMeta } from "@/lib/admin-workspace";
import { useAdminData } from "@/lib/use-admin-data";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";
import { useStorefrontData } from "@/lib/use-storefront";

const analyticsTabs = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

export default function AdminDashboardPage() {
  const { products } = useStorefrontData();
  const { orders, customers, loading } = useAdminData();
  const { workspace } = useAdminWorkspace();
  const [analyticsMode, setAnalyticsMode] = useState<(typeof analyticsTabs)[number]["key"]>("daily");

  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.orderStatus === "Pending").length;
    const shippedOrders = orders.filter((order) =>
      ["Shipped", "Out for delivery"].includes(order.orderStatus)
    ).length;
    const deliveredOrders = orders.filter((order) => order.orderStatus === "Delivered").length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      totalRevenue,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      activeProducts: products.filter(
        (product) => resolveProductAdminMeta(workspace, product).status === "Active"
      ).length,
    };
  }, [orders, products, workspace]);

  const salesSeries = useMemo(
    () => buildSalesSeries(orders, analyticsMode),
    [analyticsMode, orders]
  );
  const topProducts = useMemo(() => buildTopSellingProducts(orders, products), [orders, products]);
  const recentActivity = useMemo(
    () => buildRecentCustomerActivity(orders, customers),
    [orders, customers]
  );

  const maxRevenue = Math.max(...salesSeries.map((item) => item.revenue), 1);

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Overview"
          title="Run HRUSHE from one premium control room."
          description="Track commerce health, keep campaigns moving, and manage the full luxury storefront operation from a single responsive dashboard."
          actions={
            <>
              <Link href="/admin/homepage" className="button-secondary px-5 py-3 text-sm font-medium">
                Manage homepage
              </Link>
              <Link href="/admin/add-product" className="button-primary px-5 py-3 text-sm font-medium">
                Add product
              </Link>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Total orders"
            value={formatCompactNumber(orders.length)}
            detail="All-time orders placed across the storefront."
          />
          <AdminMetricCard
            label="Total revenue"
            value={formatAdminCurrency(metrics.totalRevenue)}
            detail="Gross order value captured from all orders."
            tone="accent"
          />
          <AdminMetricCard
            label="Pending orders"
            value={String(metrics.pendingOrders)}
            detail="Orders that still need confirmation or fulfillment."
            tone="warning"
          />
          <AdminMetricCard
            label="Shipped / delivered"
            value={`${metrics.shippedOrders} / ${metrics.deliveredOrders}`}
            detail="Live delivery momentum for active shipments and completed orders."
            tone="success"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CompactCard label="Total customers" value={formatCompactNumber(customers.length)} detail="Accounts and repeat buyers." />
          <CompactCard label="Total products" value={formatCompactNumber(products.length)} detail="All catalog entries in the admin." />
          <CompactCard label="Active products" value={String(metrics.activeProducts)} detail="Products currently visible on the storefront." />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <AdminPanel>
            <AdminSubhead
              title="Sales analytics"
              description="Daily, weekly, and monthly order revenue pulse."
              action={
                <div className="flex flex-wrap gap-2">
                  {analyticsTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAnalyticsMode(tab.key)}
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] ${
                        analyticsMode === tab.key
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)] text-[var(--muted)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              }
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_240px]">
              <div className="flex min-h-[280px] items-end gap-3 overflow-x-auto border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] p-5">
                {salesSeries.map((point) => (
                  <div key={point.label} className="flex min-w-[88px] flex-1 flex-col justify-end gap-3">
                    <div className="relative flex min-h-[190px] items-end bg-[linear-gradient(180deg,color-mix(in_srgb,var(--foreground)_4%,transparent),transparent)]">
                      <div
                        className="w-full bg-[linear-gradient(180deg,color-mix(in_srgb,var(--foreground)_86%,transparent),color-mix(in_srgb,var(--foreground)_62%,transparent))]"
                        style={{
                          height: `${Math.max((point.revenue / maxRevenue) * 100, 8)}%`,
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{formatAdminCurrency(point.revenue)}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        {point.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                {salesSeries.slice(-3).map((point) => (
                  <div
                    key={`summary-${point.label}`}
                    className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{point.label}</p>
                    <p className="mt-3 text-lg font-semibold">{formatAdminCurrency(point.revenue)}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{point.orders} orders</p>
                  </div>
                ))}
              </div>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Top selling products"
              description="Best performers by quantity sold."
            />
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{product.category || "Collection item"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{product.quantity} sold</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatAdminCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
          <AdminPanel>
            <AdminSubhead title="Recent orders" description="Operational queue for the newest orders." />
            <div className="overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
              <div className="hidden grid-cols-[140px_minmax(0,1fr)_140px_140px_120px] gap-3 border-b border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,transparent)] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] lg:grid">
                <span>Order</span>
                <span>Customer</span>
                <span>Payment</span>
                <span>Status</span>
                <span className="text-right">Value</span>
              </div>
              <div className="divide-y divide-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                {orders.slice(0, 8).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="grid gap-4 px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)] lg:grid-cols-[140px_minmax(0,1fr)_140px_140px_120px] lg:px-5"
                  >
                    <div>
                      <p className="text-sm font-semibold">#{order.orderNumber || order.id.slice(-6)}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{order.customerName}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{order.customerEmail}</p>
                    </div>
                    <div>
                      <AdminBadge tone={order.paymentStatus === "paid" ? "success" : "default"}>
                        {order.paymentStatus}
                      </AdminBadge>
                    </div>
                    <div>
                      <AdminBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminBadge>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-sm font-semibold">{formatAdminCurrency(order.totalAmount)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Recent customer activity"
              description="Fresh signals from orders and account creation."
            />
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
                    </div>
                    <p className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      {new Date(item.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-5 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
              <AdminSectionLabel>Theme & operations</AdminSectionLabel>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminBadge tone={workspace.websiteSettings.maintenanceMode ? "warning" : "success"}>
                  {workspace.websiteSettings.maintenanceMode ? "Maintenance mode on" : "Storefront live"}
                </AdminBadge>
                <AdminBadge tone="accent">{workspace.roles.length} admin roles</AdminBadge>
                <AdminBadge tone="default">{workspace.coupons.filter((coupon) => coupon.active).length} live offers</AdminBadge>
              </div>
            </div>
          </AdminPanel>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading the latest admin datasets…</div>
        ) : null}
      </div>
    </AdminShell>
  );
}

function CompactCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <AdminPanel>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </AdminPanel>
  );
}
