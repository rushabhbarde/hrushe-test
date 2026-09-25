"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrderTrackingView } from "@/components/order-tracking-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import type { PublicTrackingRecord } from "@/lib/orders";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/phone";

type SearchMode = "email" | "phone";

function TrackOrderPageContent() {
  const searchParams = useSearchParams();
  const [searchMode, setSearchMode] = useState<SearchMode>("email");
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [contactValue, setContactValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<PublicTrackingRecord | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedContactValue = contactValue.trim();
      if (searchMode === "phone" && !isValidIndianPhone(normalizedContactValue)) {
        setError("Enter a valid 10-digit Indian phone number.");
        setLoading(false);
        return;
      }

      const payload =
        searchMode === "email"
          ? { orderId: orderId.trim(), email: normalizedContactValue }
          : { orderId: orderId.trim(), phone: normalizeIndianPhone(normalizedContactValue) };

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
      <main className="px-5 pb-16 pt-6 lg:px-10 lg:pb-24 lg:pt-12" aria-live="polite">
        {order ? (
          <div className="mx-auto flex max-w-[1320px] flex-col gap-8">
            <h1 className="sr-only">Order tracking</h1>
            <OrderTrackingView
              order={order}
              actions={
                <button type="button" onClick={() => setOrder(null)} className="fr-mono fr-choice fr-link is-active self-start">
                  Track another order
                </button>
              }
            />
          </div>
        ) : (
          <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-20">
            <div className="flex flex-col gap-4">
              <span className="fr-mono fr-muted">Track an order</span>
              <h1 className="fr-word text-[clamp(3.5rem,14vw,8rem)] lg:text-[clamp(4rem,7vw,8rem)]">Where is it?</h1>
              <p className="max-w-md text-base leading-7 text-[var(--muted)]">
                Your order number, with the email or phone you used at checkout. No account needed.
              </p>
            </div>

            <div className="flex flex-col gap-8 lg:pt-10">
              <fieldset className="flex gap-6">
                <legend className="sr-only">Choose how to verify your order</legend>
                {(["email", "phone"] as SearchMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSearchMode(mode)}
                    aria-pressed={searchMode === mode}
                    className={`fr-mono fr-choice is-underlined min-h-11 ${searchMode === mode ? "is-active" : ""}`}
                  >
                    With {mode}
                  </button>
                ))}
              </fieldset>

              <form className="flex flex-col gap-6" onSubmit={(event) => void onSubmit(event)} aria-busy={loading}>
                <label className="fr-field">
                  <span>Order number</span>
                  <input
                    value={orderId}
                    onChange={(event) => setOrderId(event.target.value)}
                    className="fr-input"
                    placeholder="e.g. 1024"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="fr-field">
                  <span>{searchMode === "email" ? "Email address" : "Phone number"}</span>
                  <input
                    value={contactValue}
                    onChange={(event) => setContactValue(event.target.value)}
                    className="fr-input"
                    placeholder={searchMode === "email" ? "you@example.com" : "98765 43210"}
                    type={searchMode === "email" ? "email" : "tel"}
                    inputMode={searchMode === "email" ? "email" : "tel"}
                    autoComplete={searchMode === "email" ? "email" : "tel"}
                    required
                  />
                </label>
                {error ? (
                  <p className="text-sm text-[var(--accent)]" role="alert">
                    {error}
                  </p>
                ) : null}
                <button type="submit" disabled={loading} className="fr-button">
                  {loading ? "Looking…" : "Find my order"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderPageContent />
    </Suspense>
  );
}
