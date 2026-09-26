"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminBadge, AdminFilterInput, AdminFilterSelect } from "@/components/admin-ui";
import { formatAdminCurrency, orderStatusTone } from "@/lib/admin";
import { resolveOrderAdminMeta } from "@/lib/admin-workspace";
import { orderStatuses, type OrderStatus } from "@/lib/orders";
import { useAdminData } from "@/lib/use-admin-data";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

function getInitialSearchParam(name: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get(name) || "";
}

const statusGroups: Array<{ key: string; label: string; statuses: OrderStatus[] }> = [
  { key: "confirm", label: "Confirm", statuses: ["Pending"] },
  { key: "ship", label: "Ship", statuses: ["Confirmed", "Packed"] },
  { key: "moving", label: "On the way", statuses: ["Shipped", "Out for delivery"] },
  { key: "done", label: "Done", statuses: ["Delivered"] },
  { key: "closed", label: "Closed", statuses: ["Cancelled", "Returned"] },
];

export default function AdminOrdersPage() {
  const { orders } = useAdminData();
  const { workspace } = useAdminWorkspace();
  const [query, setQuery] = useState(() => getInitialSearchParam("query"));
  const [statusFilter, setStatusFilter] = useState(() => getInitialSearchParam("status") || "all");
  const [paymentFilter, setPaymentFilter] = useState(() => getInitialSearchParam("payment") || "all");

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const meta = resolveOrderAdminMeta(workspace, order);
      const matchesQuery =
        !normalizedQuery ||
        [
          order.orderNumber?.toString() || "",
          order.customerName,
          order.customerEmail,
          order.customerPhone || "",
          order.orderStatus,
          order.paymentStatus,
          meta.shippingStatus,
          order.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const group = statusGroups.find((item) => item.key === statusFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (group ? group.statuses.includes(order.orderStatus) : order.orderStatus === statusFilter);
      const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [orders, paymentFilter, query, statusFilter, workspace]);

  return (
    <AdminShell>
      <div className="flex flex-col gap-10">
        <nav aria-label="Order status" className="flex flex-wrap gap-x-12 gap-y-4">
          {[{ key: "all", label: "All", statuses: [] as OrderStatus[] }, ...statusGroups].map((group) => {
            const total =
              group.key === "all"
                ? orders.length
                : orders.filter((order) => group.statuses.includes(order.orderStatus)).length;
            const active = statusFilter === group.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => setStatusFilter(group.key)}
                aria-pressed={active}
                className={`fr-choice flex items-baseline gap-3 ${active ? "is-active" : ""}`}
              >
                <span className="fr-word text-[clamp(2.5rem,5vw,3.75rem)]">{group.label}</span>
                <span className="fr-mono">{String(total).padStart(2, "0")}</span>
              </button>
            );
          })}
        </nav>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <AdminFilterInput
            aria-label="Search orders"
            placeholder="Order number, customer, email or phone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <AdminFilterSelect
            aria-label="Exact order status"
            value={statusGroups.some((group) => group.key === statusFilter) ? "all" : statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Any exact status</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </AdminFilterSelect>
          <AdminFilterSelect aria-label="Payment" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
            <option value="all">Any payment</option>
            {["pending", "initiated", "paid", "failed", "cancelled"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </AdminFilterSelect>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="fr-mono fr-muted">
                <th className="border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3 font-normal">Order</th>
                <th className="border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3 font-normal">Customer</th>
                <th className="border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3 font-normal">Pieces</th>
                <th className="border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3 font-normal">Total</th>
                <th className="border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3 font-normal">Payment</th>
                <th className="border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3 font-normal">Status</th>
                <th className="border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3 font-normal">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const meta = resolveOrderAdminMeta(workspace, order);
                return (
                  <tr key={order.id} className="border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] align-top">
                    <td className="py-4 pr-4">
                      <span className="fr-mono">#{order.orderNumber || order.id.slice(-6)}</span>
                      <span className="mt-1 block text-xs text-[var(--muted)]">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-sm">
                      {order.customerName}
                      <span className="mt-1 block text-xs text-[var(--muted)]">{order.customerEmail}</span>
                    </td>
                    <td className="py-4 pr-4 text-sm text-[var(--muted)]">
                      {order.products.map((product) => `${product.name} · ${product.size}`).join(", ")}
                    </td>
                    <td className="py-4 pr-4 text-sm">{formatAdminCurrency(order.totalAmount)}</td>
                    <td className="py-4 pr-4">
                      <AdminBadge tone={order.paymentStatus === "paid" ? "success" : "default"}>{order.paymentStatus}</AdminBadge>
                      {meta.refundState !== "none" ? (
                        <span className="fr-mono fr-muted mt-2 block">Refund {meta.refundState}</span>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4">
                      <AdminBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminBadge>
                      <span className="mt-2 block text-xs text-[var(--muted)]">{meta.shippingStatus}</span>
                    </td>
                    <td className="py-4 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="fr-mono fr-link">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 ? (
            <p className="fr-mono fr-muted py-10">No orders match.</p>
          ) : (
            <p className="fr-mono fr-muted pt-4">
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} · newest first
            </p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
