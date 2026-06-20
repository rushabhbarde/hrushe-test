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
    prompt: "Share your order number or tracking issue.",
    needsOrder: true,
  },
  {
    value: "return-request",
    label: "Return",
    prompt: "Tell us what you want to return and why.",
    needsOrder: true,
  },
  {
    value: "exchange-request",
    label: "Exchange",
    prompt: "Share the item and size/color you want to exchange.",
    needsOrder: true,
  },
  {
    value: "login-help",
    label: "Login",
    prompt: "Describe what happens when you try to log in.",
  },
  {
    value: "signup-help",
    label: "Signup",
    prompt: "Tell us where signup is getting stuck.",
  },
  {
    value: "payment-refund",
    label: "Payment/refund",
    prompt: "Share payment, refund, or checkout details.",
    needsOrder: true,
  },
  {
    value: "product-size",
    label: "Product/size",
    prompt: "Ask about fit, size, product details, or stock.",
  },
  {
    value: "coupon-sale",
    label: "Coupon/sale",
    prompt: "Tell us which coupon or offer is not working.",
  },
  {
    value: "website-issue",
    label: "Website issue",
    prompt: "Describe the page or button that is not working.",
  },
  {
    value: "other",
    label: "Other",
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
  const shouldHide = pathname.startsWith("/admin");
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

  if (shouldHide) {
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

  return (
    <div
      className={`fixed right-4 z-[65] sm:bottom-6 sm:right-6 ${
        shouldClearStickyAction
          ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
      }`}
    >
      {isOpen ? (
        <div className="mb-4 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden border border-black/10 bg-white text-black shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
          <div className="bg-[#111111] px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/60">
                  HRUSHE Support
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                  Tell us what broke.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center border border-white/20 text-xl"
                aria-label="Close support chat"
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/68">
              No passwords, OTPs, or card details. We will create a ticket and reply by email.
            </p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
            {ticketCode ? (
              <div className="border border-[#12824a]/20 bg-[#12824a]/10 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#12824a]">
                  Ticket created
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                  {ticketCode}
                </p>
                <p className="mt-2 text-sm leading-6 text-black/62">
                  Our team has this in the support queue. Keep this code for follow-up.
                </p>
                <button
                  type="button"
                  onClick={() => setTicketCode("")}
                  className="mt-4 border border-black px-4 py-2 text-xs font-medium uppercase tracking-[0.16em]"
                >
                  Create another
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-t-[1.2rem] rounded-br-[1.2rem] bg-[#f3f0ea] px-4 py-3 text-sm leading-6 text-black/72">
                  Choose the issue type first. I’ll route it to the right HRUSHE team.
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {issueOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedValue(option.value)}
                      className={`min-h-11 border px-3 text-left text-xs font-medium uppercase tracking-[0.12em] transition ${
                        selectedValue === option.value
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white hover:border-black/35"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {selectedOption ? (
                  <div className="mt-5 space-y-3">
                    <div className="rounded-t-[1.2rem] rounded-br-[1.2rem] bg-[#f3f0ea] px-4 py-3 text-sm leading-6 text-black/72">
                      {selectedOption.prompt}
                    </div>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Your name"
                      disabled={Boolean(user) || isChecking}
                      className="min-h-11 w-full border border-black/12 px-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                    />
                    <input
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="Email for updates"
                      disabled={Boolean(user) || isChecking}
                      className="min-h-11 w-full border border-black/12 px-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                    />
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                      placeholder="Phone optional"
                      className="min-h-11 w-full border border-black/12 px-3 text-sm outline-none focus:border-black"
                    />
                    {selectedOption.needsOrder ? (
                      <input
                        value={form.orderId}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, orderId: event.target.value }))
                        }
                        placeholder="Order number or tracking ID"
                        className="min-h-11 w-full border border-black/12 px-3 text-sm outline-none focus:border-black"
                      />
                    ) : null}
                    <textarea
                      value={form.message}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, message: event.target.value }))
                      }
                      placeholder="Describe the issue in detail."
                      rows={4}
                      className="w-full resize-none border border-black/12 px-3 py-3 text-sm leading-6 outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => void submitTicket()}
                      disabled={isSubmitting}
                      className="w-full bg-black px-4 py-3 text-sm font-medium uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isSubmitting ? "Creating ticket..." : "Create support ticket"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex h-12 w-12 items-center justify-center border border-[var(--foreground)] bg-[var(--foreground)] text-sm font-semibold text-[var(--background)]"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close HRUSHE support" : "Open HRUSHE support"}
      >
        <span className="flex h-6 w-6 items-center justify-center border border-white/35">
          ?
        </span>
      </button>
    </div>
  );
}
