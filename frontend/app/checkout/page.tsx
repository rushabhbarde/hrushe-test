"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useToast } from "@/components/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import type { AddressRecord } from "@/lib/account";
import {
  buildCheckoutAttemptSnapshot,
  createCheckoutIdempotencyKey,
} from "@/lib/checkout-idempotency";
import { resolveCheckoutSuccessPath } from "@/lib/checkout-redirect";
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
const checkoutInputClass = "fr-input";
const stepLabels = ["Contact", "Delivery", "Payment"] as const;
const stepQuestions = ["How can we reach you?", "Where should we send it?", "How would you like to pay?"] as const;

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


export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, subtotal, isReady } = useCart();
  const { user } = useCustomerAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find((address) => address.isDefault)?.id ||
      user?.addresses?.[0]?.id ||
      "manual"
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifiedSuccessUrl, setVerifiedSuccessUrl] = useState("");
  const checkoutAttemptRef = useRef({ snapshot: "", key: "" });
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
      const checkoutSnapshot = buildCheckoutAttemptSnapshot({
        items,
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
        },
      });

      if (checkoutAttemptRef.current.snapshot !== checkoutSnapshot) {
        checkoutAttemptRef.current = {
          snapshot: checkoutSnapshot,
          key: createCheckoutIdempotencyKey(),
        };
      }

      const response = await apiRequest<CheckoutResponse>("/order/checkout", {
        method: "POST",
        headers: {
          "Idempotency-Key": checkoutAttemptRef.current.key,
        },
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
            router.push(`/checkout/failure?orderId=${encodeURIComponent(response.orderId)}`);
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
            const successPath = resolveCheckoutSuccessPath(
              verification.redirectUrl,
              window.location.origin,
              response.orderId
            );
            setVerifiedSuccessUrl(successPath);
            window.location.assign(successPath);
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

  const total = subtotal + shipping;
  const advance = () => {
    if (step === 1 && validateContact()) {
      setStep(2);
    } else if (step === 2 && validateShipping()) {
      setStep(3);
    }
  };
  const field = (label: string, input: React.ReactNode, className = "") => (
    <label className={`fr-field ${className}`}>
      <span>{label}</span>
      {input}
    </label>
  );
  const firstItem = items[0];

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="px-5 pb-40 pt-6 lg:px-10 lg:pb-16 lg:pt-8">
        {!isReady ? (
          <>
            <h1 className="sr-only">Checkout</h1>
            <LoadingState title="Preparing your checkout" description="We are syncing your saved bag before payment details are shown." />
          </>
        ) : items.length === 0 ? (
          <section className="mx-auto max-w-3xl py-10">
            <h1 className="sr-only">Checkout</h1>
            <EmptyState
              title="Your checkout is waiting for products."
              description="Add a few pieces to your bag first, then come back here to finish the order."
              ctaHref="/shop"
              ctaLabel="Go to shop"
            />
          </section>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <Link href="/cart" className="fr-mono">
                ← Bag
              </Link>
              <span className="fr-mono fr-muted">Step {step} / 3 · Secure checkout</span>
            </div>
            <ol className="grid grid-cols-3 gap-2" aria-label="Checkout steps">
              {stepLabels.map((label, index) => {
                const done = index + 1 <= step;

                return (
                  <li key={label} className="flex flex-col gap-2" aria-current={index + 1 === step ? "step" : undefined}>
                    <span className="h-0.5" style={{ background: done ? "var(--foreground)" : "color-mix(in srgb, var(--foreground) 12%, transparent)" }} />
                    <button
                      type="button"
                      onClick={() => index + 1 < step && setStep((index + 1) as 1 | 2 | 3)}
                      disabled={index + 1 >= step}
                      className={`fr-mono text-left ${done ? "text-[var(--foreground)]" : "text-[var(--fr-quiet)]"} ${index + 1 < step ? "cursor-pointer underline underline-offset-4" : "cursor-default"}`}
                    >
                      {String(index + 1).padStart(2, "0")} {label}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-24">
              <form
                className="flex max-w-[760px] flex-col gap-7"
                onSubmit={(event) => {
                  if (step < 3) {
                    event.preventDefault();
                    advance();
                    return;
                  }

                  void onSubmit(event);
                }}
              >
                <h1 className="fr-word text-[2.6rem] lg:text-[clamp(3.5rem,6vw,5.5rem)]">{stepQuestions[step - 1]}</h1>

                {step === 1 ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {field("Email", <input name="email" value={form.email} onChange={onChange} className={checkoutInputClass} type="email" autoComplete="email" required />)}
                    {field("Phone", <input name="phone" value={form.phone} onChange={onChange} className={checkoutInputClass} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} required />)}
                    <p className="text-[0.82rem] text-[var(--muted)] sm:col-span-2">Used only for delivery and order updates.</p>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="flex flex-col gap-6">
                    {user?.addresses && user.addresses.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="fr-mono">Saved addresses</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddressId("manual");
                              setForm(buildFormFromAddress(null, user));
                            }}
                            className="fr-mono fr-choice fr-link min-h-11"
                          >
                            Enter manually
                          </button>
                        </div>
                        <div className="flex flex-col">
                          {user.addresses.map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              onClick={() => {
                                setSelectedAddressId(address.id);
                                setForm(buildFormFromAddress(address, user));
                              }}
                              aria-pressed={selectedAddressId === address.id}
                              className={`fr-choice flex flex-col gap-1 border-b border-[var(--border)] py-3 text-left ${selectedAddressId === address.id ? "is-active" : ""}`}
                            >
                              <span className="fr-word text-[1.5rem]!">{address.label} · {address.fullName}</span>
                              <span className="text-[0.85rem]">{buildAddressPreview(address)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="grid gap-6 sm:grid-cols-2">
                      {field("Full name", <input name="fullName" value={form.fullName} onChange={onChange} className={checkoutInputClass} autoComplete="name" required />)}
                      {field(
                        "Address type",
                        <select name="label" value={form.label} onChange={onChange} className={checkoutInputClass}>
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                      {field("House, street", <input name="house" value={form.house} onChange={onChange} className={checkoutInputClass} autoComplete="address-line1" required />, "sm:col-span-2")}
                      {field("Area / locality", <input name="area" value={form.area} onChange={onChange} className={checkoutInputClass} autoComplete="address-line2" required />)}
                      {field("Landmark (optional)", <input name="landmark" value={form.landmark} onChange={onChange} className={checkoutInputClass} />)}
                      {field("City", <input name="city" value={form.city} onChange={onChange} className={checkoutInputClass} autoComplete="address-level2" required />)}
                      {field("State", <input name="state" value={form.state} onChange={onChange} className={checkoutInputClass} autoComplete="address-level1" required />)}
                      {field("PIN code", <input name="pincode" value={form.pincode} onChange={onChange} className={checkoutInputClass} autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />)}
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 border border-[var(--foreground)] p-5">
                      <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--foreground)]" aria-hidden="true" />
                      <span className="flex flex-col gap-1">
                        <span className="font-medium">Pay online</span>
                        <span className="text-[0.85rem] text-[var(--muted)]">UPI, cards and netbanking via Razorpay. Your order is confirmed after payment.</span>
                      </span>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <span className="fr-mono fr-muted">Contact</span>
                        <span className="text-[0.95rem]">{form.email}</span>
                        <span className="text-[0.95rem]">{form.phone}</span>
                        <button type="button" onClick={() => setStep(1)} className="fr-mono fr-choice is-active fr-link mt-1 self-start">
                          Change
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="fr-mono fr-muted">Delivering to</span>
                        <span className="text-[0.95rem]">{form.fullName}</span>
                        <span className="text-[0.95rem] text-[var(--muted)]">{buildAddressPreview(form)}</span>
                        <button type="button" onClick={() => setStep(2)} className="fr-mono fr-choice is-active fr-link mt-1 self-start">
                          Change
                        </button>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 text-[0.9rem] text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) => {
                          setAcceptedTerms(event.target.checked);
                          if (event.target.checked) {
                            setError("");
                          }
                        }}
                        className="mt-0.5 h-5 w-5 rounded-none accent-[var(--foreground)]"
                      />
                      <span>
                        I agree to the{" "}
                        <Link href="/policies" className="underline underline-offset-4">
                          Terms and Conditions
                        </Link>
                        .
                      </span>
                    </label>
                  </div>
                ) : null}

                {error ? (
                  <p role="alert" className="text-[0.9rem] text-[var(--danger)]">
                    {error}
                  </p>
                ) : null}

                <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--background)] px-5 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 lg:static lg:border-0 lg:p-0">
                  <div className="flex items-baseline justify-between lg:hidden">
                    <span className="fr-mono fr-muted">{String(itemCount).padStart(2, "0")} pieces</span>
                    <span className="fr-word text-[1.6rem]">{formatPrice(total)}</span>
                  </div>
                  <button type="submit" disabled={submitting} className="fr-button lg:max-w-[320px]">
                    {step < 3
                      ? step === 1
                        ? "Continue to delivery"
                        : "Continue to payment"
                      : submitting
                        ? verifiedSuccessUrl
                          ? "Redirecting…"
                          : "Opening payment…"
                        : `Pay ${formatPrice(total)}`}
                  </button>
                  {verifiedSuccessUrl ? (
                    <Link href={verifiedSuccessUrl} className="fr-mono fr-link self-start">
                      Continue to confirmation
                    </Link>
                  ) : null}
                </div>
              </form>

              <aside className="hidden flex-col gap-4 lg:flex" aria-label="Your order">
                {firstItem ? (
                  <div className="fr-frame aspect-[3/4] w-full">
                    <div className="fr-frame__layer is-active">
                      {firstItem.image ? (
                        <Image src={firstItem.image} alt={firstItem.name} fill unoptimized={shouldBypassImageOptimization(firstItem.image)} sizes="300px" />
                      ) : (
                        <div className="h-full w-full" style={{ background: firstItem.accent }} />
                      )}
                    </div>
                  </div>
                ) : null}
                <ul className="flex flex-col">
                  {items.map((item) => (
                    <li key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`} className="flex justify-between gap-3 border-b border-[var(--border)] py-2 text-[0.85rem]">
                      <span>
                        {item.name} <span className="text-[var(--muted)]">· {item.size || "OS"} × {item.quantity}</span>
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-[0.85rem] text-[var(--muted)]">
                  <span>Delivery</span>
                  <span>{shipping ? formatPrice(shipping) : "Free"}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="fr-mono">Total</span>
                  <span className="fr-word text-[2.25rem]">{formatPrice(total)}</span>
                </div>
                <span className="fr-mono fr-muted text-[0.6rem]">Dispatch in 1–3 business days · tax included</span>
              </aside>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
