"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminKeyValue,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { customerStatusTone, formatAdminCurrency, formatAdminDate, type AdminCustomerDetail } from "@/lib/admin";
import { apiRequest } from "@/lib/api";
import { formatOrderDate } from "@/lib/orders";

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);

  useEffect(() => {
    let active = true;

    void apiRequest<AdminCustomerDetail>(`/admin/customers/${params.id}`)
      .then((data) => {
        if (active) {
          setCustomer(data);
        }
      })
      .catch(() => {
        if (active) {
          setCustomer(null);
        }
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  if (!customer) {
    return (
      <AdminShell>
        <AdminPanel>
          <p className="text-sm text-[var(--muted)]">Customer not found.</p>
        </AdminPanel>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Customer detail"
          title={customer.name}
          description="One profile for support, retention, and operational context across orders, addresses, preferences, and saved products."
          actions={
            <>
              <Link href="/admin/customers" className="button-secondary rounded-full px-5 py-3 text-sm font-medium">
                Back to customers
              </Link>
            </>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
          <AdminPanel>
            <AdminSubhead title="Profile snapshot" description="Core identity, signup details, and customer quality markers." />
            <div className="grid gap-5 md:grid-cols-2">
              <AdminKeyValue label="Email" value={customer.email} />
              <AdminKeyValue label="Phone" value={customer.phone || "—"} />
              <AdminKeyValue label="Signup" value={formatAdminDate(customer.createdAt)} />
              <AdminKeyValue
                label="Status"
                value={<AdminBadge tone={customerStatusTone(customer.status)}>{customer.status}</AdminBadge>}
              />
              <AdminKeyValue label="Gender" value={customer.gender || "—"} />
              <AdminKeyValue label="Date of birth" value={formatAdminDate(customer.dateOfBirth)} />
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="Value & behavior" description="Order quality, repeat buying, and preference signals." />
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricMini label="Total spend" value={formatAdminCurrency(customer.totalSpend)} />
              <MetricMini label="Total orders" value={String(customer.orderCount)} />
              <MetricMini label="Avg order value" value={formatAdminCurrency(customer.averageOrderValue)} />
              <MetricMini label="Wishlist count" value={String(customer.wishlist.length)} />
              <MetricMini label="Preferred size" value={customer.preferences.preferredSize || "—"} />
              <MetricMini label="Preferred fit" value={customer.preferences.preferredFit || "—"} />
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
          <AdminPanel>
            <AdminSubhead title="Addresses" description="Saved checkout destinations." />
            <div className="space-y-3">
              {customer.addresses.length ? (
                customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{address.label}</p>
                      {address.isDefault ? <AdminBadge tone="accent">Default</AdminBadge> : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      {[address.house, address.area, address.city, address.state, address.pincode]
                        .filter(Boolean)
                        .join(", ") || "Address details not filled yet."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No saved addresses yet.</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="Wishlist" description="Saved products tied to future intent." />
            <div className="space-y-3">
              {customer.wishlist.length ? (
                customer.wishlist.map((item) => (
                  <div key={item.id} className="rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{item.category}</p>
                    <p className="mt-3 text-sm font-medium">{formatAdminCurrency(item.price)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No wishlist products saved.</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="Communication" description="Email and post-purchase preferences from the account side." />
            <div className="space-y-4">
              <AdminKeyValue label="Email notifications" value={customer.communicationPreferences.emailNotifications ? "On" : "Off"} />
              <AdminKeyValue label="WhatsApp order updates" value={customer.communicationPreferences.whatsappOrderUpdates ? "On" : "Off"} />
              <AdminKeyValue label="Marketing messages" value={customer.communicationPreferences.marketingMessages ? "On" : "Off"} />
              <AdminKeyValue label="Favorite colors" value={customer.preferences.favoriteColors.join(", ") || "—"} />
            </div>
          </AdminPanel>
        </div>

        <AdminPanel>
          <AdminSubhead title="Order history" description="Full customer-linked order timeline for support and repeat buying analysis." />
          <div className="grid gap-3 xl:grid-cols-2">
            {customer.orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4 transition hover:bg-[rgba(17,17,17,0.02)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold tracking-[-0.02em]">
                      Order #{order.orderNumber || order.id.slice(-6)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatOrderDate(order.createdAt)}</p>
                  </div>
                  <AdminBadge tone={order.orderStatus === "Delivered" ? "success" : "default"}>
                    {order.orderStatus}
                  </AdminBadge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <AdminKeyValue label="Payment" value={order.paymentStatus} />
                  <AdminKeyValue label="Method" value={order.paymentMethod} />
                  <AdminKeyValue label="Value" value={formatAdminCurrency(order.totalAmount)} />
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[rgba(17,17,17,0.08)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}
