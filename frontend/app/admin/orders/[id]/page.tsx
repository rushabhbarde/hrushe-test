"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminKeyValue,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { formatAdminCurrency, orderStatusTone } from "@/lib/admin";
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
        const response = await apiRequest<OrderRecord>(`/order/${params.id}`, { cache: "no-store" });
        if (active) {
          setOrder(response);
          setForm(buildForm(response));
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load order.");
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
      setError(saveError instanceof Error ? saveError.message : "Could not update order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      {loading ? (
        <AdminPanel>
          <p className="text-sm text-[var(--muted)]">Loading order...</p>
        </AdminPanel>
      ) : error && !order ? (
        <AdminPanel>
          <p className="text-sm text-[var(--accent)]">{error}</p>
        </AdminPanel>
      ) : order && form ? (
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Order detail"
            title={`Order #${order.orderNumber || order.id.slice(-6)}`}
            description="Order summary, customer context, fulfillment controls, and delivery tracking in one decision surface."
            actions={
              <Link href="/admin/orders" className="button-secondary rounded-full px-5 py-3 text-sm font-medium">
                Back to orders
              </Link>
            }
          />

          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <AdminPanel>
                <AdminSubhead title="Customer profile preview" description="Basic contact data and delivery destination." />
                <div className="grid gap-5 md:grid-cols-2">
                  <AdminKeyValue label="Customer" value={order.customerName} />
                  <AdminKeyValue label="Email" value={order.customerEmail} />
                  <AdminKeyValue label="Phone" value={order.customerPhone || "Phone not provided"} />
                  <AdminKeyValue label="Shipping address" value={order.shippingAddress} />
                </div>
              </AdminPanel>

              <AdminPanel>
                <AdminSubhead title="Ordered items" description="Variant information carried into the order snapshot." />
                <div className="space-y-3">
                  {order.products.map((product, index) => (
                    <div key={`${product.productId}-${index}`} className="rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold tracking-[-0.02em]">{product.name}</p>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            Qty {product.quantity} · Size {product.size || "Default"} · Color {product.color || "Default"} · Fit {product.fit || "—"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{formatAdminCurrency(product.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>

            <div className="space-y-5">
              <AdminPanel>
                <AdminSubhead title="Payment & order summary" description="Commercial status and pricing breakdown." />
                <div className="space-y-4">
                  <AdminKeyValue label="Payment status" value={<AdminBadge tone={order.paymentStatus === "paid" ? "success" : "default"}>{order.paymentStatus}</AdminBadge>} />
                  <AdminKeyValue label="Payment method" value={order.paymentMethod} />
                  <AdminKeyValue label="Placed" value={formatOrderDate(order.createdAt)} />
                  <AdminKeyValue label="Current status" value={<AdminBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminBadge>} />
                  <AdminKeyValue label="Total" value={formatAdminCurrency(order.totalAmount)} />
                </div>
              </AdminPanel>

              <AdminPanel>
                <AdminSubhead title="Fulfillment controls" description="Keep courier and delivery data updated for the customer-facing order pages." />
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm text-[var(--muted)]">Order status</span>
                    <select
                      value={form.orderStatus}
                      onChange={(event) =>
                        setForm((current) =>
                          current ? { ...current, orderStatus: event.target.value as OrderRecord["orderStatus"] } : current
                        )
                      }
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
                        setForm((current) => (current ? { ...current, courierName: event.target.value } : current))
                      }
                      placeholder="Delhivery, Blue Dart, etc."
                      className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-[var(--muted)]">Tracking number</span>
                    <input
                      value={form.trackingId}
                      onChange={(event) =>
                        setForm((current) => (current ? { ...current, trackingId: event.target.value } : current))
                      }
                      placeholder="Tracking number"
                      className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-[var(--muted)]">Tracking URL</span>
                    <input
                      value={form.trackingUrl}
                      onChange={(event) =>
                        setForm((current) => (current ? { ...current, trackingUrl: event.target.value } : current))
                      }
                      placeholder="https://..."
                      className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                    />
                  </label>

                  {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
                  {saveMessage ? <p className="text-sm text-[#12824a]">{saveMessage}</p> : null}

                  <button
                    type="button"
                    onClick={() => void saveOrder()}
                    disabled={saving}
                    className="button-primary rounded-full px-5 py-3 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save order updates"}
                  </button>
                </div>
              </AdminPanel>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
