"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { apiRequest } from "@/lib/api";
import { formatOrderDate, orderStatuses, type OrderRecord } from "@/lib/orders";

const orderStatusFilters = [
  "all",
  ...orderStatuses,
  "Refund initiated",
  "Refund completed",
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    let active = true;

    void apiRequest<OrderRecord[]>("/order/all")
      .then((data) => {
        if (active) {
          setOrders(data);
        }
      })
      .catch(() => {
        if (active) {
          setOrders([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          order.orderNumber?.toString() || "",
          order.customerName,
          order.customerEmail,
          order.customerPhone || "",
          order.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
      const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [orders, paymentFilter, query, statusFilter]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Commerce"
          title="Orders with operational clarity."
          description="A focused queue for fulfillment, payment visibility, delivery handoff, and issue resolution across the full order lifecycle."
        />

        <AdminPanel>
          <AdminSubhead
            title="Order queue"
            description="Search by order id, customer, email, or phone and act without leaving the list."
          />

          <div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(2,minmax(0,1fr))]">
            <AdminFilterInput
              placeholder="Search order id, customer, email, phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <AdminFilterSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {orderStatusFilters.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All order statuses" : status}
                </option>
              ))}
            </AdminFilterSelect>
            <AdminFilterSelect value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              {["all", "pending", "initiated", "paid", "failed", "cancelled"].map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All payment states" : status}
                </option>
              ))}
            </AdminFilterSelect>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[rgba(17,17,17,0.08)]">
            <div className="hidden grid-cols-[130px_minmax(0,1.2fr)_140px_140px_140px_120px] gap-3 border-b border-[rgba(17,17,17,0.08)] bg-[rgba(17,17,17,0.03)] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] lg:grid">
              <span>Order</span>
              <span>Customer</span>
              <span>Payment</span>
              <span>Fulfillment</span>
              <span>Value</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-[rgba(17,17,17,0.08)]">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[130px_minmax(0,1.2fr)_140px_140px_140px_120px] lg:px-5"
                >
                  <div>
                    <p className="text-sm font-semibold">#{order.orderNumber || order.id.slice(-6)}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatOrderDate(order.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{order.customerName}</p>
                    <p className="text-sm text-[var(--muted)]">{order.customerEmail}</p>
                    {order.customerPhone ? (
                      <p className="text-sm text-[var(--muted)]">{order.customerPhone}</p>
                    ) : null}
                  </div>
                  <div>
                    <AdminBadge tone={order.paymentStatus === "paid" ? "success" : order.paymentStatus === "failed" ? "warning" : "default"}>
                      {order.paymentStatus}
                    </AdminBadge>
                    <p className="mt-2 text-sm text-[var(--muted)]">{order.paymentMethod}</p>
                  </div>
                  <div>
                    <AdminBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminBadge>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {order.courierName || "Awaiting courier"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatAdminCurrency(order.totalAmount)}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{order.products.length} item(s)</p>
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/admin/orders/${order.id}`} className="button-primary rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em]">
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
