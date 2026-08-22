"use client";

import Link from "next/link";
import { useState } from "react";
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
  formatAdminCurrency,
  formatAdminDate,
  formatCompactNumber,
  orderStatusTone,
} from "@/lib/admin";
import {
  useAdminDashboardOverview,
  type AdminDashboardActionCard,
  type AdminDashboardDatePreset,
  type AdminDashboardRecentOrder,
} from "@/lib/use-admin-dashboard-overview";

const dateFilters: Array<{ value: AdminDashboardDatePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "previousMonth", label: "Previous month" },
  { value: "custom", label: "Custom range" },
];

function formatAdminPaise(value: number) {
  return formatAdminCurrency((Number(value) || 0) / 100);
}

function formatGeneratedAt(value: string) {
  if (!value) {
    return "Not loaded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<AdminDashboardDatePreset>("last7");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const { overview, loading, error } = useAdminDashboardOverview({
    range,
    from: customFrom,
    to: customTo,
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Overview"
          title="Run HRUSHE from one operations dashboard."
          description="Server-backed revenue, payment, inventory, fulfilment, support, and storefront publishing signals for the current operating window."
          actions={
            <>
              <Link href="/admin/homepage" className="button-secondary px-5 py-3 text-sm font-medium">
                Manage homepage
              </Link>
              <Link href="/admin/orders" className="button-primary px-5 py-3 text-sm font-medium">
                Open orders
              </Link>
            </>
          }
        />

        <AdminPanel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <AdminSectionLabel>Date filter</AdminSectionLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {overview.dateRange.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Business timezone: {overview.dateRange.timezone}. Generated {formatGeneratedAt(overview.generatedAt)}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[220px_150px_150px]">
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as AdminDashboardDatePreset)}
                className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm outline-none"
              >
                {dateFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={customFrom}
                disabled={range !== "custom"}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm outline-none disabled:opacity-45"
                aria-label="Custom start date"
              />
              <input
                type="date"
                value={customTo}
                disabled={range !== "custom"}
                onChange={(event) => setCustomTo(event.target.value)}
                className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm outline-none disabled:opacity-45"
                aria-label="Custom end date"
              />
            </div>
          </div>
          {error ? (
            <p className="mt-4 border border-[rgba(214,31,38,0.2)] bg-[rgba(214,31,38,0.06)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </AdminPanel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Revenue today"
            value={formatAdminPaise(overview.revenue.todayPaise)}
            detail="Paid order value for the current business day."
            tone="accent"
          />
          <AdminMetricCard
            label="Revenue this week"
            value={formatAdminPaise(overview.revenue.weekPaise)}
            detail="Paid order value for the last 7 business days."
          />
          <AdminMetricCard
            label="Revenue this month"
            value={formatAdminPaise(overview.revenue.monthPaise)}
            detail="Paid order value in the current calendar month."
          />
          <AdminMetricCard
            label="Average order value"
            value={formatAdminPaise(overview.revenue.averageOrderValuePaise)}
            detail={`${overview.revenue.selectedPaidOrders} paid orders in ${overview.dateRange.label.toLowerCase()}.`}
            tone="success"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CompactMetric label="Orders today" value={formatCompactNumber(overview.orders.today)} />
          <CompactMetric label="Awaiting payment" value={formatCompactNumber(overview.orders.awaitingPayment)} />
          <CompactMetric label="Awaiting fulfilment" value={formatCompactNumber(overview.orders.awaitingFulfillment)} />
          <CompactMetric label="Awaiting shipment" value={formatCompactNumber(overview.orders.awaitingShipment)} />
          <CompactMetric label="Failed payments" value={formatCompactNumber(overview.payments.failed)} />
          <CompactMetric label="Manual review payments" value={formatCompactNumber(overview.payments.manualReview)} />
          <CompactMetric label="Reconciliation issues" value={formatCompactNumber(overview.payments.reconciliationIssues)} />
          <CompactMetric label="Reserved inventory" value={formatCompactNumber(overview.inventory.reservedUnits)} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <AdminPanel>
            <AdminSubhead
              title="Action centre"
              description="Each card links to the operational surface that owns the issue."
            />
            <div className="grid gap-3 md:grid-cols-2">
              {overview.actionCards.map((card) => (
                <ActionCentreCard key={card.id} card={card} />
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="Operational warnings" description="Signals that need owner review." />
            <div className="space-y-3">
              <WarningRow
                label="Payment warnings"
                value={overview.payments.warningTotal}
                href="/admin/reports/orders"
              />
              <WarningRow
                label="Low-stock variants"
                value={overview.inventory.lowStockVariants}
                href="/admin/inventory?stock=low"
              />
              <WarningRow
                label="Out-of-stock variants"
                value={overview.inventory.outOfStockVariants}
                href="/admin/inventory?stock=out"
              />
              <WarningRow
                label="Support queue"
                value={overview.support.attention}
                href="/admin/support?status=open"
              />
              <WarningRow
                label="Storefront content warnings"
                value={overview.storefront.brokenLinks + overview.storefront.missingMobileMedia}
                href="/admin/homepage"
              />
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
          <AdminPanel>
            <AdminSubhead
              title="Recent orders"
              description="Newest storefront orders with payment and fulfilment state."
            />
            <div className="overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
              <div className="hidden grid-cols-[140px_minmax(0,1fr)_140px_140px_120px] gap-3 border-b border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,transparent)] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] lg:grid">
                <span>Order</span>
                <span>Customer</span>
                <span>Payment</span>
                <span>Status</span>
                <span className="text-right">Value</span>
              </div>
              <div className="divide-y divide-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                {overview.recentOrders.length > 0 ? (
                  overview.recentOrders.map((order) => <RecentOrderRow key={order.id} order={order} />)
                ) : (
                  <p className="px-5 py-5 text-sm text-[var(--muted)]">
                    No orders are available for this dashboard snapshot.
                  </p>
                )}
              </div>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Top products"
              description={`Paid order quantity in ${overview.dateRange.label.toLowerCase()}.`}
            />
            <div className="space-y-3">
              {overview.topProducts.length > 0 ? (
                overview.topProducts.map((product, index) => (
                  <div
                    key={`${product.productId}-${product.name}`}
                    className="flex items-center justify-between gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 truncate text-sm font-semibold">{product.name || "Product"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{product.quantity} sold</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {formatAdminPaise(product.revenuePaise)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No paid product sales in this date range.</p>
              )}
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <AdminPanel>
            <AdminSubhead title="Storefront publishing" description="Homepage CMS publication and media health." />
            <div className="grid gap-3 md:grid-cols-2">
              <StatusTile label="Scheduled campaigns" value={overview.storefront.scheduledCampaigns} />
              <StatusTile label="Draft storefront changes" value={overview.storefront.draftStorefrontChanges} />
              <StatusTile label="Missing mobile media" value={overview.storefront.missingMobileMedia} />
              <StatusTile
                label="Recently published"
                value={overview.storefront.recentPublishedAt ? formatAdminDate(overview.storefront.recentPublishedAt) : "None"}
              />
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Unavailable metrics"
              description="The dashboard does not invent data where the domain model is not present yet."
            />
            <div className="space-y-3">
              {overview.unsupportedMetrics.map((metric) => (
                <div
                  key={metric.key}
                  className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{metric.label}</p>
                    <AdminBadge>Not configured</AdminBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{metric.reason}</p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading latest server-backed dashboard metrics...</p>
        ) : null}
      </div>
    </AdminShell>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <AdminPanel>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </AdminPanel>
  );
}

function ActionCentreCard({ card }: { card: AdminDashboardActionCard }) {
  return (
    <Link
      href={card.href}
      className="group flex min-h-[168px] flex-col justify-between border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 transition hover:border-[color:color-mix(in_srgb,var(--foreground)_22%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)]"
    >
      <div className="flex items-start justify-between gap-3">
        <AdminBadge tone={card.tone}>{card.severity}</AdminBadge>
        <p className="text-3xl font-semibold tracking-[-0.04em]">{card.count}</p>
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-[-0.02em]">{card.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.description}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--foreground)]">
          Open queue
        </p>
      </div>
    </Link>
  );
}

function WarningRow({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)]"
    >
      <p className="text-sm font-semibold">{label}</p>
      <AdminBadge tone={value > 0 ? "warning" : "success"}>{value}</AdminBadge>
    </Link>
  );
}

function RecentOrderRow({ order }: { order: AdminDashboardRecentOrder }) {
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="grid gap-4 px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)] lg:grid-cols-[140px_minmax(0,1fr)_140px_140px_120px] lg:px-5"
    >
      <div>
        <p className="text-sm font-semibold">#{order.orderNumber || order.id.slice(-6)}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {new Date(order.createdAt).toLocaleDateString("en-IN")}
        </p>
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
        <p className="text-sm font-semibold">{formatAdminPaise(order.totalPaise)}</p>
      </div>
    </Link>
  );
}

function StatusTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}
