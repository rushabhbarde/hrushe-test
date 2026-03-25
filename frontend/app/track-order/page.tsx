"use client";

import Image from "next/image";
import { useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { formatOrderDate, type PublicTrackingRecord } from "@/lib/orders";

type SearchMode = "email" | "phone";

export default function TrackOrderPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("email");
  const [orderId, setOrderId] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<PublicTrackingRecord | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        searchMode === "email"
          ? { orderId: orderId.trim(), email: contactValue.trim() }
          : { orderId: orderId.trim(), phone: contactValue.trim() };

      const response = await apiRequest<PublicTrackingRecord>("/order/track", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOrder(response);
    } catch (submitError) {
      setOrder(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not find an order with those details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grain-card rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow text-[var(--accent)]">Track order</p>
            <h1 className="display-font mt-3 text-5xl">Follow every delivery step.</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Search using your order ID with either the email or phone number used at checkout.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSearchMode("email")}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  searchMode === "email"
                    ? "border-black bg-black text-white"
                    : "border-[var(--border)] bg-white text-[var(--foreground)]"
                }`}
              >
                Order ID + Email
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("phone")}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  searchMode === "phone"
                    ? "border-black bg-black text-white"
                    : "border-[var(--border)] bg-white text-[var(--foreground)]"
                }`}
              >
                Order ID + Phone
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={(event) => void onSubmit(event)}>
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                placeholder="Order ID"
                required
              />
              <input
                value={contactValue}
                onChange={(event) => setContactValue(event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                placeholder={searchMode === "email" ? "Email address" : "Phone number"}
                type={searchMode === "email" ? "email" : "tel"}
                required
              />
              {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
              >
                {loading ? "Checking..." : "Track order"}
              </button>
            </form>
          </div>

          <div className="grain-card rounded-[2rem] p-6 sm:p-8">
            {!order ? (
              <div className="flex min-h-[420px] flex-col justify-center">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                  Delivery status updates
                </p>
                <h2 className="mt-3 text-3xl font-semibold">
                  Your timeline, courier, and tracking details will appear here.
                </h2>
                <p className="mt-4 max-w-xl text-[var(--muted)]">
                  Once we find your order, you will see each delivery stage from order placed to
                  delivered.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                      Order #{order.orderNumber || order.id}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold">{order.orderStatus}</h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Placed on {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-[var(--muted)]">Payment status</p>
                    <p className="mt-1 font-semibold">{order.paymentStatus}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Order timeline
                  </p>
                  <div className="mt-5 space-y-4">
                    {order.timeline.map((step) => (
                      <div key={step.key} className="flex items-start gap-4">
                        <span
                          className={`mt-1 h-3 w-3 rounded-full ${
                            step.status === "completed"
                              ? "bg-black"
                              : step.status === "current"
                                ? "bg-[var(--accent)]"
                                : "bg-black/15"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{step.label}</p>
                          <p className="text-sm text-[var(--muted)]">
                            {step.status === "completed"
                              ? "Completed"
                              : step.status === "current"
                                ? "Current status"
                                : "Upcoming"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                      Shipment details
                    </p>
                    <div className="mt-4 space-y-2 text-[var(--muted)]">
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
                          className="inline-flex text-sm underline"
                        >
                          Open courier tracking
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                      Shipping details
                    </p>
                    <p className="mt-4 leading-7 text-[var(--foreground)]">
                      {order.shippingAddress}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Items in this order
                  </p>
                  <div className="mt-5 space-y-4">
                    {order.products.map((product, index) => (
                      <div
                        key={`${product.productId}-${index}`}
                        className="flex gap-4 rounded-[1.5rem] border border-[var(--border)] p-4"
                      >
                        <div className="relative h-24 w-20 overflow-hidden rounded-[1rem] bg-[#f5f3ef]">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Qty {product.quantity} · Size {product.size || "Default"} · Color{" "}
                            {product.color || "Default"}
                          </p>
                          <p className="mt-2 text-sm font-semibold">Rs. {product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
