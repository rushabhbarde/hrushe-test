"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useToast } from "@/components/toast-provider";
import { apiRequest } from "@/lib/api";
import type { SupportCategory } from "@/lib/account";

type IssueOption = {
  value: SupportCategory;
  label: string;
  hint: string;
  prompt: string;
  needsOrder?: boolean;
};

type TicketResponse = {
  message: string;
  request: {
    id: string;
    ticketCode?: string;
  };
};

const issueOptions: IssueOption[] = [
  {
    value: "track-order",
    label: "Where’s my order",
    hint: "Delivery or tracking",
    prompt: "Share your order number and what you’re seeing.",
    needsOrder: true,
  },
  {
    value: "return-request",
    label: "Return",
    hint: "Send a piece back",
    prompt: "Tell us which piece you’d like to return and why.",
    needsOrder: true,
  },
  {
    value: "exchange-request",
    label: "Exchange",
    hint: "Another size or colour",
    prompt: "Tell us the piece and the size or colour you’d like instead.",
    needsOrder: true,
  },
  {
    value: "payment-refund",
    label: "Payment or refund",
    hint: "Charges and refunds",
    prompt: "Tell us what happened with the payment or refund.",
    needsOrder: true,
  },
  {
    value: "product-size",
    label: "Size or fit",
    hint: "Before you buy",
    prompt: "Ask about fit, size, fabric or stock.",
  },
  {
    value: "login-help",
    label: "Signing in",
    hint: "Mobile code or account",
    prompt: "Tell us what happens when you try to sign in.",
  },
  {
    value: "other",
    label: "Something else",
    hint: "Anything at all",
    prompt: "Tell us how we can help.",
  },
];

const CONTACT_EMAIL = "team@hrushe.in";
const CONTACT_PHONE = "+91 91128 54988";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  orderId: "",
  message: "",
};

function buildSubject(option: IssueOption | null) {
  return option ? `${option.label} support request` : "Support request";
}

