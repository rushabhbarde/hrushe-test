"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminField,
  AdminFilterInput,
  AdminFilterSelect,
  AdminKeyValue,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
  AdminTextArea,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { downloadApiFile, apiRequest } from "@/lib/api";
import { formatAdminCurrency, orderStatusTone } from "@/lib/admin";
import { resolveOrderAdminMeta, type OrderAdminMeta } from "@/lib/admin-workspace";
import {
  canTransitionOrderStatus,
  orderStatuses,
  requiresPaidOrderStatus,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/orders";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

const shippingStates: OrderAdminMeta["shippingStatus"][] = [
  "Queued",
  "Manifested",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Return Pickup",
];

function buildTimeline(order: OrderRecord, meta: OrderAdminMeta) {
  const defaultTimeline = [
    { label: "Order placed", detail: "Customer completed checkout." },
    { label: "Current order status", detail: order.orderStatus },
    { label: "Shipping status", detail: meta.shippingStatus },
  ];

  const updates = meta.shippingUpdates
    .slice()
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .map((item) => ({
      label: item.title,
      detail: `${item.detail} · ${new Date(item.timestamp).toLocaleString("en-IN")}`,
    }));

  return [...defaultTimeline, ...updates];
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [orderMeta, setOrderMeta] = useState<OrderAdminMeta | null>(null);
  const [newUpdate, setNewUpdate] = useState({ title: "", detail: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [persistedOrderStatus, setPersistedOrderStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    let active = true;

    void apiRequest<OrderRecord>(`/order/${params.id}`, { cache: "no-store" })
      .then((response) => {
        if (!active) {
          return;
        }
        setOrder(response);
        setPersistedOrderStatus(response.orderStatus);
        setOrderMeta(resolveOrderAdminMeta(workspace, response));
      })
      .catch(() => {
        if (active) {
          setOrder(null);
          setOrderMeta(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [params.id, workspace]);

  const timeline = useMemo(
    () => (order && orderMeta ? buildTimeline(order, orderMeta) : []),
    [order, orderMeta]
  );

  async function saveOrderChanges(nextStatus = order?.orderStatus) {
    if (!order || !orderMeta) {
      return;
    }

    const currentStatus = persistedOrderStatus || order.orderStatus;

    if (nextStatus && !canTransitionOrderStatus(currentStatus, nextStatus)) {
      pushToast(`Cannot move this order from ${currentStatus} to ${nextStatus}.`, "error");
      return;
    }

    if (
      nextStatus &&
      requiresPaidOrderStatus(nextStatus) &&
      order.paymentStatus !== "paid"
    ) {
      pushToast("Unpaid orders cannot enter fulfillment.", "error");
      return;
    }

    setSaving(true);

    try {
      const updatedOrder = await apiRequest<OrderRecord>(`/order/status/${order.id}`, {
        method: "PUT",
        body: JSON.stringify({
          orderStatus: nextStatus,
          courierName: order.courierName,
          trackingId: order.trackingId,
          trackingUrl: order.trackingUrl,
        }),
      });

      await saveWorkspace({
        orderMeta: {
          ...workspace.orderMeta,
          [order.id]: orderMeta,
        },
      });

      setOrder(updatedOrder);
      setPersistedOrderStatus(updatedOrder.orderStatus);
      pushToast("Order updates saved.");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not update order.", "error");
    } finally {
      setSaving(false);
    }
  }

  function canSelectStatus(nextStatus: OrderStatus) {
    const currentStatus = persistedOrderStatus || order?.orderStatus;

    if (!order || !currentStatus) {
      return false;
    }

    if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
      return false;
    }

    return !requiresPaidOrderStatus(nextStatus) || order.paymentStatus === "paid";
  }

  if (loading) {
    return (
      <AdminShell>
        <AdminPanel>
          <p className="text-sm text-[var(--muted)]">Loading order...</p>
        </AdminPanel>
      </AdminShell>
    );
  }

  if (!order || !orderMeta) {
    return (
      <AdminShell>
        <AdminPanel>
          <p className="text-sm text-[var(--muted)]">Order not found.</p>
        </AdminPanel>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Order detail"
          title={`Order #${order.orderNumber || order.id.slice(-6)}`}
          description="Manage fulfillment, track shipping, and coordinate customer support from the live order record."
          actions={
            <>
              <button
                type="button"
                onClick={() => void downloadApiFile(`/order/${order.id}/invoice`, `hrushe-order-${order.id}.pdf`)}
                className="button-secondary px-5 py-3 text-sm font-medium"
              >
                Download invoice
              </button>
              <Link href="/admin/orders" className="button-primary px-5 py-3 text-sm font-medium">
                Back to orders
              </Link>
            </>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="space-y-5">
            <AdminPanel>
              <AdminSubhead title="Customer and order snapshot" description="Core contact, payment, and delivery information." />
              <div className="grid gap-5 md:grid-cols-2">
                <AdminKeyValue label="Customer" value={order.customerName} />
                <AdminKeyValue label="Email" value={order.customerEmail} />
                <AdminKeyValue label="Phone" value={order.customerPhone || "Not provided"} />
                <AdminKeyValue label="Shipping address" value={order.shippingAddress} />
                <AdminKeyValue label="Payment method" value={order.paymentMethod} />
                <AdminKeyValue
                  label="Payment status"
                  value={<AdminBadge tone={order.paymentStatus === "paid" ? "success" : "default"}>{order.paymentStatus}</AdminBadge>}
                />
                <AdminKeyValue
                  label="Order status"
                  value={<AdminBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminBadge>}
                />
                <AdminKeyValue label="Order value" value={formatAdminCurrency(order.totalAmount)} />
              </div>
            </AdminPanel>

            <AdminPanel>
              <AdminSubhead title="Ordered products" description="Line items captured at checkout." />
              <div className="space-y-3">
                {order.products.map((product, index) => (
                  <div key={`${product.productId}-${index}`} className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{product.name}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                          Qty {product.quantity} · Size {product.size || "Free"} · Color {product.color || "Default"} · Fit {product.fit || "—"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatAdminCurrency(product.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel>
              <AdminSubhead title="Order timeline" description="Status history and shipping updates in one vertical feed." />
              <div className="space-y-3">
                {timeline.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 bg-[var(--foreground)]" />
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>

          <div className="space-y-5">
            <AdminPanel>
              <AdminSubhead title="Fulfillment controls" description="Update courier, tracking, and shipping state." />
              <div className="grid gap-4">
                <AdminField label="Order status">
                  <AdminFilterSelect
                    value={order.orderStatus}
                    onChange={(event) =>
                      setOrder((current) =>
                        current
                          ? { ...current, orderStatus: event.target.value as OrderRecord["orderStatus"] }
                          : current
                      )
                    }
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status} disabled={!canSelectStatus(status)}>
                        {status}
                      </option>
                    ))}
                  </AdminFilterSelect>
                </AdminField>

                <AdminField label="Shipping status">
                  <AdminFilterSelect
                    value={orderMeta.shippingStatus}
                    onChange={(event) =>
                      setOrderMeta((current) =>
                        current
                          ? {
                              ...current,
                              shippingStatus: event.target.value as OrderAdminMeta["shippingStatus"],
                            }
                          : current
                      )
                    }
                  >
                    {shippingStates.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </AdminFilterSelect>
                </AdminField>

                <AdminField label="Courier partner">
                  <AdminFilterInput
                    value={order.courierName || ""}
                    onChange={(event) =>
                      setOrder((current) =>
                        current ? { ...current, courierName: event.target.value } : current
                      )
                    }
                  />
                </AdminField>

                <AdminField label="Tracking number">
                  <AdminFilterInput
                    value={order.trackingId || ""}
                    onChange={(event) =>
                      setOrder((current) =>
                        current ? { ...current, trackingId: event.target.value } : current
                      )
                    }
                  />
                </AdminField>

                <AdminField label="Tracking URL">
                  <AdminFilterInput
                    value={order.trackingUrl || ""}
                    onChange={(event) =>
                      setOrder((current) =>
                        current ? { ...current, trackingUrl: event.target.value } : current
                      )
                    }
                  />
                </AdminField>

                <AdminField label="Return pickup tracking">
                  <AdminFilterInput
                    value={orderMeta.returnPickupTracking}
                    onChange={(event) =>
                      setOrderMeta((current) =>
                        current
                          ? { ...current, returnPickupTracking: event.target.value }
                          : current
                      )
                    }
                  />
                </AdminField>

                <button type="button" onClick={() => void saveOrderChanges(order.orderStatus)} className="button-primary px-5 py-3 text-sm font-medium" disabled={saving}>
                  {saving ? "Saving..." : "Save fulfillment updates"}
                </button>
              </div>
            </AdminPanel>

            <AdminPanel>
              <AdminSubhead title="Shipment updates" description="Log courier handoffs, delivery notes, and return pickup progress." />
              <div className="grid gap-4">
                <AdminField label="Update title">
                  <AdminFilterInput
                    value={newUpdate.title}
                    onChange={(event) => setNewUpdate((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Packed at warehouse"
                  />
                </AdminField>
                <AdminField label="Update detail">
                  <AdminTextArea
                    value={newUpdate.detail}
                    onChange={(event) => setNewUpdate((current) => ({ ...current, detail: event.target.value }))}
                    placeholder="Include any courier or delivery detail worth showing internally."
                  />
                </AdminField>
                <button
                  type="button"
                  onClick={() => {
                    if (!newUpdate.title.trim() || !newUpdate.detail.trim()) {
                      pushToast("Add both a title and detail for the shipment update.", "error");
                      return;
                    }

                    setOrderMeta((current) =>
                      current
                        ? {
                            ...current,
                            shippingUpdates: [
                              {
                                id: `${Date.now()}`,
                                type: "shipment",
                                title: newUpdate.title.trim(),
                                detail: newUpdate.detail.trim(),
                                timestamp: new Date().toISOString(),
                              },
                              ...current.shippingUpdates,
                            ],
                          }
                        : current
                    );
                    setNewUpdate({ title: "", detail: "" });
                    pushToast("Shipment update added to the order timeline.");
                  }}
                  className="button-secondary px-5 py-3 text-sm font-medium"
                >
                  Add update
                </button>
              </div>
            </AdminPanel>

            <AdminPanel>
              <AdminSubhead title="Cancellation" description="Cancellation updates the live order status. Payment refunds must be completed in Razorpay." />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="button-secondary px-5 py-3 text-sm font-medium"
                  disabled={!canSelectStatus("Cancelled")}
                >
                  Cancel order
                </button>
              </div>
            </AdminPanel>
          </div>
        </div>

        <AdminConfirmDialog
          open={cancelOpen}
          title="Cancel this order?"
          description="This updates the live order status to Cancelled and keeps the change in the customer-facing tracking flow."
          confirmLabel="Cancel order"
          destructive
          onConfirm={() => {
            setCancelOpen(false);
            void saveOrderChanges("Cancelled");
          }}
          onCancel={() => setCancelOpen(false)}
        />

      </div>
    </AdminShell>
  );
}
