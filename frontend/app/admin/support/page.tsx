"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import {
  formatAdminDate,
  type AdminSupportRequest,
} from "@/lib/admin";
import { adminRoleDefinitions, type AdminRoleId } from "@/lib/admin-workspace";
import { apiRequest } from "@/lib/api";
import type { SupportCategory } from "@/lib/account";

type StatusFilter = "all" | AdminSupportRequest["status"];
type PriorityFilter = "all" | NonNullable<AdminSupportRequest["priority"]>;

const statusOptions: Array<{ value: AdminSupportRequest["status"]; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "waiting-customer", label: "Waiting customer" },
  { value: "resolved", label: "Resolved" },
];

const priorityOptions: Array<{
  value: NonNullable<AdminSupportRequest["priority"]>;
  label: string;
}> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const categoryLabels: Record<SupportCategory, string> = {
  "track-order": "Order tracking",
  "return-request": "Return request",
  "exchange-request": "Exchange request",
  "login-help": "Login help",
  "signup-help": "Signup help",
  "payment-refund": "Payment/refund",
  "product-size": "Product/size",
  "coupon-sale": "Coupon/sale",
  "website-issue": "Website issue",
  "contact-support": "General support",
  other: "Other",
};

const assignedRoleLabels: Record<AdminRoleId | "", string> = {
  "": "Unassigned",
  "super-admin": "Super Admin",
  "brand-growth-manager": "Brand & Growth",
  "operations-manager": "Operations",
  "catalog-manager": "Catalog",
};

function getInitialSearchParam(name: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get(name) || "";
}

function statusTone(status: AdminSupportRequest["status"]) {
  if (status === "resolved") {
    return "success";
  }

  if (status === "in-progress" || status === "waiting-customer") {
    return "accent";
  }

  return "default";
}

function priorityTone(priority?: AdminSupportRequest["priority"]) {
  if (priority === "urgent" || priority === "high") {
    return "warning";
  }

  if (priority === "normal") {
    return "accent";
  }

  return "default";
}

function buildSupportQuery({
  status,
  priority,
  query,
}: {
  status: StatusFilter;
  priority: PriorityFilter;
  query: string;
}) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (priority !== "all") {
    params.set("priority", priority);
  }

  if (query.trim()) {
    params.set("query", query.trim());
  }

  const serialized = params.toString();
  return serialized ? `/support/requests?${serialized}` : "/support/requests";
}

