"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AccountGuard } from "@/components/account-guard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { formatOrderDate, type OrderRecord } from "@/lib/orders";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { refreshCart } = useCart();
  const { pushToast } = useToast();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      try {
        const response = await apiRequest<OrderRecord>(`/order/${params.id}`, {
          cache: "no-store",
        });

        if (active) {
          setOrder(response);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load this order."
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

  const handleReorder = async () => {
    if (!order) {
      return;
    }

    setReordering(true);

    try {
      await apiRequest(`/order/${order.id}/reorder`, {
        method: "POST",
      });
      await refreshCart();
      pushToast("Items added to cart");
      window.location.href = "/cart";
    } catch (reorderError) {
      setError(
        reorderError instanceof Error ? reorderError.message : "Could not reorder this order."
      );
      pushToast("Could not reorder", "error");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AccountGuard>
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--accent)]">Order details</p>
              <h1 className="display-font mt-3 text-5xl">
                {order ? `Order #${order.orderNumber || order.id}` : "Your order"}
              </h1>
            </div>
            <Link
              href="/account?section=orders"
              className="button-secondary rounded-full px-5 py-3 transition"
            >
              Back to orders
            </Link>
          </div>

          {loading ? (
            <div className="grain-card mt-8 rounded-[2rem] p-6 text-sm text-[var(--muted)]">
              Loading your order...
            </div>
          ) : error ? (
            <div className="grain-card mt-8 rounded-[2rem] p-6 text-sm text-[var(--accent)]">
              {error}
            </div>
          ) : order ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="space-y-6">
                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Ordered items
                  </p>
                  <div className="mt-5 space-y-4">
                    {order.products.map((product, index) => (
                      <div
                        key={`${product.productId}-${index}`}
                        className="flex gap-4 rounded-[1.5rem] border border-[var(--border)] p-4"
                      >
                        <div className="relative h-28 w-24 overflow-hidden rounded-[1.25rem] bg-[#f5f3ef]">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{product.name}</p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                            Size {product.size || "Default"}
                            {product.color ? ` · ${product.color}` : ""}
                            {product.fit ? ` · ${product.fit}` : ""}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Quantity {product.quantity}
                          </p>
                          <p className="mt-3 text-sm font-semibold">Rs. {product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Shipping details
                  </p>
                  <p className="mt-4 leading-7 text-[var(--foreground)]">
                    {order.shippingAddress}
                  </p>
                  {order.shippingAddressDetails?.label ? (
                    <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                      {order.shippingAddressDetails.label}
                    </p>
                  ) : null}
                </div>
              </section>

              <aside className="space-y-6">
                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Order summary
                  </p>
                  <div className="mt-4 space-y-3 text-[var(--muted)]">
                    <p>
                      Order status:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {order.orderStatus}
                      </span>
                    </p>
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
                      Placed on:{" "}
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
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleReorder()}
                      className="button-primary rounded-full px-4 py-2.5 text-sm transition"
                    >
                      {reordering ? "Adding..." : "Reorder"}
                    </button>
                    <button
                      type="button"
                      onClick={() => pushToast("Invoice download will be connected next")}
                      className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                    >
                      Download invoice
                    </button>
                  </div>
                </div>

                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Tracking details
                  </p>
                  <div className="mt-4 space-y-3 text-[var(--muted)]">
                    <p>
                      Courier:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {order.courierName || "Will be assigned after dispatch"}
                      </span>
                    </p>
                    <p>
                      Tracking number:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {order.trackingId || "Will be added after dispatch"}
                      </span>
                    </p>
                    {order.trackingUrl ? (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-medium !text-[#1f7a39] underline underline-offset-4 transition hover:!text-[#17622d]"
                        style={{ color: "#1f7a39" }}
                      >
                        Track shipment
                      </a>
                    ) : (
                      <p className="text-sm">Tracking link will appear once your order is shipped.</p>
                    )}
                  </div>
                </div>

                <div className="grain-card rounded-[2rem] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Order journey
                  </p>
                  <div className="mt-5 space-y-4">
                    {[
                      "Pending",
                      "Confirmed",
                      "Packed",
                      "Shipped",
                      "Out for delivery",
                      "Delivered",
                    ].map((step) => {
                      const completed =
                        [
                          "Pending",
                          "Confirmed",
                          "Packed",
                          "Shipped",
                          "Out for delivery",
                          "Delivered",
                        ].indexOf(order.orderStatus) >=
                        [
                          "Pending",
                          "Confirmed",
                          "Packed",
                          "Shipped",
                          "Out for delivery",
                          "Delivered",
                        ].indexOf(step);

                      return (
                        <div key={step} className="flex items-center gap-3">
                          <span
                            className={`h-3 w-3 rounded-full ${
                              completed ? "bg-[var(--accent)]" : "bg-black/10"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              completed ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                    {order.orderStatus === "Cancelled" || order.orderStatus === "Returned" ? (
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                        <span className="text-sm text-[var(--foreground)]">
                          {order.orderStatus}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </main>
      </AccountGuard>
      <SiteFooter />
    </div>
  );
}
