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
    label: "Track order",
    hint: "Delivery or tracking status",
    prompt: "Share your order number or tracking issue.",
    needsOrder: true,
  },
  {
    value: "return-request",
    label: "Return",
    hint: "Start a return request",
    prompt: "Tell us what you want to return and why.",
    needsOrder: true,
  },
  {
    value: "exchange-request",
    label: "Exchange",
    hint: "Size or piece exchange",
    prompt: "Share the item and size/color you want to exchange.",
    needsOrder: true,
  },
  {
    value: "login-help",
    label: "Login",
    hint: "Access your account",
    prompt: "Describe what happens when you try to log in.",
  },
  {
    value: "signup-help",
    label: "Signup",
    hint: "Create an account",
    prompt: "Tell us where signup is getting stuck.",
  },
  {
    value: "payment-refund",
    label: "Payment/refund",
    hint: "Payment or refund issue",
    prompt: "Share payment, refund, or checkout details.",
    needsOrder: true,
  },
  {
    value: "product-size",
    label: "Product/size",
    hint: "Fit, stock, or details",
    prompt: "Ask about fit, size, product details, or stock.",
  },
  {
    value: "coupon-sale",
    label: "Coupon/sale",
    hint: "Offer or sale help",
    prompt: "Tell us which coupon or offer is not working.",
  },
  {
    value: "website-issue",
    label: "Website issue",
    hint: "Page or checkout bug",
    prompt: "Describe the page or button that is not working.",
  },
  {
    value: "other",
    label: "Other",
    hint: "Anything else",
    prompt: "Tell us what you need help with.",
  },
];

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
  const shouldClearStickyAction =
    pathname.startsWith("/product/") || pathname === "/cart" || pathname === "/checkout";

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

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 z-[112] grid h-14 w-14 place-items-center bg-black text-white lg:hidden ${
          shouldClearStickyAction
            ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
            : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
        }`}
        aria-label="Open HRUSHE support"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6.5 8.5h13.5c1.4 0 2.5 1.1 2.5 2.5v7.5c0 1.4-1.1 2.5-2.5 2.5h-7.2L8.2 25v-4H6.5C5.1 21 4 19.9 4 18.5V11c0-1.4 1.1-2.5 2.5-2.5Z" />
          <path d="M23 13h2.5c1.4 0 2.5 1.1 2.5 2.5V23c0 1.4-1.1 2.5-2.5 2.5h-1.7v3.2L20.2 25.5H16" />
        </svg>
      </button>
    );
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

  return (
    <div
      className={`fixed right-4 z-[115] sm:bottom-6 sm:right-6 ${
        shouldClearStickyAction
          ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="support-panel-title"
        data-support-panel-version="refined"
        className="w-[calc(100vw-2rem)] max-w-[430px] overflow-hidden rounded-lg border border-black/15 bg-[#f7f5ef] text-black shadow-[0_28px_70px_rgba(0,0,0,0.24)]"
      >
        <div className="border-b border-black/10 bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#7b0019]">
                HRUSHE Support
              </p>
              <h2 id="support-panel-title" className="mt-2 text-[1.65rem] font-semibold leading-none">
                What do you need help with?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-black/15 bg-[#f7f5ef] text-base font-semibold transition hover:border-black hover:bg-black hover:text-white"
              aria-label="Close support chat"
            >
              ×
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-black/60 sm:grid-cols-3">
            <span className="rounded-md border border-black/10 bg-[#f7f5ef] px-3 py-2">
              Ticket support
            </span>
            <span className="rounded-md border border-black/10 bg-[#f7f5ef] px-3 py-2">
              Email reply
            </span>
            <span className="col-span-2 rounded-md border border-black/10 bg-[#f7f5ef] px-3 py-2 sm:col-span-1">
              Mon-Sat
            </span>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {ticketCode ? (
            <div className="rounded-lg border border-[#12824a]/25 bg-white px-4 py-4 shadow-[0_12px_26px_rgba(18,130,74,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#12824a]">
                Ticket created
              </p>
              <p className="mt-2 text-2xl font-semibold">{ticketCode}</p>
              <p className="mt-2 text-sm leading-6 text-black/62">
                Our team has this in the support queue. Keep this code for follow-up.
              </p>
              <button
                type="button"
                onClick={() => setTicketCode("")}
                className="mt-4 rounded-md border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
              >
                Create another
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-[#7b0019]/15 bg-white px-4 py-3 text-sm leading-6 text-black/70">
                Choose a topic and we will route it to the right HRUSHE team. Never share OTPs, passwords, or card details.
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {issueOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedValue(option.value)}
                    className={`min-h-[4.25rem] rounded-md border px-3 py-2.5 text-left transition ${
                      selectedValue === option.value
                        ? "border-black bg-black text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                        : "border-black/10 bg-white hover:border-[#7b0019]/45 hover:bg-[#fffaf7]"
                    }`}
                  >
                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.08em]">
                      {option.label}
                    </span>
                    <span
                      className={`mt-1 block text-[0.75rem] leading-4 ${
                        selectedValue === option.value ? "text-white/68" : "text-black/52"
                      }`}
                    >
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>

              {selectedOption ? (
                <div className="mt-5 space-y-3 rounded-lg border border-black/10 bg-white p-4">
                  <div className="rounded-md bg-[#f7f5ef] px-3 py-3 text-sm leading-6 text-black/72">
                    {selectedOption.prompt}
                  </div>

                  <label className="grid gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/55">
                    Name
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      autoComplete="name"
                      disabled={Boolean(user) || isChecking}
                      className="min-h-11 w-full rounded-md border border-black/12 bg-white px-3 text-sm font-normal normal-case tracking-normal text-black outline-none transition focus:border-black disabled:bg-black/[0.03]"
                    />
                  </label>
                  <label className="grid gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/55">
                    Email for updates
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      autoComplete="email"
                      disabled={Boolean(user) || isChecking}
                      className="min-h-11 w-full rounded-md border border-black/12 bg-white px-3 text-sm font-normal normal-case tracking-normal text-black outline-none transition focus:border-black disabled:bg-black/[0.03]"
                    />
                  </label>
                  <label className="grid gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/55">
                    Phone <span className="normal-case tracking-normal">(optional)</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                      autoComplete="tel"
                      className="min-h-11 w-full rounded-md border border-black/12 bg-white px-3 text-sm font-normal normal-case tracking-normal text-black outline-none transition focus:border-black"
                    />
                  </label>
                  {selectedOption.needsOrder ? (
                    <label className="grid gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/55">
                      Order number or tracking ID
                      <input
                        value={form.orderId}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, orderId: event.target.value }))
                        }
                        className="min-h-11 w-full rounded-md border border-black/12 bg-white px-3 text-sm font-normal normal-case tracking-normal text-black outline-none transition focus:border-black"
                      />
                    </label>
                  ) : null}
                  <label className="grid gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/55">
                    Issue details
                    <textarea
                      value={form.message}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, message: event.target.value }))
                      }
                      rows={4}
                      className="w-full resize-none rounded-md border border-black/12 bg-white px-3 py-3 text-sm font-normal normal-case leading-6 tracking-normal text-black outline-none transition focus:border-black"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void submitTicket()}
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#7b0019] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isSubmitting ? "Creating ticket..." : "Create support ticket"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
