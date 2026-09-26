"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin-auth-provider";
import { useToast } from "@/components/toast-provider";
import { apiRequest } from "@/lib/api";
import { formatAdminCurrency } from "@/lib/admin";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import type { OrderRecord } from "@/lib/orders";
import { useAdminData } from "@/lib/use-admin-data";

function count(value: number) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}

function customerLine(order: OrderRecord) {
  const initials = order.customerName
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]}.`)
    .join(" ");
  const city = order.shippingAddressDetails?.city;
  return [initials || order.customerName, city].filter(Boolean).join(" · ");
}

/**
 * The workbench: the next paid order sits in the frame with one action (Confirm);
 * the counts around it say what else needs hands today.
 */
export function AdminWorkbench({
  lowStockVariants,
  exchangesPending,
}: {
  lowStockVariants: number;
  exchangesPending: number;
}) {
  const { orders, loading, updateOrders } = useAdminData();
  const { hasPermission } = useAdminAuth();
  const { pushToast } = useToast();
  const [position, setPosition] = useState(0);
  const [saving, setSaving] = useState(false);
  const canConfirm = hasPermission("orders.manage");

  const toConfirm = useMemo(
    () =>
      orders
        .filter((order) => order.orderStatus === "Pending" && order.paymentStatus === "paid")
        .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
    [orders]
  );
  const toShip = orders.filter((order) => ["Confirmed", "Packed"].includes(order.orderStatus)).length;
  const current = toConfirm.length > 0 ? toConfirm[position % toConfirm.length] : null;
  const image = current?.products.find((product) => product.image)?.image;

  async function confirmCurrent() {
    if (!current) {
      return;
    }

    setSaving(true);
    try {
      const updated = await apiRequest<OrderRecord>(`/order/status/${current.id}`, {
        method: "PUT",
        body: JSON.stringify({
          orderStatus: "Confirmed",
          courierName: current.courierName,
          trackingId: current.trackingId,
          trackingUrl: current.trackingUrl,
        }),
      });
      updateOrders(orders.map((order) => (order.id === updated.id ? updated : order)));
      pushToast(`Order #${current.orderNumber || current.id.slice(-6)} confirmed.`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not confirm this order.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label="Workbench"
      className="grid gap-10 lg:min-h-[calc(100svh-10rem)] lg:grid-cols-[minmax(0,1fr)_min(28vw,380px)_minmax(0,1fr)] lg:items-center lg:gap-x-16"
    >
      <div className="flex gap-10 lg:flex-col lg:items-end lg:gap-7 lg:text-right">
        <Link href="/admin/orders?status=confirm" className="flex flex-col gap-2">
          <span className="fr-word text-[clamp(4.5rem,11vw,10rem)]">{count(toConfirm.length)}</span>
          <span className="fr-mono">To confirm</span>
        </Link>
        <Link href="/admin/orders?status=ship" className="fr-quiet flex flex-col gap-2">
          <span className="fr-word text-[clamp(3rem,6.5vw,6rem)]">{count(toShip)}</span>
          <span className="fr-mono">To fold &amp; ship</span>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div className="fr-frame aspect-[4/5] w-full">
          {image ? (
            <div className="fr-frame__layer is-active">
              <Image src={image} alt="" fill unoptimized={shouldBypassImageOptimization(image)} sizes="380px" />
            </div>
          ) : (
            <span className="fr-mono fr-muted absolute inset-0 flex items-center justify-center text-center">
              {loading ? "Loading orders" : "All caught up"}
            </span>
          )}
        </div>
        {current ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <Link href={`/admin/orders/${current.id}`} className="fr-mono fr-link">
                #{current.orderNumber || current.id.slice(-6)}
              </Link>
              <span className="fr-mono fr-muted">
                {count((position % toConfirm.length) + 1)} of {count(toConfirm.length)}
              </span>
            </div>
            <span className="text-lg font-medium">
              {current.products
                .map((product) => `${product.name} · ${product.size}${product.quantity > 1 ? ` ×${product.quantity}` : ""}`)
                .join(", ")}{" "}
              · {formatAdminCurrency(current.totalAmount)}
            </span>
            <span className="text-sm text-[var(--muted)]">
              {customerLine(current)} · Paid via {current.paymentMethod || "Razorpay"}
            </span>
            <div className="flex gap-3">
              {canConfirm ? (
                <button type="button" onClick={() => void confirmCurrent()} disabled={saving} className="fr-button flex-1">
                  {saving ? "Confirming…" : "Confirm"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setPosition((value) => value + 1)}
                disabled={toConfirm.length < 2}
                className="fr-mono min-h-[3.25rem] border border-[var(--foreground)] px-7 disabled:opacity-40"
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <span className="text-sm text-[var(--muted)]">
            {loading ? "" : "No paid orders are waiting. New ones appear here, oldest first."}
          </span>
        )}
      </div>

      <div className="fr-quiet flex gap-10 lg:flex-col lg:gap-7">
        <Link href="/admin/support" className="flex flex-col gap-2 hover:text-[var(--foreground)]">
          <span className="fr-word text-[clamp(3rem,6.5vw,6rem)]">{count(exchangesPending)}</span>
          <span className="fr-mono">Size exchanges</span>
        </Link>
        <Link href="/admin/inventory" className="flex flex-col gap-2 hover:text-[var(--foreground)]">
          <span className="fr-word text-[clamp(3rem,6.5vw,6rem)]">{count(lowStockVariants)}</span>
          <span className="fr-mono">Sizes running low</span>
        </Link>
      </div>
    </section>
  );
}
