"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useStorefrontData } from "@/lib/use-storefront";

export default function AdminInventoryPage() {
  const { products, loading } = useStorefrontData();
  const trackedProducts = products.filter((product) => product.trackInventory);
  const variants = trackedProducts.flatMap((product) =>
    (product.variants || []).map((variant) => ({ product, variant }))
  );
  const totalAvailable = variants.reduce((sum, row) => sum + row.variant.stock, 0);
  const totalReserved = variants.reduce((sum, row) => sum + (row.variant.reserved || 0), 0);
  const lowStock = variants.filter(
    (row) => row.variant.active && row.variant.stock > 0 && row.variant.stock <= 5
  );
  const soldOut = variants.filter((row) => row.variant.active && row.variant.stock === 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalog"
          title="Inventory overview"
          description="Stock is tracked by product, size, and color. Checkout reservations are temporary and release automatically when payment is not completed."
          actions={
            <Link href="/admin/products" className="button-primary px-5 py-3 text-sm font-medium">
              Manage products
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tracked products" value={String(trackedProducts.length)} />
          <Metric label="Available units" value={String(totalAvailable)} />
          <Metric label="Reserved at checkout" value={String(totalReserved)} />
          <Metric label="Low-stock variants" value={String(lowStock.length)} />
        </div>

        <AdminPanel>
          <AdminSubhead
            title="Variant stock"
            description="Edit quantities and SKUs inside each product. This view keeps the operational picture concise."
          />
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading inventory...</p>
          ) : variants.length === 0 ? (
            <div className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] p-5">
              <p className="font-semibold">No tracked inventory yet.</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Open a product, enable variant stock, then add an SKU and quantity for each size and color.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Variant</th>
                    <th className="px-3 py-3 font-medium">SKU</th>
                    <th className="px-3 py-3 font-medium">Available</th>
                    <th className="px-3 py-3 font-medium">Reserved</th>
                    <th className="px-3 py-3 font-medium">State</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map(({ product, variant }) => {
                    const state = !variant.active
                      ? "Paused"
                      : variant.stock === 0
                        ? "Sold out"
                        : variant.stock <= 5
                          ? "Low stock"
                          : "In stock";
                    return (
                      <tr key={`${product.id}-${variant.sku}-${variant.size}-${variant.color}`} className="border-b border-[var(--border)]">
                        <td className="px-3 py-4 font-semibold">{product.name}</td>
                        <td className="px-3 py-4 text-[var(--muted)]">{variant.color || "Default"} / {variant.size || "OS"}</td>
                        <td className="px-3 py-4 font-mono text-xs">{variant.sku || "Not set"}</td>
                        <td className="px-3 py-4 font-semibold">{variant.stock}</td>
                        <td className="px-3 py-4">{variant.reserved || 0}</td>
                        <td className="px-3 py-4">
                          <AdminBadge tone={state === "In stock" ? "success" : state === "Low stock" ? "warning" : "accent"}>
                            {state}
                          </AdminBadge>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <Link href={`/admin/products/${product.id}`} className="underline underline-offset-4">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>

        {soldOut.length > 0 ? (
          <AdminPanel>
            <AdminSubhead
              title="Restock attention"
              description={`${soldOut.length} active variant${soldOut.length === 1 ? " is" : "s are"} currently unavailable.`}
            />
          </AdminPanel>
        ) : null}
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <AdminPanel>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </AdminPanel>
  );
}
