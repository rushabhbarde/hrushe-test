"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function HomepageNewsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setMessage("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await apiRequest<{ message: string }>("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, source: "homepage" }),
      });
      setEmail("");
      setMessage(response.message || "You are on the list.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={subscribe} className="mt-7 max-w-xl">
      <label htmlFor="homepage-email" className="sr-only">Email address</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="homepage-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="min-h-12 flex-1 border border-[var(--border)] bg-transparent px-4 outline-none"
        />
        <button type="submit" disabled={submitting} className="button-primary min-h-12 px-7 text-xs font-semibold uppercase tracking-[0.12em] disabled:opacity-60">
          {submitting ? "Joining…" : "Join the list"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-[var(--muted)]" aria-live="polite">{message}</p> : null}
    </form>
  );
}
