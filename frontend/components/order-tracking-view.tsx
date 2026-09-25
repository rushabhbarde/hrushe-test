import Image from "next/image";
import type { ReactNode } from "react";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import {
  activeFulfillmentStatuses,
  formatOrderDate,
  type OrderProductSnapshot,
  type OrderStatus,
  type TrackingTimelineStep,
} from "@/lib/orders";

type TrackableOrder = {
  id: string;
  orderNumber?: number | null;
  orderStatus: OrderStatus;
  paymentStatus: string;
  paymentMethod?: string;
  shippingAddress: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  totalAmount: number;
  products: OrderProductSnapshot[];
  createdAt: string;
  timeline?: TrackingTimelineStep[];
};

/** Customers see the journey; "Out for delivery" and "Cancelled" etc. read as plain words. */
export function deriveTimeline(status: OrderStatus): TrackingTimelineStep[] {
  const currentIndex = activeFulfillmentStatuses.indexOf(status);

  const steps: TrackingTimelineStep[] = activeFulfillmentStatuses.map((step, index) => ({
    key: step,
    label: step,
    status:
      currentIndex < 0
        ? "upcoming"
        : index < currentIndex || (index === currentIndex && step === "Delivered")
          ? "completed"
          : index === currentIndex
            ? "current"
            : "upcoming",
  }));

  if (status === "Cancelled" || status === "Returned") {
    return [{ key: status, label: status, status: "current" }];
  }

  return steps;
}

function formatRupees(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function OrderTrackingView({ order, actions }: { order: TrackableOrder; actions?: ReactNode }) {
  const timeline = order.timeline && order.timeline.length > 0 ? order.timeline : deriveTimeline(order.orderStatus);
  const firstImage = order.products.find((product) => product.image)?.image;
  const reference = `#${order.orderNumber || order.id}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(30vw,420px)] lg:items-start lg:gap-x-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span className="fr-mono fr-muted">
            Order {reference} · Placed {formatOrderDate(order.createdAt)}
          </span>
          <h2 className="fr-word text-[clamp(3.5rem,14vw,8rem)] lg:text-[clamp(4rem,7vw,8rem)]">{order.orderStatus}.</h2>
        </div>

        {firstImage ? (
          <div className="fr-frame h-[36svh] w-full lg:hidden">
            <div className="fr-frame__layer is-active">
              <Image src={firstImage} alt="" fill unoptimized={shouldBypassImageOptimization(firstImage)} sizes="100vw" />
            </div>
          </div>
        ) : null}

        <ol aria-label="Order journey" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}>
          {timeline.map((step) => {
            const reached = step.status !== "upcoming";
            return (
              <li key={step.key} className="flex flex-col gap-2" aria-current={step.status === "current" ? "step" : undefined}>
                <span
                  className="h-0.5"
                  style={{ background: reached ? "var(--foreground)" : "color-mix(in srgb, var(--foreground) 14%, transparent)" }}
                />
                <span className={`fr-mono max-sm:sr-only ${reached ? "" : "fr-quiet"}`}>{step.label}</span>
              </li>
            );
          })}
        </ol>

        <dl className="flex max-w-xl flex-col">
          {[
            ["Courier", order.courierName || "Assigned at dispatch"],
            ["Tracking number", order.trackingId || "Added at dispatch"],
            ["Payment", [order.paymentStatus, order.paymentMethod].filter(Boolean).join(" · ")],
            ["Total", formatRupees(order.totalAmount)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-3"
            >
              <dt className="fr-mono fr-muted">{label}</dt>
              <dd className="text-right text-sm">{value}</dd>
            </div>
          ))}
          <div className="flex flex-col gap-2 py-4">
            <dt className="fr-mono fr-muted">Delivering to</dt>
            <dd className="text-sm leading-6">{order.shippingAddress}</dd>
          </div>
        </dl>

        <div className="flex max-w-xl flex-col gap-4">
          {order.trackingUrl ? (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="fr-button">
              Follow the courier
            </a>
          ) : null}
          {actions}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        {firstImage ? (
          <div className="fr-frame hidden aspect-[3/4] w-full lg:block">
            <div className="fr-frame__layer is-active">
              <Image src={firstImage} alt="" fill unoptimized={shouldBypassImageOptimization(firstImage)} sizes="30vw" />
            </div>
          </div>
        ) : null}
        <span className="fr-mono fr-muted">In this order · {String(order.products.length).padStart(2, "0")}</span>
        <ul className="flex flex-col gap-3">
          {order.products.map((product, index) => (
            <li key={`${product.productId}-${index}`} className="flex flex-col gap-1">
              <span className="fr-word text-[1.75rem]">{product.name}</span>
              <span className="fr-mono fr-muted">
                {[product.size && `Size ${product.size}`, product.color, `× ${product.quantity}`, formatRupees(product.price)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