export function SupportChatbot() {
  const pathname = usePathname();
  const { user, isChecking } = useCustomerAuth();
  const { pushToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<SupportCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [ticketCode, setTicketCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption =
    issueOptions.find((option) => option.value === selectedValue) || null;
  const shouldHide = pathname.startsWith("/admin") || pathname.startsWith("/checkout");

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    const openSupport = () => setIsOpen(true);

    window.addEventListener("hrushe:open-support", openSupport);

    return () => {
      window.removeEventListener("hrushe:open-support", openSupport);
    };
  }, []);

  if (shouldHide) {
    return null;
  }

  // No floating button: the help sheet opens from Menu → Help, the homes and the Contact page.
  if (!isOpen) {
    return null;
  }

  async function submitTicket() {
    if (!selectedOption) {
      pushToast("Choose what you need help with", "error");
      return;
    }

    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 12) {
      pushToast("Add your contact details and issue summary", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<TicketResponse>("/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          category: selectedOption.value,
          subject: buildSubject(selectedOption),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          orderId: form.orderId,
          message: form.message,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
          transcript: [
            {
              role: "bot",
              message: "Welcome to HRUSHE support. What can we help with?",
            },
            {
              role: "customer",
              message: selectedOption.label,
            },
            {
              role: "bot",
              message: selectedOption.prompt,
            },
            {
              role: "customer",
              message: form.message,
            },
          ],
        }),
      });

      const nextTicketCode = response.request.ticketCode || "your ticket";
      setTicketCode(nextTicketCode);
      setForm(emptyForm);
      setSelectedValue(null);
      pushToast(`Support ticket ${nextTicketCode} created`);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Could not create support ticket",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const close = () => {
    setIsOpen(false);
    setTicketCode("");
    setSelectedValue(null);
  };
  const step = ticketCode ? "sent" : selectedOption ? "form" : "topics";
  const fieldClass =
    "w-full border-0 border-b border-[color-mix(in_srgb,var(--foreground)_30%,transparent)] bg-transparent py-3 text-base outline-none focus:border-[var(--foreground)]";
  const field = (label: string, input: React.ReactNode) => (
    <label className="flex flex-col gap-1">
      <span className="fr-mono fr-muted">{label}</span>
      {input}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[115]" role="presentation">
      <button type="button" aria-label="Close help" onClick={close} className="absolute inset-0 bg-black/30" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-panel-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-[var(--background)] text-[var(--foreground)] sm:max-w-[460px]"
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <span className="fr-mono fr-muted">HRUSHE · Help</span>
          <button type="button" onClick={close} className="fr-mono fr-choice is-active min-h-11" autoFocus>
            Close ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
          {step === "topics" ? (
            <div className="flex flex-col gap-6">
              <h2 id="support-panel-title" className="fr-word text-[clamp(2.5rem,9vw,3.25rem)]">
                How can we help?
              </h2>
              <nav aria-label="Help topics" className="flex flex-col">
                {issueOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedValue(option.value)}
                    className="fr-index-row is-active grid-cols-[minmax(0,1fr)_auto]! py-3! text-left"
                  >
                    <span className="flex flex-col gap-1">
                      <span className="fr-word text-[1.6rem]!">{option.label}</span>
                      <span className="fr-mono fr-muted">{option.hint}</span>
                    </span>
                    <span className="fr-mono" aria-hidden="true">
                      →
                    </span>
                  </button>
                ))}
              </nav>
              <div className="flex flex-col gap-2">
                <span className="fr-mono fr-muted">Or reach us directly · Mon–Sat, 10–7</span>
                <a href={`mailto:${CONTACT_EMAIL}`} className="fr-mono fr-link self-start normal-case!">
                  {CONTACT_EMAIL}
                </a>
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="fr-mono fr-link self-start">
                  {CONTACT_PHONE}
                </a>
              </div>
            </div>
          ) : null}

          {step === "form" && selectedOption ? (
            <form
              className="flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitTicket();
              }}
            >
              <button type="button" onClick={() => setSelectedValue(null)} className="fr-mono fr-choice fr-link is-active self-start">
                ← All topics
              </button>
              <h2 id="support-panel-title" className="fr-word text-[clamp(2.25rem,8vw,3rem)]">
                {selectedOption.label}.
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {selectedOption.prompt} Never share OTPs, passwords or card details.
              </p>
              {field(
                "Name",
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  autoComplete="name"
                  disabled={Boolean(user) || isChecking}
                  className={fieldClass}
                  required
                />
              )}
              {field(
                "Email for our reply",
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  autoComplete="email"
                  disabled={Boolean(user) || isChecking}
                  className={fieldClass}
                  required
                />
              )}
              {field(
                "Phone (optional)",
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  autoComplete="tel"
                  className={fieldClass}
                />
              )}
              {selectedOption.needsOrder
                ? field(
                    "Order number",
                    <input
                      value={form.orderId}
                      onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}
                      className={fieldClass}
                    />
                  )
                : null}
              {field(
                "Message",
                <textarea
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  rows={4}
                  className={`${fieldClass} resize-none leading-6`}
                  required
                />
              )}
              <button type="submit" disabled={isSubmitting} className="fr-button mt-2">
                {isSubmitting ? "Sending…" : "Send"}
              </button>
            </form>
          ) : null}

          {step === "sent" ? (
            <div className="flex flex-col gap-5">
              <h2 id="support-panel-title" className="fr-word text-[clamp(3rem,11vw,4rem)]">
                Sent.
              </h2>
              <p className="fr-mono">Ticket · {ticketCode}</p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                We usually reply by email within one business day. Keep the ticket number for follow-ups.
              </p>
              <button type="button" onClick={close} className="fr-button">
                Done
              </button>
              <button type="button" onClick={() => setTicketCode("")} className="fr-mono fr-choice fr-link is-active self-start">
                Ask something else
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
