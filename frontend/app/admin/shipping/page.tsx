"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { resolveOrderAdminMeta } from "@/lib/admin-workspace";
import { useAdminData } from "@/lib/use-admin-data";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

export default function AdminShippingPage() {
  const { orders } = useAdminData();
  const { workspace } = useAdminWorkspace();

  const activeShipments = orders.filter((order) =>
    ["Confirmed", "Packed", "Shipped", "Out for delivery"].includes(order.orderStatus)
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Shipping"
          title="Coordinate courier handoff, delivery updates, and return pickups."
          description="A dedicated shipping board for tracking numbers, partner visibility, in-transit updates, and reverse logistics."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Active shipments" value={String(activeShipments.length)} />
          <Metric
            label="Courier partner"
            value={workspace.shipping.defaultCourierPartner}
          />
          <Metric label="Return pickup partner" value={workspace.shipping.returnPickupPartner} />
        </div>

        <AdminPanel>
          <AdminSubhead title="Shipment board" description="Open any order to manage updates, tracking, and refund decisions." />
          <div className="space-y-3">
            {activeShipments.map((order) => {
              const meta = resolveOrderAdminMeta(workspace, order);

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)] lg:grid-cols-[140px_1fr_160px_180px]"
                >
                  <div>
                    <p className="text-sm font-semibold">#{order.orderNumber || order.id.slice(-6)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.courierName || workspace.shipping.defaultCourierPartner}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{order.trackingId || "Tracking number pending"}</p>
                    {order.trackingUrl ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">Tracking URL ready</p>
                    ) : null}
                  </div>
                  <div>
                    <AdminBadge tone="accent">{meta.shippingStatus}</AdminBadge>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {meta.shippingUpdates.length} update{meta.shippingUpdates.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Return pickup</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {meta.returnPickupTracking || "Not created"}
                    </p>
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

