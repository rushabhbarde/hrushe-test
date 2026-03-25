"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin-guard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { formatOrderDate, orderStatuses, type OrderRecord } from "@/lib/orders";

type OrderUpdateForm = {
  orderStatus: OrderRecord["orderStatus"];
  courierName: string;
  trackingId: string;
  trackingUrl: string;
};

function buildForm(order: OrderRecord): OrderUpdateForm {
  return {
    orderStatus: order.orderStatus,
    courierName: order.courierName || "",
    trackingId: order.trackingId || "",
    trackingUrl: order.trackingUrl || "",
  };
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [form, setForm] = useState<OrderUpdateForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      try {
        const response = await apiRequest<OrderRecord>(`/order/${params.id}`, {
          cache: "no-store",
        });

        if (active) {
          setOrder(response);
          setForm(buildForm(response));
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load order."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      active = false;
    };
  }, [params.id]);

  const saveOrder = async () => {
    if (!form || !order) {
      return;
    }

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const updated = await apiRequest<OrderRecord>(`/order/status/${order.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      setOrder(updated);
      setForm(buildForm(updated));
      setSaveMessage("Fulfillment details saved.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not update order."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AdminGuard>
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--accent)]">Admin order detail</p>
              <h1 className="display-font mt-3 text-5xl">
                {order ? `Order #${order.orderNumber || order.id}` : "Order details"}
              </h1>
              {order ? (
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Internal ref: {order.id}
                </p>
              ) : null}
            </div>
            <Link
              href="/admin/orders"
              className="button-secondary rounded-full px-5 py-3 transition"
            >
              Back to orders
            </Link>
          </div>

          {loading ? (
            <div className="grain-card mt-8 rounded-[2rem] p-6 text-sm text-[var(--muted)]">
              Loading order...
            </div>
          ) : error && !order ? (
            <div className="grain-card mt-8 rounded-[2rem] p-6 text-sm text-[var(--accent)]">
              {error}
            </div>
          ) : order && form ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="space-y-6">
                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Customer info
                  </p>
                  <div className="mt-4 space-y-2 text-[var(--muted)]">
                    <p className="text-[var(--foreground)]">{order.customerName}</p>
                    <p>{order.customerEmail}</p>
                    <p>{order.customerPhone || "Phone not provided"}</p>
                  </div>
                </div>

                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Shipping address
                  </p>
                  <p className="mt-4 leading-7 text-[var(--foreground)]">
                    {order.shippingAddress}
                  </p>
                </div>

                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Order items
                  </p>
                  <div className="mt-4 space-y-4">
                    {order.products.map((product, index) => (
                      <div
                        key={`${product.productId}-${index}`}
                        className="rounded-[1.5rem] border border-[var(--border)] p-4"
                      >
                        <p className="font-semibold">{product.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Qty {product.quantity} · Size {product.size || "Default"} · Color{" "}
                          {product.color || "Default"}
                        </p>
                        <p className="mt-2 text-sm font-semibold">Rs. {product.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Payment status view
                  </p>
                  <div className="mt-4 space-y-2 text-[var(--muted)]">
                    <p>
                      Payment status:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {order.paymentStatus}
                      </span>
                    </p>
                    <p>
                      Payment method:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {order.paymentMethod}
                      </span>
                    </p>
                    <p>
                      Placed:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {formatOrderDate(order.createdAt)}
                      </span>
                    </p>
                    <p>
                      Total:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        Rs. {order.totalAmount}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Fulfillment controls
                  </p>
                  <div className="mt-5 grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm text-[var(--muted)]">Order status</span>
                      <select
                        value={form.orderStatus}
                        onChange={(event) =>
                          setForm((current) =>
                            current
                              ? {
                                  ...current,
                                  orderStatus: event.target
                                    .value as OrderRecord["orderStatus"],
                                }
                              : current
                          )
                        }
                        onBlur={() => setSaveMessage("")}
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm text-[var(--muted)]">Courier name</span>
                      <input
                        value={form.courierName}
                        onChange={(event) =>
                          setForm((current) =>
                            current
                              ? { ...current, courierName: event.target.value }
                              : current
                          )
                        }
                        onFocus={() => setSaveMessage("")}
                        placeholder="Delhivery, Blue Dart, etc."
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm text-[var(--muted)]">Tracking number</span>
                      <input
                        value={form.trackingId}
                        onChange={(event) =>
                          setForm((current) =>
                            current
                              ? { ...current, trackingId: event.target.value }
                              : current
                          )
                        }
                        onFocus={() => setSaveMessage("")}
                        placeholder="Tracking number"
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm text-[var(--muted)]">Tracking URL</span>
                      <input
                        value={form.trackingUrl}
                        onChange={(event) =>
                          setForm((current) =>
                            current
                              ? { ...current, trackingUrl: event.target.value }
                              : current
                          )
                        }
                        onFocus={() => setSaveMessage("")}
                        placeholder="https://..."
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      />
                    </label>

                    {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
                    {saveMessage ? (
                      <p className="text-sm text-[var(--accent)]">{saveMessage}</p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void saveOrder()}
                      disabled={saving}
                      className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save order updates"}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </main>
      </AdminGuard>
      <SiteFooter />
    </div>
  );
}
