"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminBadge, AdminPageHeader, AdminPanel, AdminSubhead } from "@/components/admin-ui";
import { formatAdminDate, type AdminSupportRequest } from "@/lib/admin";
import { apiRequest } from "@/lib/api";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminSupportRequest[]>([]);

  useEffect(() => {
    let active = true;

    void apiRequest<AdminSupportRequest[]>("/support/requests")
      .then((data) => {
        if (active) {
          setTickets(data);
        }
      })
      .catch(() => {
        if (active) {
          setTickets([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Support"
          title="Customer issues in one queue."
          description="Support conversations, linked customers, and order context stay together so the team can resolve issues without bouncing between tools."
        />

        <AdminPanel>
          <AdminSubhead title="Active tickets" description="Linked with customer account data and order context." />
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold tracking-[-0.02em]">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {ticket.userId?.name || "Customer"} · {formatAdminDate(ticket.createdAt)}
                    </p>
                  </div>
                  <AdminBadge tone={ticket.status === "resolved" ? "success" : ticket.status === "in-progress" ? "accent" : "default"}>
                    {ticket.status}
                  </AdminBadge>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{ticket.message}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <AdminBadge>{ticket.category}</AdminBadge>
                  {ticket.userId?.email ? <AdminBadge>{ticket.userId.email}</AdminBadge> : null}
                  {ticket.orderId?.orderNumber ? <AdminBadge>Order #{ticket.orderId.orderNumber}</AdminBadge> : null}
                </div>
              </div>
            ))}
            {!tickets.length ? (
              <p className="text-sm text-[var(--muted)]">No support requests yet.</p>
            ) : null}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
