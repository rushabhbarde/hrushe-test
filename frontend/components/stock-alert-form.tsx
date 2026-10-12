"use client";

import { useState } from "react";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { apiRequest } from "@/lib/api";

/** "Tell me when it's back": shown on a piece when one or more sizes are out of stock. */
export function StockAlertForm({ productId, soldOutSizes }: { productId: string; soldOutSizes: string[] }) {
  const { user } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(soldOutSizes.length === 1 ? soldOutSizes[0] : "");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const address = email || user?.email || "";

  if (soldOutSizes.length === 0) {
    return null;
  }

  if (state === "sent") {
    return (
      <p className="fr-mono fr-muted" role="status">
        Noted. We will email you once when {size} is back.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fr-mono fr-choice fr-link is-active min-h-11 self-start">
        Your size sold out? Tell me when it&apos;s back
      </button>
    );
  }

  const submit = async () => {
    if (!size) {
      setError("Choose the size you are waiting for.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim())) {
      setError("Enter the email we should write to.");
      return;
    }
    setState("sending");
    setError("");
    try {
      await apiRequest(`/products/${productId}/stock-alerts`, {
        method: "POST",
        body: JSON.stringify({ size, email: address.trim() }),
      });
      setState("sent");
    } catch (submitError) {
      setState("idle");
      setError(submitError instanceof Error ? submitError.message : "Could not save this. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] pt-4">
      <span className="fr-mono fr-muted">Tell me when it&apos;s back</span>
      <div className="flex flex-wrap gap-5" role="group" aria-label="Size you are waiting for">
        {soldOutSizes.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSize(option)}
            aria-pressed={size === option}
            className={`fr-choice fr-word min-h-11 min-w-10 text-[1.75rem]! ${size === option ? "is-active" : ""}`}
          >
            {option}
          </button>
        ))}
      </div>
      <label className="fr-field">
        <span>Email</span>
        <input
          type="email"
          value={address}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          inputMode="email"
        />
      </label>
      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-5">
        <button type="button" onClick={() => void submit()} disabled={state === "sending"} className="fr-button w-auto! px-8">
          {state === "sending" ? "Saving…" : "Tell me"}
        </button>
        <span className="fr-mono fr-muted">One email, only for this size.</span>
      </div>
    </div>
  );
}
