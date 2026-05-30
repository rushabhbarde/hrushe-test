"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminFilterInput,
  AdminFilterSelect,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { formatAdminCurrency, orderStatusTone } from "@/lib/admin";
import { resolveOrderAdminMeta } from "@/lib/admin-workspace";
import { orderStatuses } from "@/lib/orders";
import { useAdminData } from "@/lib/use-admin-data";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

export default function AdminOrdersPage() {
  const { orders } = useAdminData();
  const { workspace } = useAdminWorkspace();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

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
      const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
      const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [orders, paymentFilter, query, statusFilter, workspace]);

  const summary = useMemo(
    () => ({
      pending: orders.filter((order) => order.orderStatus === "Pending").length,
      packed: orders.filter((order) => order.orderStatus === "Packed").length,
      shipped: orders.filter((order) =>
        ["Shipped", "Out for delivery"].includes(order.orderStatus)
      ).length,
      delivered: orders.filter((order) => order.orderStatus === "Delivered").length,
    }),
    [orders]
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Orders"
          title="Keep fulfillment, payment, and delivery decisions in sync."
          description="Search, filter, and work every order from confirmation through delivery, cancellation, refund, and invoice handoff."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Pending" value={String(summary.pending)} />
          <SummaryCard label="Packed" value={String(summary.packed)} />
          <SummaryCard label="Shipped" value={String(summary.shipped)} />
          <SummaryCard label="Delivered" value={String(summary.delivered)} />
        </div>

        <AdminPanel>
          <AdminSubhead title="Order queue" description="Search by order, customer, phone, or shipping state." />
          <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))]">
            <AdminFilterInput
              placeholder="Search order id, customer, email, phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <AdminFilterSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All order statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </AdminFilterSelect>
            <AdminFilterSelect value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="all">All payment states</option>
              {["pending", "initiated", "paid", "failed", "cancelled"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </AdminFilterSelect>
          </div>

          <div className="mt-5 overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
            <div className="hidden grid-cols-[140px_minmax(0,1.2fr)_140px_150px_150px_110px] gap-3 border-b border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,transparent)] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] lg:grid">
              <span>Order</span>
              <span>Customer</span>
              <span>Payment</span>
              <span>Order status</span>
              <span>Shipping</span>
              <span className="text-right">Value</span>
            </div>
            <div className="divide-y divide-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
              {filteredOrders.map((order) => {
                const meta = resolveOrderAdminMeta(workspace, order);
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="grid gap-4 px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)] lg:grid-cols-[140px_minmax(0,1.2fr)_140px_150px_150px_110px] lg:px-5"
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
                      {meta.refundState !== "none" ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                          Refund {meta.refundState}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <AdminBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminBadge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{meta.shippingStatus}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{order.courierName || "Courier pending"}</p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-sm font-semibold">{formatAdminCurrency(order.totalAmount)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <AdminPanel>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </AdminPanel>
  );
}

