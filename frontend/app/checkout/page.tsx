"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountGuard } from "@/components/account-guard";
import { EmptyState } from "@/components/empty-state";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useToast } from "@/components/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";

type CheckoutResponse = {
  appOrderId: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  paymentStatus: string;
  mode: "provider";
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function buildInitialForm(user?: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
} | null) {
  return {
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  };
}

export default function CheckoutPage() {
  const { items, itemCount, subtotal } = useCart();
  const { user } = useCustomerAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (document.getElementById("razorpay-checkout-js")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      pushToast("Your cart is empty.", "error");
      return;
    }

    if (!form.fullName || !form.email || !form.phone || !form.address) {
      setError("Please complete all shipping details.");
      pushToast("Please complete all shipping details.", "error");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await apiRequest<CheckoutResponse>("/order/checkout", {
        method: "POST",
        body: JSON.stringify({
          shippingInfo: {
            ...form,
            paymentMethod: "Razorpay",
          },
          items,
        }),
      });

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is still loading. Please try again.");
      }

      const razorpay = new window.Razorpay({
        key: response.key,
        amount: response.amount,
        currency: response.currency,
        name: "HRUSHE",
        description: "Secure checkout",
        order_id: response.razorpayOrderId,
        prefill: response.customer,
        theme: {
          color: "#d61f26",
        },
        modal: {
          ondismiss: () => {
            window.location.href = `/checkout/failure?orderId=${encodeURIComponent(response.orderId)}`;
          },
        },
        handler: async (paymentResponse: Record<string, string>) => {
          try {
            const verification = await apiRequest<{ success: boolean; redirectUrl: string }>(
              "/order/checkout/verify",
              {
                method: "POST",
                body: JSON.stringify({
                  appOrderId: response.appOrderId,
                  ...paymentResponse,
                }),
              }
            );

            pushToast("Payment successful");
            window.location.href = verification.redirectUrl;
          } catch (verificationError) {
            const message =
              verificationError instanceof Error
                ? verificationError.message
                : "Payment verification failed.";
            setError(message);
            pushToast(message, "error");
            setSubmitting(false);
          }
        },
      });

      pushToast("Razorpay checkout opened");
      razorpay.open();
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout.";
      setError(message);
      pushToast(message, "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AccountGuard>
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          {items.length === 0 ? (
            <EmptyState
              title="Your checkout is waiting for products."
              description="Add a few pieces to your cart first, then come back here to finish the order."
              ctaHref="/shop"
              ctaLabel="Go to shop"
            />
          ) : (
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="grain-card rounded-[2rem] p-6 sm:p-8">
              <p className="eyebrow text-[var(--accent)]">Checkout</p>
              <h1 className="display-font mt-3 text-4xl">Finish your order.</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                We validate your shipping details and cart first, then hand off the session to
                Razorpay secure checkout.
              </p>
              <form className="mt-8 grid gap-4" onSubmit={(event) => void onSubmit(event)}>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                  placeholder="Full name"
                  required
                />
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                  placeholder="Email address"
                  type="email"
                  required
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                  placeholder="Phone number"
                  required
                />
                <textarea
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  className="min-h-32 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                  placeholder="Shipping address"
                  required
                />
                {error ? (
                  <div className="rounded-[1.5rem] border border-[var(--accent)]/20 bg-[var(--accent)]/6 px-4 py-3 text-sm text-[var(--accent)]">
                    {error}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="button-primary mt-2 rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Opening Razorpay..." : "Continue to Razorpay"}
                </button>
              </form>
            </section>

            <aside className="grain-card rounded-[2rem] p-6 sm:p-8">
              <p className="eyebrow text-[var(--accent)]">Order summary</p>
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Size {item.size || "Default"} · Color {item.color || "Default"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 text-[var(--muted)]">
                <div className="flex items-center justify-between">
                  <span>Total items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>Free launch offer</span>
                </div>
              </div>

              <div className="section-divider mt-6" />
              <div className="mt-6 flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>Rs. {subtotal.toLocaleString("en-IN")}</span>
              </div>

              <Link
                href="/cart"
                className="button-secondary mt-8 inline-flex rounded-full px-5 py-3 transition"
              >
                Back to cart
              </Link>
            </aside>
          </div>
          )}
        </main>
      </AccountGuard>
      <SiteFooter />
    </div>
  );
}
