"use client";

import Link from "next/link";
import { useState } from "react";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useToast } from "@/components/toast-provider";
import { apiRequest, downloadApiFile } from "@/lib/api";
import { canCustomerCancelOrder, RETURN_WINDOW_DAYS, type OrderProductSnapshot, type OrderRecord } from "@/lib/orders";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Delivered within the return window? The order's last update stands in for the delivery date. */
export function isWithinReturnWindow(order: Pick<OrderRecord, "orderStatus" | "updatedAt">, now = Date.now()) {
  if (order.orderStatus !== "Delivered") {
    return false;
  }
  const deliveredAt = order.updatedAt ? new Date(order.updatedAt).getTime() : now;
  return now - deliveredAt <= RETURN_WINDOW_DAYS * DAY_MS;
}

function ReviewForm({ product, defaultName }: { product: OrderProductSnapshot; defaultName: string }) {
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState(defaultName);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  if (state === "sent") {
    return <p className="fr-mono fr-muted">Thank you. Your review of {product.name} appears once we have read it.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fr-mono fr-choice fr-link is-active min-h-11 self-start">
        Review {product.name}
      </button>
    );
  }

  const submit = async () => {
    if (!quote.trim() || !name.trim()) {
      setError("Add your name and a few words about the piece.");
      return;
    }
    setState("sending");
    setError("");
    try {
      await apiRequest(`/products/${product.productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ reviewerName: name.trim(), quote: quote.trim(), rating }),
      });
      setState("sent");
      pushToast("Review sent");
    } catch (submitError) {
      setState("idle");
      setError(submitError instanceof Error ? submitError.message : "Could not send your review.");
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-4 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] pt-4">
      <span className="fr-mono fr-muted">Your review · {product.name}</span>
      <div className="flex gap-4" role="group" aria-label="Rating out of 5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-pressed={rating === value}
            aria-label={`${value} out of 5`}
            className={`fr-choice fr-word min-h-11 min-w-8 text-[1.75rem]! ${rating === value ? "is-active" : ""}`}
          >
            {value}
          </button>
        ))}
      </div>
      <label className="fr-field">
        <span>How does it fit and feel?</span>
        <textarea
          value={quote}
          onChange={(event) => setQuote(event.target.value)}
          maxLength={1200}
          rows={4}
          className="w-full resize-y border-0 border-b border-[color-mix(in_srgb,var(--foreground)_30%,transparent)] bg-transparent py-2 text-base outline-none"
        />
      </label>
      <label className="fr-field">
        <span>Name shown with the review</span>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" />
      </label>
      {error ? (
        <p className="text-sm text-[var(--accent)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-5">
        <button type="button" onClick={() => void submit()} disabled={state === "sending"} className="fr-button w-auto! px-8">
          {state === "sending" ? "Sending…" : "Send review"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="fr-mono fr-choice min-h-11">
          Not now
        </button>
      </div>
    </div>
  );
}

/** What a customer can do with one of their orders: cancel before it ships, then invoice, return, exchange, review. */
export function OrderActions({ order, onChange }: { order: OrderRecord; onChange: (order: OrderRecord) => void }) {
  const { user } = useCustomerAuth();
  const { pushToast } = useToast();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const reference = order.orderNumber || order.id;
  const supportLink = (category: "return-request" | "exchange-request") =>
    `/account?section=support&category=${category}&order=${encodeURIComponent(String(reference))}`;
  // One review per piece, even when the order holds two sizes of it.
  const pieces = order.products.filter(
    (product, index, all) => all.findIndex((other) => other.productId === product.productId) === index
  );

  const cancel = async () => {
    setCancelling(true);
    setError("");
    try {
      const updated = await apiRequest<OrderRecord>(`/order/${order.id}/cancel`, { method: "POST" });
      onChange(updated);
      setConfirmingCancel(false);
      pushToast("Order cancelled");
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Could not cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  const invoice = async () => {
    try {
      await downloadApiFile(`/order/${order.id}/invoice`, `hrushe-invoice-${reference}.pdf`);
    } catch (downloadError) {
      pushToast(downloadError instanceof Error ? downloadError.message : "Could not download the invoice", "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-sm text-[var(--accent)]" role="alert">
          {error}
        </p>
      ) : null}

      {order.paymentStatus === "paid" ? (
        <button type="button" onClick={() => void invoice()} className="fr-mono fr-choice fr-link is-active min-h-11 self-start">
          Download invoice
        </button>
      ) : null}

      {canCustomerCancelOrder(order.orderStatus) ? (
        confirmingCancel ? (
          <div className="flex max-w-xl flex-col gap-3 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] pt-4">
            <p className="text-sm leading-6">
              Cancel order #{reference}?
              {order.paymentStatus === "paid"
                ? " Your payment is refunded to the original payment method, usually within 5–7 business days."
                : ""}
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => void cancel()} disabled={cancelling} className="fr-button w-auto! px-8">
                {cancelling ? "Cancelling…" : "Yes, cancel it"}
              </button>
              <button type="button" onClick={() => setConfirmingCancel(false)} className="fr-mono fr-choice min-h-11">
                Keep my order
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => setConfirmingCancel(true)} className="fr-mono fr-choice fr-link is-active min-h-11 self-start">
              Cancel order
            </button>
            <span className="fr-mono fr-muted">You can cancel until it ships.</span>
          </div>
        )
      ) : null}

      {order.orderStatus === "Delivered" ? (
        <>
          {isWithinReturnWindow(order) ? (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <Link href={supportLink("exchange-request")} className="fr-mono fr-link flex min-h-11 items-center">
                  Exchange the size
                </Link>
                <Link href={supportLink("return-request")} className="fr-mono fr-link flex min-h-11 items-center">
                  Return this order
                </Link>
              </div>
              <span className="fr-mono fr-muted">
                One size exchange is free. Returns are open for {RETURN_WINDOW_DAYS} days; we pay the pickup.
              </span>
            </div>
          ) : (
            <span className="fr-mono fr-muted">
              The {RETURN_WINDOW_DAYS}-day return window has closed. Something wrong? <Link href="/contact" className="fr-link">Write to us</Link>.
            </span>
          )}
          {pieces.map((product) => (
            <ReviewForm key={product.productId} product={product} defaultName={user?.name || ""} />
          ))}
        </>
      ) : null}
    </div>
  );
}
