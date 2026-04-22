"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminBadge, AdminPanel, AdminSectionLabel } from "@/components/admin-ui";
import {
  deriveProductStatus,
  formatAdminCurrency,
  formatAdminDate,
  orderStatusTone,
  type AdminCustomer,
  type AdminSupportRequest,
} from "@/lib/admin";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { formatOrderDate, type OrderRecord, type OrderStatus } from "@/lib/orders";
import { useStorefrontData } from "@/lib/use-storefront";

type PriorityAction = {
  key: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  tone?: "default" | "accent" | "success" | "warning";
};

type ActivityItem = {
  key: string;
  label: string;
  detail: string;
  href: string;
  date: string;
};

const nextOrderAction: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  Pending: { label: "Confirm", next: "Confirmed" },
  Confirmed: { label: "Mark packed", next: "Packed" },
  Packed: { label: "Mark shipped", next: "Shipped" },
  Shipped: { label: "Out for delivery", next: "Out for delivery" },
  "Out for delivery": { label: "Mark delivered", next: "Delivered" },
};

export default function AdminDashboardPage() {
  const { products } = useStorefrontData();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [supportRequests, setSupportRequests] = useState<AdminSupportRequest[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.allSettled([
      apiRequest<OrderRecord[]>("/order/all"),
      apiRequest<AdminCustomer[]>("/admin/customers"),
      apiRequest<AdminSupportRequest[]>("/support/requests"),
    ]).then(([orderResult, customerResult, supportResult]) => {
      if (!active) {
        return;
      }

      setOrders(orderResult.status === "fulfilled" ? orderResult.value : []);
      setCustomers(customerResult.status === "fulfilled" ? customerResult.value : []);
      setSupportRequests(supportResult.status === "fulfilled" ? supportResult.value : []);
    });

    return () => {
      active = false;
    };
  }, []);

  const operations = useMemo(() => {
    const todayKey = new Date().toDateString();
    const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === todayKey);
    const pendingOrders = orders.filter((order) => order.orderStatus === "Pending");
    const ordersToPack = orders.filter((order) => order.orderStatus === "Confirmed" || order.orderStatus === "Packed");
    const returnsOpen = orders.filter((order) => order.orderStatus === "Returned").length;
    const failedPayments = orders.filter((order) => order.paymentStatus === "failed");
    const pendingShipments = orders.filter((order) =>
      ["Pending", "Confirmed", "Packed", "Shipped", "Out for delivery"].includes(order.orderStatus),
    ).length;
    const lowStockProducts = products.filter((product) => product.sizes.length === 0);
    const incompleteProducts = products.filter((product) => {
      const status = deriveProductStatus(product);
      return status === "Draft" || product.images.length < 2 || !product.description?.trim();
    });
    const openSupport = supportRequests.filter((request) => request.status !== "resolved");

    return {
      todayOrders,
      todayRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      pendingOrders,
      ordersToPack,
      returnsOpen,
      failedPayments,
      pendingShipments,
      lowStockProducts,
      incompleteProducts,
      openSupport,
    };
  }, [orders, products, supportRequests]);

  const priorityActions = useMemo<PriorityAction[]>(() => {
    const orderActions = operations.pendingOrders.slice(0, 3).map((order) => ({
      key: `pending-${order.id}`,
      title: `Confirm order #${order.orderNumber || order.id.slice(-6)}`,
      detail: `${order.customerName} · ${formatAdminCurrency(order.totalAmount)} · ${order.products.length} item(s)`,
      href: `/admin/orders/${order.id}`,
      actionLabel: "Review order",
      tone: "accent" as const,
    }));

    const packActions = operations.ordersToPack.slice(0, 2).map((order) => ({
      key: `pack-${order.id}`,
      title: `${order.orderStatus === "Confirmed" ? "Pack" : "Ship"} order #${order.orderNumber || order.id.slice(-6)}`,
      detail: `${order.customerName} · ${order.courierName || "Courier not added"}`,
      href: `/admin/orders/${order.id}`,
      actionLabel: "Open fulfillment",
      tone: "default" as const,
    }));

    const paymentActions = operations.failedPayments.slice(0, 2).map((order) => ({
      key: `payment-${order.id}`,
      title: `Review failed payment #${order.orderNumber || order.id.slice(-6)}`,
      detail: `${order.customerName} · ${formatAdminCurrency(order.totalAmount)}`,
      href: `/admin/orders/${order.id}`,
      actionLabel: "Review payment",
      tone: "warning" as const,
    }));

    const productActions = operations.incompleteProducts.slice(0, 3).map((product) => ({
      key: `product-${product.id}`,
      title: `Complete ${product.name}`,
      detail: getProductFixHint(product),
      href: `/admin/products/${product.id}`,
      actionLabel: "Update product",
      tone: "warning" as const,
    }));

    const supportActions = operations.openSupport.slice(0, 2).map((ticket) => ({
      key: `support-${ticket.id || ticket._id}`,
      title: ticket.subject || "Customer support request",
      detail: `${ticket.category} · ${ticket.userId?.email || "Customer not linked"}`,
      href: "/admin/support",
      actionLabel: "Resolve",
      tone: "accent" as const,
    }));

    return [...orderActions, ...packActions, ...paymentActions, ...productActions, ...supportActions].slice(0, 8);
  }, [operations]);

  const activity = useMemo<ActivityItem[]>(() => {
    const orderActivity = orders.slice(0, 8).map((order) => ({
      key: `order-${order.id}`,
      label: `Order #${order.orderNumber || order.id.slice(-6)} placed`,
      detail: `${order.customerName} · ${formatAdminCurrency(order.totalAmount)}`,
      href: `/admin/orders/${order.id}`,
      date: order.createdAt,
    }));

    const customerActivity = customers.slice(0, 5).map((customer) => ({
      key: `customer-${customer.id}`,
      label: "Customer account created",
      detail: `${customer.name} · ${customer.email}`,
      href: `/admin/customers/${customer.id}`,
      date: customer.createdAt,
    }));

    const supportActivity = supportRequests.slice(0, 5).map((ticket) => ({
      key: `ticket-${ticket.id || ticket._id}`,
      label: "Support request opened",
      detail: `${ticket.subject || ticket.category} · ${ticket.status}`,
      href: "/admin/support",
      date: ticket.createdAt,
    }));

    return [...orderActivity, ...customerActivity, ...supportActivity]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 10);
  }, [customers, orders, supportRequests]);

  async function progressOrder(order: OrderRecord) {
    const next = nextOrderAction[order.orderStatus];
    if (!next) {
      return;
    }

    setStatusMessage("");
    setUpdatingOrderId(order.id);
    try {
      const updatedOrder = await apiRequest<OrderRecord>(`/order/status/${order.id}`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus: next.next }),
      });
      setOrders((current) => current.map((item) => (item.id === order.id ? updatedOrder : item)));
      setStatusMessage(`Order #${order.orderNumber || order.id.slice(-6)} moved to ${next.next}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not update order.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-5">
        <section className="grid gap-3 rounded-[1.5rem] border border-[rgba(17,17,17,0.08)] bg-white px-4 py-4 shadow-[0_12px_32px_rgba(17,17,17,0.04)] sm:grid-cols-2 lg:grid-cols-5">
          <CompactMetric label="Today orders" value={String(operations.todayOrders.length)} />
          <CompactMetric label="Today revenue" value={formatAdminCurrency(operations.todayRevenue)} />
          <CompactMetric label="Pending shipments" value={String(operations.pendingShipments)} />
          <CompactMetric label="Open returns" value={String(operations.returnsOpen)} />
          <CompactMetric label="Low stock" value={String(operations.lowStockProducts.length)} />
        </section>

        {statusMessage ? (
          <div className="rounded-full border border-[rgba(17,17,17,0.08)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
          <AdminPanel className="p-0 md:p-0">
            <div className="border-b border-[rgba(17,17,17,0.08)] px-5 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <AdminSectionLabel>Priority work</AdminSectionLabel>
                  <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                    Process what needs attention.
                  </h1>
                </div>
                <Link href="/admin/orders" className="button-secondary rounded-full px-4 py-2 text-sm font-medium">
                  Open order queue
                </Link>
              </div>
            </div>

            <div className="divide-y divide-[rgba(17,17,17,0.08)]">
              {priorityActions.length ? (
                priorityActions.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="grid gap-3 px-5 py-4 transition hover:bg-[rgba(17,17,17,0.025)] sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminBadge tone={item.tone}>{item.actionLabel}</AdminBadge>
                        <p className="font-semibold tracking-[-0.02em]">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">{item.detail}</p>
                    </div>
                    <span className="text-sm font-medium text-[var(--accent)]">Review</span>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-8">
                  <p className="text-lg font-semibold tracking-[-0.03em]">No urgent work right now.</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Use quick actions below to add products, adjust stock, or review the order queue.
                  </p>
                </div>
              )}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSectionLabel>Quick actions</AdminSectionLabel>
            <div className="mt-4 grid gap-2">
              <QuickAction href="/admin/add-product" label="Add product" detail="Create a SKU, variants, images" />
              <QuickAction href="/admin/orders?status=Pending" label="Process orders" detail="Confirm, pack, ship" />
              <QuickAction href="/admin/inventory" label="Update inventory" detail="Fix low/out-of-stock items" />
              <QuickAction href="/admin/announcements" label="Edit announcement" detail="Update top promo strip" />
              <QuickAction href="/admin/coupons" label="Create coupon" detail="Discounts and campaign rules" />
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <AdminPanel className="p-0 md:p-0">
            <PanelHeader label="Latest orders" href="/admin/orders" />
            <div className="divide-y divide-[rgba(17,17,17,0.08)]">
              {orders.slice(0, 5).map((order) => (
                <OrderWorkRow
                  key={order.id}
                  order={order}
                  isUpdating={updatingOrderId === order.id}
                  onProgress={() => void progressOrder(order)}
                />
              ))}
              {!orders.length ? <EmptyPanelLine text="No orders yet." /> : null}
            </div>
          </AdminPanel>

          <AdminPanel className="p-0 md:p-0">
            <PanelHeader label="Incomplete products" href="/admin/products?status=Draft" />
            <div className="divide-y divide-[rgba(17,17,17,0.08)]">
              {operations.incompleteProducts.slice(0, 5).map((product) => (
                <ProductWorkRow key={product.id} product={product} />
              ))}
              {!operations.incompleteProducts.length ? <EmptyPanelLine text="Catalog setup is clean." /> : null}
            </div>
          </AdminPanel>

          <AdminPanel className="p-0 md:p-0">
            <PanelHeader label="Recent customers" href="/admin/customers" />
            <div className="divide-y divide-[rgba(17,17,17,0.08)]">
              {customers.slice(0, 5).map((customer) => (
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-[rgba(17,17,17,0.025)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{customer.name}</p>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">{customer.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatAdminCurrency(customer.totalSpend)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{customer.orderCount} orders</p>
                  </div>
                </Link>
              ))}
              {!customers.length ? <EmptyPanelLine text="No customer accounts yet." /> : null}
            </div>
          </AdminPanel>
        </div>

        <AdminPanel className="p-0 md:p-0">
          <div className="border-b border-[rgba(17,17,17,0.08)] px-5 py-5">
            <AdminSectionLabel>Recent activity</AdminSectionLabel>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Real events from orders, customers, and support. Each row opens the related work item.
            </p>
          </div>
          <div className="divide-y divide-[rgba(17,17,17,0.08)]">
            {activity.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="grid gap-2 px-5 py-4 transition hover:bg-[rgba(17,17,17,0.025)] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {formatAdminDate(item.date, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </Link>
            ))}
            {!activity.length ? <EmptyPanelLine text="Activity will appear after orders, customers, or support requests arrive." /> : null}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-[rgba(17,17,17,0.08)] px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function QuickAction({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="rounded-[1.1rem] border border-[rgba(17,17,17,0.08)] px-4 py-3 transition hover:border-[rgba(17,17,17,0.22)] hover:bg-[rgba(17,17,17,0.025)]"
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </Link>
  );
}

function PanelHeader({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[rgba(17,17,17,0.08)] px-5 py-4">
      <AdminSectionLabel>{label}</AdminSectionLabel>
      <Link href={href} className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
        View all
      </Link>
    </div>
  );
}

function OrderWorkRow({
  order,
  isUpdating,
  onProgress,
}: {
  order: OrderRecord;
  isUpdating: boolean;
  onProgress: () => void;
}) {
  const next = nextOrderAction[order.orderStatus];

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold hover:text-[var(--accent)]">
            #{order.orderNumber || order.id.slice(-6)}
          </Link>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">{order.customerName}</p>
        </div>
        <AdminBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminBadge>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{formatAdminCurrency(order.totalAmount)}</p>
        {next ? (
          <button
            type="button"
            onClick={onProgress}
            disabled={isUpdating}
            className="rounded-full border border-[rgba(17,17,17,0.12)] px-3 py-1.5 text-xs font-medium transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            {isUpdating ? "Updating..." : next.label}
          </button>
        ) : (
          <Link href={`/admin/orders/${order.id}`} className="text-xs font-medium text-[var(--accent)]">
            Open
          </Link>
        )}
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">{formatOrderDate(order.createdAt)}</p>
    </div>
  );
}

function ProductWorkRow({ product }: { product: Product }) {
  return (
    <Link
      href={`/admin/products/${product.id}`}
      className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-[rgba(17,17,17,0.025)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[rgba(17,17,17,0.06)]">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">{getProductFixHint(product)}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-[var(--accent)]">Fix</span>
    </Link>
  );
}

function EmptyPanelLine({ text }: { text: string }) {
  return <p className="px-5 py-6 text-sm text-[var(--muted)]">{text}</p>;
}

function getProductFixHint(product: Product) {
  if (!product.images.length) {
    return "Add product images";
  }
  if (product.images.length < 2) {
    return "Add one more image for storefront confidence";
  }
  if (!product.description?.trim()) {
    return "Add product description";
  }
  if (!product.category?.trim()) {
    return "Select category";
  }
  if (!product.sizes.length) {
    return "Add available sizes";
  }
  return "Review merchandising setup";
}
