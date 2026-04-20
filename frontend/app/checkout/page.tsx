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
import type { AddressRecord } from "@/lib/account";

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

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  label: AddressRecord["label"];
  house: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function buildFormFromAddress(
  address?: Partial<AddressRecord> | null,
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null
): CheckoutForm {
  return {
    fullName: address?.fullName || user?.name || "",
    email: user?.email || "",
    phone: address?.mobile || user?.phone || "",
    label: (address?.label || "Home") as AddressRecord["label"],
    house: address?.house || "",
    area: address?.area || "",
    landmark: address?.landmark || "",
    city: address?.city || "",
    state: address?.state || "",
    pincode: address?.pincode || "",
  };
}

function buildInitialForm(user?: {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: AddressRecord[];
} | null) {
  const defaultAddress =
    user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0];

  return buildFormFromAddress(defaultAddress, user);
}

function buildAddressPreview(
  address: Pick<
    AddressRecord,
    "house" | "area" | "landmark" | "city" | "state" | "pincode"
  >
) {
  return [
    address.house,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const { items, itemCount, subtotal } = useCart();
  const { user } = useCustomerAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find((address) => address.isDefault)?.id ||
      user?.addresses?.[0]?.id ||
      "manual"
  );
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

  useEffect(() => {
    setForm(buildInitialForm(user));
    setSelectedAddressId(
      user?.addresses?.find((address) => address.isDefault)?.id ||
        user?.addresses?.[0]?.id ||
        "manual"
    );
  }, [user]);

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setSelectedAddressId("manual");
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      pushToast("Your cart is empty.", "error");
      return;
    }

    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.house ||
      !form.area ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
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
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            address: {
              label: form.label,
              fullName: form.fullName,
              mobile: form.phone,
              pincode: form.pincode,
              city: form.city,
              state: form.state,
              house: form.house,
              area: form.area,
              landmark: form.landmark,
            },
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
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {items.length === 0 ? (
            <EmptyState
              title="Your checkout is waiting for products."
              description="Add a few pieces to your cart first, then come back here to finish the order."
              ctaHref="/shop"
              ctaLabel="Go to shop"
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
              <section className="grain-card rounded-[2rem] p-6 sm:p-8">
                <p className="eyebrow text-[var(--accent)]">Checkout</p>
                <h1 className="display-font mt-3 text-3xl sm:text-4xl">Finish your order.</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                  Select a saved address or fill in a fresh delivery address, then continue to
                  Razorpay secure checkout.
                </p>

                {user?.addresses && user.addresses.length > 0 ? (
                  <div className="mt-8">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Saved addresses
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId("manual");
                          setForm(buildFormFromAddress(null, user));
                        }}
                        className="button-secondary rounded-full px-4 py-2 text-xs"
                      >
                        Use manual entry
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {user.addresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(address.id);
                            setForm(buildFormFromAddress(address, user));
                          }}
                          className={`rounded-[1.4rem] border p-4 text-left transition ${
                            selectedAddressId === address.id
                              ? "border-black bg-black text-white"
                              : "border-[var(--border)] bg-white/70 hover:border-black/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-[0.16em]">
                              {address.label}
                            </span>
                            {address.isDefault ? (
                              <span className="rounded-full border border-current px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 font-semibold">{address.fullName}</p>
                          <p className="mt-1 text-sm opacity-80">{address.mobile}</p>
                          <p className="mt-2 text-sm leading-6 opacity-80">
                            {buildAddressPreview(address)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <form className="mt-8 grid gap-4" onSubmit={(event) => void onSubmit(event)}>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange}
                    className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                    placeholder="Full name"
                    required
                  />
                  <input
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                    placeholder="Email address"
                    type="email"
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      placeholder="Phone number"
                      required
                    />
                    <select
                      name="label"
                      value={form.label}
                      onChange={onChange}
                      className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <input
                    name="house"
                    value={form.house}
                    onChange={onChange}
                    className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                    placeholder="House / Flat / Building"
                    required
                  />
                  <input
                    name="area"
                    value={form.area}
                    onChange={onChange}
                    className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                    placeholder="Area / Road / Locality"
                    required
                  />
                  <input
                    name="landmark"
                    value={form.landmark}
                    onChange={onChange}
                    className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                    placeholder="Landmark (optional)"
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input
                      name="city"
                      value={form.city}
                      onChange={onChange}
                      className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      placeholder="City"
                      required
                    />
                    <input
                      name="state"
                      value={form.state}
                      onChange={onChange}
                      className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      placeholder="State"
                      required
                    />
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={onChange}
                      className="min-h-12 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      placeholder="Pincode"
                      required
                    />
                  </div>
                  {error ? (
                    <div className="rounded-[1.5rem] border border-[var(--accent)]/20 bg-[var(--accent)]/6 px-4 py-3 text-sm text-[var(--accent)]">
                      {error}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={submitting || items.length === 0}
                    className="button-primary mt-2 w-full rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
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
                      key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`}
                      className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4"
                    >
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Size {item.size || "Default"} · Color {item.color || "Default"}
                          {item.fit ? ` · Fit ${item.fit}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">Qty {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3 text-sm text-[var(--muted)]">
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

                <div className="mt-6 border-t border-[var(--border)] pt-5">
                  <div className="flex items-center justify-between text-xl font-semibold">
                    <span>Total</span>
                    <span>Rs. {subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-6">
                    <Link href="/cart" className="button-secondary rounded-full px-5 py-3">
                      Back to cart
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      </AccountGuard>
      <SiteFooter />
    </div>
  );
}
