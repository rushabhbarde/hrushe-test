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
import { ServicePromise } from "@/components/service-promise";
import { apiRequest } from "@/lib/api";
import type { AddressRecord } from "@/lib/account";
import { shouldBypassImageOptimization } from "@/lib/image-source";

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

type CheckoutStep = "information" | "shipping" | "payment";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const checkoutSteps: { key: CheckoutStep; label: string }[] = [
  { key: "information", label: "Information" },
  { key: "shipping", label: "Shipping" },
  { key: "payment", label: "Payment" },
];

const shipping = 0;

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
    <div className={compact ? "" : "border border-[var(--border)] bg-[var(--surface)]"}>
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold uppercase tracking-[0.1em]">Order details</p>
        <span className="text-sm font-semibold text-[var(--accent)]">{itemCount}</span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`}
            className="grid grid-cols-[5.25rem_minmax(0,1fr)_auto] items-start gap-3 px-4 py-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:px-5"
          >
            <div className="relative aspect-[0.84/1] overflow-visible bg-[#f4f4f4]">
              <span className="absolute -right-2 -top-2 z-10 flex h-6 min-w-6 items-center justify-center bg-[var(--foreground)] px-1 text-xs font-semibold text-[var(--background)]">
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
              <p className="text-sm font-semibold uppercase leading-5">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {item.size || "OS"} / {item.color || "Default"}
              </p>
            </div>
            <p className="whitespace-nowrap text-sm font-semibold">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-[var(--border)] px-4 py-5 text-sm sm:px-5">
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)]">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)]">Shipping</span>
          <span>{shipping ? formatPrice(shipping) : "Free"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)]">Estimated tax</span>
          <span>Included</span>
        </div>
        <div className="border-t border-[var(--foreground)] pt-5">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 py-4 sm:px-5">
        <p className="text-xs leading-6 text-[var(--muted)]">
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
  const [activeStep, setActiveStep] = useState<CheckoutStep>("information");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

  const goNextStep = () => {
    if (activeStep === "information" && validateContact()) {
      setActiveStep("shipping");
      return;
    }

    if (activeStep === "shipping" && validateShipping()) {
      setActiveStep("payment");
    }
  };

  const goToStep = (nextStep: CheckoutStep) => {
    if (nextStep === activeStep) {
      return;
    }

    if (nextStep === "information") {
      setError("");
      setActiveStep("information");
      return;
    }

    if (nextStep === "shipping") {
      if (validateContact()) {
        setActiveStep("shipping");
      }
      return;
    }

    if (validateContact() && validateShipping()) {
      setActiveStep("payment");
    }
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
      setActiveStep("payment");
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
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-6 sm:py-10 lg:py-12">
          <div className="lux-container">
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
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.96fr)_430px] lg:items-start xl:gap-16">
                <section className="reveal-up min-w-0">
                  <Link
                    href="/cart"
                    className="mb-8 inline-flex min-h-11 items-center gap-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]"
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

                  <div className="mt-8 grid grid-cols-3 gap-2 text-xs font-semibold uppercase tracking-[0.08em] sm:max-w-xl sm:text-sm">
                    {checkoutSteps.map((step, index) => (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => goToStep(step.key)}
                        className={`border-b py-2 text-left transition ${
                          activeStep === step.key
                            ? "border-[var(--foreground)] text-[var(--foreground)]"
                            : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                        aria-current={activeStep === step.key ? "step" : undefined}
                      >
                        {index + 1}. {step.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSummaryOpen((current) => !current)}
                    className="lux-action-muted mt-7 flex w-full justify-between lg:hidden"
                    aria-expanded={summaryOpen}
                    aria-controls="mobile-order-summary"
                  >
                    <span>Your order ({itemCount})</span>
                    <span>{summaryOpen ? "Close" : formatPrice(subtotal)}</span>
                  </button>
                  {summaryOpen ? (
                    <div id="mobile-order-summary" className="mobile-drawer-enter mt-4 border border-[var(--border)] bg-white/62 p-4 lg:hidden">
                      <OrderSummary items={items} itemCount={itemCount} subtotal={subtotal} compact />
                    </div>
                  ) : null}

                  <form
                    className="mt-8 max-w-[640px] space-y-8"
                    onSubmit={(event) => void onSubmit(event)}
                  >
                    {activeStep === "information" ? (
                      <fieldset className="auth-switch-panel grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.08em]">Contact info</legend>
                        <label className="field-label">
                          Email
                          <input
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            className="lux-input"
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
                            className="lux-input"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={16}
                            required
                          />
                        </label>
                        <p className="text-xs leading-5 text-[var(--muted)]">Used only for delivery and order updates.</p>
                      </fieldset>
                    ) : null}

                    {activeStep === "shipping" ? (
                      <div className="auth-switch-panel space-y-8 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
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
                                  className={`min-w-[230px] border p-4 text-left text-sm transition ${
                                    selectedAddressId === address.id
                                      ? "hrushe-inverse-action"
                                      : "border-[var(--border)] bg-white/60 text-[var(--foreground)]"
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
                          <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.08em]">Shipping address</legend>
                          <label className="field-label">Full name<input name="fullName" value={form.fullName} onChange={onChange} className="lux-input" autoComplete="name" required /></label>
                          <label className="field-label">Address type<select name="label" value={form.label} onChange={onChange} className="lux-input"><option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option></select></label>
                          <label className="field-label">Address<input name="house" value={form.house} onChange={onChange} className="lux-input" autoComplete="address-line1" required /></label>
                          <label className="field-label">Area / locality<input name="area" value={form.area} onChange={onChange} className="lux-input" autoComplete="address-line2" required /></label>
                          <label className="field-label">Landmark <span className="normal-case tracking-normal">(optional)</span><input name="landmark" value={form.landmark} onChange={onChange} className="lux-input" /></label>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="field-label">City<input name="city" value={form.city} onChange={onChange} className="lux-input" autoComplete="address-level2" required /></label>
                            <label className="field-label">State / region<input name="state" value={form.state} onChange={onChange} className="lux-input" autoComplete="address-level1" required /></label>
                          </div>
                          <label className="field-label sm:max-w-[calc(50%_-_0.5rem)]">Postal code<input name="pincode" value={form.pincode} onChange={onChange} className="lux-input" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label>
                        </fieldset>
                      </div>
                    ) : null}

                    {activeStep === "payment" ? (
                      <div className="auth-switch-panel border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                        <div className="grid gap-4 border-b border-[var(--border)] pb-5 text-sm">
                          <div className="grid grid-cols-[92px_1fr_auto] gap-3">
                            <span className="text-[var(--muted)]">Contact</span>
                            <span className="min-w-0 break-words">{form.email} · {form.phone}</span>
                            <button type="button" onClick={() => setActiveStep("information")} className="underline underline-offset-4">Edit</button>
                          </div>
                          <div className="grid grid-cols-[92px_1fr_auto] gap-3">
                            <span className="text-[var(--muted)]">Deliver to</span>
                            <span className="min-w-0">{buildAddressPreview(form)}</span>
                            <button type="button" onClick={() => setActiveStep("shipping")} className="underline underline-offset-4">Edit</button>
                          </div>
                        </div>
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
                    ) : null}

                    {error ? (
                      <div role="alert" className="border border-[var(--accent)]/20 bg-[var(--accent)]/6 px-4 py-3 text-sm text-[var(--accent)]">
                        {error}
                      </div>
                    ) : null}

                    <ServicePromise compact />

                    {activeStep === "payment" ? (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="lux-action w-full sm:w-[230px] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Opening..." : "Pay securely"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goNextStep}
                        className="lux-action-muted w-full justify-between sm:w-[230px]"
                      >
                        {activeStep === "information" ? "Shipping" : "Payment"}
                        <span className="text-xl leading-none">Next</span>
                      </button>
                    )}
                  </form>
                </section>

                <aside className="reveal-up-delayed hidden lg:block lg:sticky lg:top-28">
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
