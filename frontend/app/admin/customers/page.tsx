"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminFilterInput,
  AdminFilterSelect,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { customerStatusTone, formatAdminCurrency, formatAdminDate, type AdminCustomer } from "@/lib/admin";
import { apiRequest } from "@/lib/api";

export default function AdminCustomersPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") || "";
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [query, setQuery] = useState(queryParam);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    let active = true;

    void apiRequest<AdminCustomer[]>("/admin/customers")
      .then((data) => {
        if (active) {
          setCustomers(data);
        }
      })
      .catch(() => {
        if (active) {
          setCustomers([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = customers.filter((customer) => {
      const matchesQuery =
        !normalizedQuery ||
        [customer.name, customer.email, customer.phone || ""].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    next.sort((left, right) => {
      if (sortBy === "highest-spend") {
        return right.totalSpend - left.totalSpend;
      }
      if (sortBy === "most-orders") {
        return right.orderCount - left.orderCount;
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return next;
  }, [customers, query, sortBy, statusFilter]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Commerce"
          title="Customer intelligence with account context."
          description="Profiles bring together order history, address readiness, wishlist behavior, size preferences, and communication settings in one CRM-lite view."
        />

        <AdminPanel>
          <AdminSubhead
            title="Customers"
            description="Search by name, email, or phone and scan value, retention risk, and order behavior at a glance."
          />

          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))]">
            <AdminFilterInput
              placeholder="Search customer name, email, phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <AdminFilterSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {["all", "New", "Active", "VIP", "At Risk"].map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All customer statuses" : status}
                </option>
              ))}
            </AdminFilterSelect>
            <AdminFilterSelect value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recent">Recently signed up</option>
              <option value="highest-spend">Highest spend</option>
              <option value="most-orders">Most orders</option>
            </AdminFilterSelect>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {filtered.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="rounded-[1.4rem] border border-[rgba(17,17,17,0.08)] px-5 py-5 transition hover:bg-[rgba(17,17,17,0.02)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(214,31,38,0.08)] font-semibold text-[var(--accent)]">
                      {customer.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-base font-semibold tracking-[-0.02em]">{customer.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{customer.email}</p>
                    </div>
                  </div>
                  <AdminBadge tone={customerStatusTone(customer.status)}>{customer.status}</AdminBadge>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCell label="Spend" value={formatAdminCurrency(customer.totalSpend)} />
                  <SummaryCell label="Orders" value={String(customer.orderCount)} />
                  <SummaryCell label="Wishlist" value={String(customer.wishlist.length)} />
                  <SummaryCell label="Last order" value={formatAdminDate(customer.lastOrderDate)} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {customer.preferences.preferredSize ? (
                    <AdminBadge>Size {customer.preferences.preferredSize}</AdminBadge>
                  ) : null}
                  {customer.preferences.preferredFit ? (
                    <AdminBadge tone="accent">{customer.preferences.preferredFit}</AdminBadge>
                  ) : null}
                  {customer.addresses.length ? (
                    <AdminBadge>{customer.addresses.length} addresses</AdminBadge>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-[rgba(17,17,17,0.08)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
