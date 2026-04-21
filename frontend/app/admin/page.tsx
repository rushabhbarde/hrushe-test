"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminActionButton,
  AdminBadge,
  AdminKeyValue,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSubhead,
} from "@/components/admin-ui";
import { apiRequest } from "@/lib/api";
import { formatAdminCurrency } from "@/lib/admin";
import { type Product } from "@/lib/catalog";
import { formatOrderDate, type OrderRecord } from "@/lib/orders";
import { useStorefrontData } from "@/lib/use-storefront";

type CustomerPreview = {
  id: string;
  name: string;
  email: string;
  totalSpend: number;
  orderCount: number;
  status: "New" | "Active" | "VIP" | "At Risk";
};

export default function AdminDashboardPage() {
  const { products, homepageBanner } = useStorefrontData();
  const { data: ordersData } = useAdminData<OrderRecord[]>("/order/all");
  const { data: customersData } = useAdminData<CustomerPreview[]>("/admin/customers");
  const orders = useMemo(() => ordersData || [], [ordersData]);
  const customers = useMemo(() => customersData || [], [customersData]);

  const overview = useMemo(() => {
    const now = new Date();

    const isSameDay = (value?: string) => {
      if (!value) {
        return false;
      }
      return new Date(value).toDateString() === now.toDateString();
    };

    const todayOrders = orders.filter((order) => isSameDay(order.createdAt));
    const todaySales = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingCount = orders.filter((order) =>
      ["Pending", "Confirmed", "Packed"].includes(order.orderStatus)
    ).length;
    const shippedCount = orders.filter((order) =>
      ["Shipped", "Out for delivery"].includes(order.orderStatus)
    ).length;
    const deliveredCount = orders.filter((order) => order.orderStatus === "Delivered").length;
    const cancellationCount = orders.filter((order) =>
      ["Cancelled", "Returned"].includes(order.orderStatus)
    ).length;
    const lowSignalProducts = products.filter(
      (product) => product.images.length < 2 || product.sizes.length === 0
    );
    const topProducts = [...products]
      .sort((left, right) => {
        const score = (product: Product) =>
          Number(Boolean(product.bestSeller)) * 5 +
          Number(Boolean(product.featured)) * 3 +
          Number(Boolean(product.newArrival || product.newIn));
        return score(right) - score(left);
      })
      .slice(0, 5);

    const revenueTrend = Array.from({ length: 7 }, (_, index) => {
      const target = new Date(now);
      target.setDate(now.getDate() - (6 - index));
      return {
        label: target.toLocaleDateString("en-IN", { weekday: "short" }),
        total: orders
          .filter((order) => new Date(order.createdAt).toDateString() === target.toDateString())
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      };
    });
    const maxTrend = Math.max(...revenueTrend.map((point) => point.total), 1);

    return {
      todaySales,
      todayOrders: todayOrders.length,
      pendingCount,
      shippedCount,
      deliveredCount,
      cancellationCount,
      lowSignalProducts,
      topProducts,
      revenueTrend,
      maxTrend,
      recentOrders: orders.slice(0, 6),
      recentCustomers: customers.slice(0, 5),
    };
  }, [customers, orders, products]);

  const quickActions = [
    { href: "/admin/add-product", label: "Add product", detail: "Launch a new SKU or seasonal edit." },
    { href: "/admin/collections", label: "Create collection", detail: "Merchandise a capsule or story." },
    { href: "/admin/orders", label: "Process pending orders", detail: "Move the queue forward fast." },
    { href: "/admin/returns", label: "View returns", detail: "Handle post-purchase issues." },
    { href: "/admin/coupons", label: "Create coupon", detail: "Set offers and usage rules." },
    { href: "/admin/storefront", label: "Edit storefront", detail: "Control the homepage and announcements." },
  ];

  return (
    <AdminShell
      contextualActions={
        <Link href="/admin/orders" className="button-secondary rounded-full px-4 py-2.5 text-sm font-medium">
          Review operations
        </Link>
      }
    >
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Control center"
          title="Run the brand from one calm surface."
          description="Commerce, catalog, customers, and storefront content are organized into one operating layer so the important things stay visible without turning into dashboard noise."
          actions={
            <>
              <AdminActionButton href="/admin/add-product">Add product</AdminActionButton>
              <AdminActionButton href="/admin/storefront" variant="secondary">
                Edit storefront
              </AdminActionButton>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Today’s sales"
            value={formatAdminCurrency(overview.todaySales)}
            detail={`${overview.todayOrders} orders placed today.`}
            tone="accent"
          />
          <AdminMetricCard
            label="Pending flow"
            value={String(overview.pendingCount)}
            detail="Orders waiting for confirmation, packing, or dispatch."
          />
          <AdminMetricCard
            label="Shipped & in transit"
            value={String(overview.shippedCount)}
            detail="Orders already handed to courier."
            tone="success"
          />
          <AdminMetricCard
            label="Returns / cancellations"
            value={String(overview.cancellationCount)}
            detail="A live signal for support load and churn risk."
            tone={overview.cancellationCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <AdminPanel>
            <AdminSubhead
              title="Revenue rhythm"
              description="A quick weekly pulse to spot momentum shifts without leaving the overview."
              action={<AdminBadge tone="accent">7 day view</AdminBadge>}
            />
            <div className="grid grid-cols-7 gap-3 pt-3">
              {overview.revenueTrend.map((point) => {
                const height = Math.max(14, Math.round((point.total / overview.maxTrend) * 180));
                return (
                  <div key={point.label} className="flex flex-col items-center gap-3">
                    <div className="flex h-[200px] w-full items-end rounded-[1.2rem] bg-[rgba(17,17,17,0.03)] px-2 pb-2">
                      <div
                        className="w-full rounded-[1rem] bg-[linear-gradient(180deg,#111111,#d61f26)]"
                        style={{ height }}
                      />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                      {point.label}
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {point.total > 0 ? formatAdminCurrency(point.total) : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Quick actions"
              description="Frequent workflows tuned for day-to-day operations."
            />
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4 transition hover:border-[rgba(17,17,17,0.18)] hover:bg-[rgba(17,17,17,0.02)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold tracking-[-0.02em]">{action.label}</p>
                    <span className="text-lg text-[var(--muted)]">↗</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{action.detail}</p>
                </Link>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr_1fr]">
          <AdminPanel>
            <AdminSubhead
              title="Recent orders"
              description="The latest checkouts entering the ops queue."
              action={<Link href="/admin/orders" className="text-sm font-medium text-[var(--accent)]">View all</Link>}
            />
            <div className="space-y-3">
              {overview.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4 transition hover:bg-[rgba(17,17,17,0.02)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold tracking-[-0.02em]">
                        Order #{order.orderNumber || order.id.slice(-6)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {order.customerName} · {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <AdminBadge tone={order.orderStatus === "Delivered" ? "success" : order.orderStatus === "Cancelled" ? "warning" : "default"}>
                      {order.orderStatus}
                    </AdminBadge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <AdminKeyValue label="Payment" value={order.paymentStatus} />
                    <AdminKeyValue label="Value" value={formatAdminCurrency(order.totalAmount)} />
                  </div>
                </Link>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Top products"
              description="Catalog leaders and launch priorities."
              action={<Link href="/admin/products" className="text-sm font-medium text-[var(--accent)]">Catalog</Link>}
            />
            <div className="space-y-3">
              {overview.topProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="block rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold tracking-[-0.02em]">{product.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{product.category}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {product.bestSeller ? <AdminBadge tone="accent">Best seller</AdminBadge> : null}
                      {product.featured ? <AdminBadge>Featured</AdminBadge> : null}
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="text-lg font-semibold">{formatAdminCurrency(product.price)}</p>
                    <p className="text-sm text-[var(--muted)]">{product.images.length} images</p>
                  </div>
                </Link>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Customers to watch"
              description="Recent and valuable shoppers worth attention."
              action={<Link href="/admin/customers" className="text-sm font-medium text-[var(--accent)]">CRM view</Link>}
            />
            <div className="space-y-3">
              {overview.recentCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="block rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold tracking-[-0.02em]">{customer.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{customer.email}</p>
                    </div>
                    <AdminBadge tone={customer.status === "VIP" ? "accent" : customer.status === "At Risk" ? "warning" : "default"}>
                      {customer.status}
                    </AdminBadge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <AdminKeyValue label="Spend" value={formatAdminCurrency(customer.totalSpend)} />
                    <AdminKeyValue label="Orders" value={customer.orderCount} />
                  </div>
                </Link>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
          <AdminPanel>
            <AdminSubhead title="What needs attention" description="Operational gaps and storefront polish signals." />
            <div className="grid gap-3 md:grid-cols-2">
              <AttentionCard
                label="Catalog quality"
                title={`${overview.lowSignalProducts.length} products need cleanup`}
                detail="Products without enough imagery or sellable size setup are harder to convert."
                href="/admin/products"
              />
              <AttentionCard
                label="Homepage readiness"
                title={homepageBanner.title || "Banner copy ready"}
                detail="Storefront CTA, announcement strip, and visual hero stay editable from one content module."
                href="/admin/storefront"
              />
              <AttentionCard
                label="Delivery flow"
                title={`${overview.deliveredCount} delivered so far`}
                detail="Follow up on shipped orders, refunds, and customer support handoffs."
                href="/admin/orders"
              />
              <AttentionCard
                label="Retention"
                title={`${customers.filter((customer) => customer.status === "VIP").length} VIP customers found`}
                detail="High-value customers are visible directly in the customer intelligence layer."
                href="/admin/customers"
              />
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="Business summary" description="Compact brand health view for a quick scan." />
            <div className="space-y-4">
              <SummaryRow label="Products live" value={String(products.length)} />
              <SummaryRow label="Orders recorded" value={String(orders.length)} />
              <SummaryRow label="Customers in CRM" value={String(customers.length)} />
              <SummaryRow
                label="Average order value"
                value={formatAdminCurrency(
                  orders.length
                    ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length
                    : 0
                )}
              />
              <SummaryRow label="Homepage CTA" value={homepageBanner.primaryCtaLabel || "Shop now"} />
            </div>
          </AdminPanel>
        </div>
      </div>
    </AdminShell>
  );
}

function AttentionCard({
  label,
  title,
  detail,
  href,
}: {
  label: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-[1.4rem] border border-[rgba(17,17,17,0.08)] px-4 py-4 transition hover:bg-[rgba(17,17,17,0.02)]">
      <AdminSectionLabel>{label}</AdminSectionLabel>
      <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </Link>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-[rgba(17,17,17,0.08)] px-4 py-3">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="text-base font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  );
}

function useAdminData<T>(path: string) {
  const [state, setState] = useState<{ data?: T; error: string; loading: boolean }>({
    data: undefined,
    error: "",
    loading: true,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await apiRequest<T>(path);
        if (active) {
          setState({ data, error: "", loading: false });
        }
      } catch (error) {
        if (active) {
          setState({
            data: undefined,
            error: error instanceof Error ? error.message : "Request failed",
            loading: false,
          });
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
