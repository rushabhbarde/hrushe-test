"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { formatOrderDate, orderStatuses, type OrderRecord } from "@/lib/orders";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        const response = await apiRequest<OrderRecord[]>("/order/all", {
          cache: "no-store",
        });

        if (active) {
          setOrders(response);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load orders."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async (orderId: string, orderStatus: OrderRecord["orderStatus"]) => {
    const updated = await apiRequest<OrderRecord>(`/order/status/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({ orderStatus }),
    });

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? updated : order))
    );
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AdminGuard>
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p className="eyebrow text-[var(--accent)]">Admin orders</p>
          <h1 className="display-font mt-3 text-5xl">Update order status quickly.</h1>

          <div className="mt-8 space-y-4">
            {loading ? (
              <div className="grain-card rounded-[2rem] p-6 text-sm text-[var(--muted)]">
                Loading orders...
              </div>
            ) : error ? (
              <div className="grain-card rounded-[2rem] p-6 text-sm text-[var(--accent)]">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="grain-card rounded-[2rem] p-6 text-sm text-[var(--muted)]">
                No orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="grain-card rounded-[2rem] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold">
                        Order #{order.orderNumber || order.id}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        Internal ref: {order.id}
                      </p>
                      <p className="mt-2 text-[var(--muted)]">
                        Customer: {order.customerName}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Email: {order.customerEmail}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Product: {order.products[0]?.name || "Order items"}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Size: {order.products[0]?.size || "Default"}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Quantity: {order.products[0]?.quantity || 0}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Placed: {formatOrderDate(order.createdAt)}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Shipping: {order.shippingAddress}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Courier: {order.courierName || "Not added yet"}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Tracking ID: {order.trackingId || "Not added yet"}
                      </p>
                      <p className="mt-1 font-semibold">Total: Rs. {order.totalAmount}</p>
                    </div>
                    <div className="lg:text-right">
                      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                        Status
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--accent)]">
                        {order.orderStatus}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Payment: {order.paymentStatus}
                      </p>
                      <div className="mt-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="button-secondary inline-flex rounded-full px-4 py-2 text-sm"
                        >
                          Open order details
                        </Link>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3 lg:justify-end">
                        {orderStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => void updateStatus(order.id, status)}
                            className={`rounded-full px-4 py-2 text-sm transition ${
                              order.orderStatus === status
                                ? "bg-black text-white"
                                : "button-secondary"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </AdminGuard>
      <SiteFooter />
    </div>
  );
}
