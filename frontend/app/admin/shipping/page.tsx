"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useAdminData } from "@/lib/use-admin-data";

export default function AdminShippingPage() {
  const { orders } = useAdminData();

  const activeShipments = orders.filter((order) =>
    ["Confirmed", "Packed", "Shipped", "Out for delivery"].includes(order.orderStatus)
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Shipping"
          title="Coordinate courier handoff and delivery updates."
          description="A live shipping board sourced from order status, courier, and tracking details."
        />

        <div className="grid gap-4 md:grid-cols-1">
          <Metric label="Active shipments" value={String(activeShipments.length)} />
        </div>

        <AdminPanel>
          <AdminSubhead title="Shipment board" description="Open any order to manage live status, courier, and tracking details." />
          <div className="space-y-3">
            {activeShipments.map((order) => {
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)] lg:grid-cols-[140px_1fr_180px]"
                >
                  <div>
                    <p className="text-sm font-semibold">#{order.orderNumber || order.id.slice(-6)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.courierName || "Courier not assigned"}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{order.trackingId || "Tracking number pending"}</p>
                    {order.trackingUrl ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">Tracking URL ready</p>
                    ) : null}
                  </div>
                  <div>
                    <AdminBadge tone="accent">{order.orderStatus}</AdminBadge>
                  </div>
                </Link>
              );
            })}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <AdminPanel>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-xl font-semibold tracking-[-0.03em]">{value}</p>
    </AdminPanel>
  );
}
