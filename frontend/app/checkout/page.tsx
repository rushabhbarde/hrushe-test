"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCart, type CartLine } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useToast } from "@/components/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import type { AddressRecord } from "@/lib/account";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { getRazorpayLaunchBlocker } from "@/lib/razorpay-readiness";

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
  checkoutState: string;
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

const shipping = 0;
const checkoutInputClass =
  "lux-input !min-h-[3.75rem] !border-x-0 !border-t-0 !border-b !border-[var(--border)] !bg-transparent !px-0 focus:!border-[var(--foreground)]";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
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

function OrderSummary({
  items,
  itemCount,
  subtotal,
  compact = false,
}: {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  compact?: boolean;
}) {
  const total = subtotal + shipping;

  return (
    <div
      className={
        compact
          ? "bg-[var(--foreground)] p-4 text-white"
          : "bg-[var(--foreground)] p-5 text-white shadow-[0_28px_80px_rgba(17,17,17,0.12)] sm:p-6"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-white/54">Order</p>
          <p className="mt-2 text-lg font-semibold uppercase tracking-normal">Details</p>
        </div>
        <span className="text-sm font-semibold text-white/72">{itemCount}</span>
      </div>

      <div className="mt-6 grid gap-5">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`}
            className="grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-start gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]"
          >
            <div className="relative aspect-[0.84/1] overflow-visible bg-white/10">
              <span className="absolute -right-2 -top-2 z-10 flex h-6 min-w-6 items-center justify-center bg-white px-1 text-xs font-semibold text-[var(--foreground)]">
                {item.quantity}
              </span>
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  unoptimized={shouldBypassImageOptimization(item.image)}
                  sizes="96px"
                  className="object-contain p-2"
                />
              ) : (
                <div className="h-full w-full" style={{ background: item.accent }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase leading-5 text-white">{item.name}</p>
              <p className="mt-1 text-sm text-white/62">
                {item.size || "OS"} / {item.color || "Default"}
              </p>
            </div>
            <p className="whitespace-nowrap text-sm font-semibold text-white">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7 space-y-3 text-sm text-white/72">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="text-white">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span className="text-white">{shipping ? formatPrice(shipping) : "Free"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Estimated tax</span>
          <span className="text-white">Included</span>
        </div>
        <div className="pt-5">
          <div className="mb-5 h-px bg-white/34" aria-hidden="true" />
          <div className="flex items-center justify-between text-lg font-semibold">
            <span className="text-white">Total</span>
            <span className="text-white">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white/8 px-4 py-4">
        <p className="text-xs leading-6 text-white/62">
          Dispatch within 1–3 business days. Delivery time depends on the destination and courier.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, itemCount, subtotal, isReady } = useCart();
  const { user } = useCustomerAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find((address) => address.isDefault)?.id ||
      user?.addresses?.[0]?.id ||
      "manual"
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.Razorpay)
  );
  const [razorpayLoadError, setRazorpayLoadError] = useState("");

  useEffect(() => {
    if (window.Razorpay) {
      return;
    }

    const onScriptLoad = () => {
      setRazorpayReady(Boolean(window.Razorpay));
      setRazorpayLoadError("");
    };
    const onScriptError = () => {
      setRazorpayReady(false);
      setRazorpayLoadError("Payment checkout could not load. Please refresh and try again.");
    };
    const existingScript = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", onScriptLoad);
      existingScript.addEventListener("error", onScriptError);

      return () => {
        existingScript.removeEventListener("load", onScriptLoad);
        existingScript.removeEventListener("error", onScriptError);
      };
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.addEventListener("load", onScriptLoad);
    script.addEventListener("error", onScriptError);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", onScriptLoad);
      script.removeEventListener("error", onScriptError);
    };
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      setForm(buildInitialForm(user));
      setSelectedAddressId(
        user?.addresses?.find((address) => address.isDefault)?.id ||
          user?.addresses?.[0]?.id ||
          "manual"
      );
    });

    return () => {
      active = false;
    };
  }, [user]);

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setSelectedAddressId("manual");
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validateContact = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email) || !/^\+?[0-9\s-]{10,15}$/.test(form.phone)) {
      setError("Please add your contact information.");
      pushToast("Please add your contact information.", "error");
      return false;
    }

    setError("");
    return true;
  };

  const validateShipping = () => {
    if (
      !form.fullName ||
      !form.house ||
      !form.area ||
      !form.city ||
      !form.state ||
      !/^\d{6}$/.test(form.pincode)
    ) {
      setError("Please complete all shipping details.");
      pushToast("Please complete all shipping details.", "error");
      return false;
    }

    setError("");
    return true;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      pushToast("Your cart is empty.", "error");
      return;
    }

    if (!validateContact() || !validateShipping()) {
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms before payment.");
      pushToast("Please accept the terms before payment.", "error");
      return;
    }

    const RazorpayCheckout = window.Razorpay;
    const razorpayLaunchBlocker = getRazorpayLaunchBlocker({
      scriptReady: razorpayReady,
      hasConstructor: Boolean(RazorpayCheckout),
      loadError: razorpayLoadError,
    });
    if (razorpayLaunchBlocker) {
      const message = razorpayLaunchBlocker;
      setError(message);
      pushToast(message, "error");
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

      const razorpay = new RazorpayCheckout!({
        key: response.key,
        amount: response.amount,
        currency: response.currency,
        name: "HRUSHE",
        description: "Secure checkout",
        order_id: response.razorpayOrderId,
        prefill: response.customer,
        theme: {
          color: "#111111",
        },
        modal: {
          ondismiss: async () => {
            await apiRequest("/order/checkout/failure", {
              method: "POST",
              body: JSON.stringify({
                appOrderId: response.appOrderId,
                checkoutState: response.checkoutState,
              }),
            }).catch(() => undefined);
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
    <div className="page-shell lg:h-dvh lg:overflow-hidden">
      <SiteHeader />
      <main className="lux-page py-6 sm:py-10 lg:h-[calc(100dvh-6rem)] lg:min-h-0 lg:overflow-hidden lg:py-12">
          <div className="lux-container lg:h-full">
            {!isReady ? (
              <>
                <h1 className="sr-only">Checkout</h1>
                <LoadingState
                  title="Preparing your checkout"
                  description="We are syncing your saved bag before payment details are shown."
                />
              </>
            ) : items.length === 0 ? (
              <section className="mx-auto max-w-3xl py-10">
                <h1 className="sr-only">Checkout</h1>
                <EmptyState
                  title="Your checkout is waiting for products."
                  description="Add a few pieces to your cart first, then come back here to finish the order."
                  ctaHref="/shop"
                  ctaLabel="Go to shop"
                />
              </section>
            ) : (
              <div className="grid gap-10 lg:h-full lg:grid-cols-[minmax(0,0.98fr)_420px] lg:items-stretch lg:overflow-hidden xl:gap-16">
                <section className="reveal-up min-w-0 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pb-12 lg:pr-8">
                  <Link
                    href="/cart"
                    className="mb-8 inline-flex min-h-11 items-center gap-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:text-[var(--foreground)]"
                  >
                    <span className="h-px w-14 bg-current" />
                    Back to bag
                  </Link>

                  <h1 className="text-3xl font-semibold uppercase tracking-normal sm:text-4xl">
                    Secure checkout
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    Confirm contact and delivery details before opening the Razorpay payment window.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSummaryOpen((current) => !current)}
                    className="mt-7 flex min-h-14 w-full items-center justify-between bg-[var(--foreground)] px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white lg:hidden"
                    aria-expanded={summaryOpen}
                    aria-controls="mobile-order-summary"
                  >
                    <span>Your order ({itemCount})</span>
                    <span>{summaryOpen ? "Close" : formatPrice(subtotal)}</span>
                  </button>
                  {summaryOpen ? (
                    <div id="mobile-order-summary" className="mobile-drawer-enter mt-4 lg:hidden">
                      <OrderSummary items={items} itemCount={itemCount} subtotal={subtotal} compact />
                    </div>
                  ) : null}

                  <form
                    className="mt-10 max-w-[640px] space-y-10"
                    onSubmit={(event) => void onSubmit(event)}
                  >
                    <div className="auth-switch-panel space-y-10">
                      <fieldset className="grid gap-5">
                        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.1em]">Contact details</legend>
                        <label className="field-label">
                          Email
                          <input
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            className={checkoutInputClass}
                            type="email"
                            autoComplete="email"
                            required
                          />
                        </label>
                        <label className="field-label">
                          Phone
                          <input
                            name="phone"
                            value={form.phone}
                            onChange={onChange}
                            className={checkoutInputClass}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={16}
                            required
                          />
                        </label>
                        <p className="text-xs leading-5 text-[var(--muted)]">Used only for delivery and order updates.</p>
                      </fieldset>

                      {user?.addresses && user.addresses.length > 0 ? (
                        <section aria-labelledby="saved-address-heading">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 id="saved-address-heading" className="text-sm font-semibold uppercase tracking-[0.08em]">Saved address</h2>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAddressId("manual");
                                setForm(buildFormFromAddress(null, user));
                              }}
                              className="text-xs uppercase tracking-[0.12em] text-[var(--muted)] underline underline-offset-4"
                            >
                              Enter manually
                            </button>
                          </div>
                          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
                            {user.addresses.map((address) => (
                              <button
                                key={address.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAddressId(address.id);
                                  setForm(buildFormFromAddress(address, user));
                                }}
                                aria-pressed={selectedAddressId === address.id}
                                className={`min-w-[230px] p-4 text-left text-sm transition ${
                                  selectedAddressId === address.id
                                    ? "hrushe-inverse-action"
                                    : "bg-[#f6f6f6] text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                                }`}
                              >
                                <span className="text-xs uppercase tracking-[0.16em]">{address.label}</span>
                                <p className="mt-2 font-semibold">{address.fullName}</p>
                                <p className="mt-1 leading-6 opacity-75">{buildAddressPreview(address)}</p>
                              </button>
                            ))}
                          </div>
                        </section>
                      ) : null}

                      <fieldset className="grid gap-4">
                        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.08em]">Delivery address</legend>
                        <label className="field-label">Full name<input name="fullName" value={form.fullName} onChange={onChange} className={checkoutInputClass} autoComplete="name" required /></label>
                        <label className="field-label">Address type<select name="label" value={form.label} onChange={onChange} className={checkoutInputClass}><option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option></select></label>
                        <label className="field-label">Address<input name="house" value={form.house} onChange={onChange} className={checkoutInputClass} autoComplete="address-line1" required /></label>
                        <label className="field-label">Area / locality<input name="area" value={form.area} onChange={onChange} className={checkoutInputClass} autoComplete="address-line2" required /></label>
                        <label className="field-label">Landmark <span className="normal-case tracking-normal">(optional)</span><input name="landmark" value={form.landmark} onChange={onChange} className={checkoutInputClass} /></label>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="field-label">City<input name="city" value={form.city} onChange={onChange} className={checkoutInputClass} autoComplete="address-level2" required /></label>
                          <label className="field-label">State / region<input name="state" value={form.state} onChange={onChange} className={checkoutInputClass} autoComplete="address-level1" required /></label>
                        </div>
                        <label className="field-label sm:max-w-[calc(50%_-_0.5rem)]">Postal code<input name="pincode" value={form.pincode} onChange={onChange} className={checkoutInputClass} autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label>
                      </fieldset>

                      <div className="border-t border-[var(--border)] pt-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.1em]">
                          Payment
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          Secure Razorpay payment opens after review. Your order is created only after
                          payment verification.
                        </p>
                        <label className="mt-4 flex items-start gap-3 text-sm text-[var(--muted)]">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(event) => {
                              setAcceptedTerms(event.target.checked);
                              if (event.target.checked) {
                                setError("");
                              }
                            }}
                            className="mt-0.5 h-5 w-5 rounded-none"
                          />
                          <span>
                            I agree to the <Link href="/policies" className="underline underline-offset-4">Terms and Conditions</Link>.
                          </span>
                        </label>
                      </div>
                    </div>

                    {error ? (
                      <div role="alert" className="border border-[var(--accent)]/20 bg-[var(--accent)]/6 px-4 py-3 text-sm text-[var(--accent)]">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="lux-action w-full sm:w-[230px] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Opening..." : "Pay securely"}
                    </button>
                  </form>
                </section>

                <aside className="reveal-up-delayed hidden lg:block lg:h-full lg:overflow-y-auto lg:overscroll-contain">
                  <OrderSummary items={items} itemCount={itemCount} subtotal={subtotal} />
                </aside>
              </div>
            )}
          </div>
      </main>
      <SiteFooter />
    </div>
  );
}