export default function AdminSupportPage() {
  const { pushToast } = useToast();
  const [tickets, setTickets] = useState<AdminSupportRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    () => (getInitialSearchParam("status") as StatusFilter) || "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(
    () => (getInitialSearchParam("priority") as PriorityFilter) || "all"
  );
  const [query, setQuery] = useState(() => getInitialSearchParam("query"));
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [updatingTicketId, setUpdatingTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const metrics = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status !== "resolved").length;
    const urgent = tickets.filter(
      (ticket) => ticket.priority === "urgent" || ticket.priority === "high"
    ).length;
    const chatbot = tickets.filter((ticket) => ticket.source === "chatbot").length;

    return { open, urgent, chatbot };
  }, [tickets]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    void apiRequest<AdminSupportRequest[]>(
      buildSupportQuery({ status: statusFilter, priority: priorityFilter, query })
    )
      .then((data) => {
        if (active) {
          setTickets(data);
          setNoteDrafts((current) => {
            const next = { ...current };
            data.forEach((ticket) => {
              if (next[ticket.id] === undefined) {
                next[ticket.id] = ticket.resolutionNote || "";
              }
            });
            return next;
          });
        }
      })
      .catch(() => {
        if (active) {
          setTickets([]);
          pushToast("Could not load support tickets", "error");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [priorityFilter, pushToast, query, statusFilter]);

  async function updateTicket(
    ticket: AdminSupportRequest,
    payload: Partial<Pick<AdminSupportRequest, "status" | "priority" | "assignedRole" | "resolutionNote">>
  ) {
    setUpdatingTicketId(ticket.id);

    try {
      const updatedTicket = await apiRequest<AdminSupportRequest>(
        `/support/requests/${ticket.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setTickets((current) =>
        current.map((item) => (item.id === updatedTicket.id ? updatedTicket : item))
      );
      setNoteDrafts((current) => ({
        ...current,
        [updatedTicket.id]: updatedTicket.resolutionNote || "",
      }));
      pushToast("Support ticket updated");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Could not update support ticket",
        "error"
      );
    } finally {
      setUpdatingTicketId("");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Support"
          title="Customer issues in one queue."
          description="Chatbot tickets, account support requests, customer contact details, order context, routing role, and resolution notes are managed here."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <AdminMetricCard
            label="Open queue"
            value={String(metrics.open)}
            detail="Tickets not yet resolved."
            tone={metrics.open > 0 ? "accent" : "success"}
          />
          <AdminMetricCard
            label="High priority"
            value={String(metrics.urgent)}
            detail="Return, refund, urgent, or manually escalated issues."
            tone={metrics.urgent > 0 ? "warning" : "default"}
          />
          <AdminMetricCard
            label="From chatbot"
            value={String(metrics.chatbot)}
            detail="Tickets created through the storefront widget."
          />
        </div>

        <AdminPanel>
          <AdminSubhead
            title="Ticket filters"
            description="Search by customer, email, order reference, subject, or issue details."
          />
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tickets"
              className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm outline-none"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm outline-none"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
              className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm outline-none"
            >
              <option value="all">All priorities</option>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminSubhead
            title="Support inbox"
            description="Operations owns this queue, while tickets can be tagged for Brand/Growth or Catalog follow-up."
          />

          <div className="mt-5 space-y-4">
            {tickets.map((ticket) => {
              const contactName =
                ticket.customerName || ticket.userId?.name || "Customer";
              const contactEmail = ticket.customerEmail || ticket.userId?.email || "";
              const currentNote = noteDrafts[ticket.id] ?? ticket.resolutionNote ?? "";
              const roleValue = ticket.assignedRole || "";

              return (
                <article
                  key={ticket.id}
                  className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 lg:px-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminBadge tone="accent">{ticket.ticketCode || "Ticket"}</AdminBadge>
                        <AdminBadge>{categoryLabels[ticket.category] || ticket.category}</AdminBadge>
                        <AdminBadge tone={priorityTone(ticket.priority)}>
                          {ticket.priority || "normal"}
                        </AdminBadge>
                        <AdminBadge tone={statusTone(ticket.status)}>{ticket.status}</AdminBadge>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                        {ticket.subject}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {contactName}
                        {contactEmail ? ` · ${contactEmail}` : ""}
                        {ticket.customerPhone ? ` · ${ticket.customerPhone}` : ""}
                        {" · "}
                        {formatAdminDate(ticket.createdAt)}
                      </p>
                      <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-[var(--foreground)]">
                        {ticket.message}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {ticket.source ? <AdminBadge>Source: {ticket.source}</AdminBadge> : null}
                        {ticket.orderId ? <AdminBadge>Order/ref: {ticket.orderId}</AdminBadge> : null}
                        <AdminBadge>
                          Routed: {assignedRoleLabels[roleValue as AdminRoleId | ""] || roleValue}
                        </AdminBadge>
                      </div>
                    </div>

                    <div className="grid min-w-[260px] gap-3">
                      <select
                        value={ticket.status}
                        disabled={updatingTicketId === ticket.id}
                        onChange={(event) =>
                          void updateTicket(ticket, {
                            status: event.target.value as AdminSupportRequest["status"],
                          })
                        }
                        className="min-h-11 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-3 text-sm outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={ticket.priority || "normal"}
                        disabled={updatingTicketId === ticket.id}
                        onChange={(event) =>
                          void updateTicket(ticket, {
                            priority: event.target.value as AdminSupportRequest["priority"],
                          })
                        }
                        className="min-h-11 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-3 text-sm outline-none"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={roleValue}
                        disabled={updatingTicketId === ticket.id}
                        onChange={(event) =>
                          void updateTicket(ticket, {
                            assignedRole: event.target.value as AdminRoleId | "",
                          })
                        }
                        className="min-h-11 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-3 text-sm outline-none"
                      >
                        <option value="">Unassigned</option>
                        {adminRoleDefinitions.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {ticket.transcript?.length ? (
                    <details className="mt-5 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] px-4 py-3">
                      <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">
                        Chatbot transcript
                      </summary>
                      <div className="mt-3 space-y-2">
                        {ticket.transcript.map((entry, index) => (
                          <p
                            key={`${entry.role}-${index}`}
                            className="text-sm leading-6 text-[var(--muted)]"
                          >
                            <span className="font-semibold text-[var(--foreground)]">
                              {entry.role}:
                            </span>{" "}
                            {entry.message}
                          </p>
                        ))}
                      </div>
                    </details>
                  ) : null}

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                        Resolution note
                      </span>
                      <textarea
                        value={currentNote}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [ticket.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-2 w-full resize-none border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 py-3 text-sm leading-6 outline-none"
                        placeholder="Add the latest response or internal resolution summary."
                      />
                    </label>
                    <button
                      type="button"
                      disabled={updatingTicketId === ticket.id}
                      onClick={() => void updateTicket(ticket, { resolutionNote: currentNote })}
                      className="button-primary min-h-12 px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingTicketId === ticket.id ? "Saving..." : "Save note"}
                    </button>
                  </div>
                </article>
              );
            })}

            {isLoading ? (
              <p className="text-sm text-[var(--muted)]">Loading support tickets...</p>
            ) : null}
            {!isLoading && !tickets.length ? (
              <p className="text-sm text-[var(--muted)]">No support tickets found.</p>
            ) : null}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
