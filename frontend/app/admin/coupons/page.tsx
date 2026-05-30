"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
  AdminSwitch,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { type CouponRecord } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

function createCoupon(): CouponRecord {
  return {
    id: `coupon-${Date.now()}`,
    code: "",
    title: "",
    type: "percentage",
    value: 0,
    expiresAt: null,
    usageLimit: 100,
    usedCount: 0,
    active: true,
    customerEmail: "",
  };
}

export default function AdminCouponsPage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [draft, setDraft] = useState<CouponRecord>(createCoupon());

  const activeCoupons = useMemo(
    () => workspace.coupons.filter((coupon) => coupon.active),
    [workspace.coupons]
  );

  async function saveCoupon() {
    if (!draft.code.trim() || !draft.title.trim()) {
      pushToast("Coupon code and title are required.", "error");
      return;
    }

    const nextCoupons = [...workspace.coupons];
    const existingIndex = nextCoupons.findIndex((coupon) => coupon.id === draft.id);

    if (existingIndex >= 0) {
      nextCoupons[existingIndex] = draft;
    } else {
      nextCoupons.unshift(draft);
    }

    await saveWorkspace({ coupons: nextCoupons });
    setDraft(createCoupon());
    pushToast("Coupon saved.");
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Coupons & promotions"
          title="Launch discounts with clean rules and luxury restraint."
          description="Create percentage, flat, and free-shipping offers with expiry windows, usage caps, and customer targeting."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Active coupons" value={String(activeCoupons.length)} />
          <Metric label="Customer-specific offers" value={String(workspace.coupons.filter((coupon) => coupon.customerEmail).length)} />
          <Metric label="Average usage" value={String(Math.round(workspace.coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0) / Math.max(workspace.coupons.length, 1)))} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <AdminPanel>
            <AdminSubhead title="Create coupon" description="Build new launch offers without leaving the dashboard." />
            <div className="grid gap-4">
              <AdminField label="Coupon title">
                <AdminFilterInput value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
              </AdminField>
              <AdminField label="Coupon code">
                <AdminFilterInput value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
              </AdminField>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Discount type">
                  <select
                    value={draft.type}
                    onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as CouponRecord["type"] }))}
                    className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat discount</option>
                    <option value="free-shipping">Free shipping</option>
                  </select>
                </AdminField>
                <AdminField label="Value">
                  <AdminFilterInput
                    value={String(draft.value)}
                    onChange={(event) => setDraft((current) => ({ ...current, value: Number(event.target.value) || 0 }))}
                    inputMode="numeric"
                  />
                </AdminField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Expiry date">
                  <AdminFilterInput
                    type="datetime-local"
                    value={draft.expiresAt?.slice(0, 16) || ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        expiresAt: event.target.value ? new Date(event.target.value).toISOString() : null,
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Usage limit">
                  <AdminFilterInput
                    value={String(draft.usageLimit)}
                    onChange={(event) => setDraft((current) => ({ ...current, usageLimit: Number(event.target.value) || 0 }))}
                    inputMode="numeric"
                  />
                </AdminField>
              </div>
              <AdminField label="Customer-specific email" hint="Leave blank for a public coupon.">
                <AdminFilterInput value={draft.customerEmail} onChange={(event) => setDraft((current) => ({ ...current, customerEmail: event.target.value }))} />
              </AdminField>
              <AdminSwitch
                checked={draft.active}
                onChange={(checked) => setDraft((current) => ({ ...current, active: checked }))}
                label="Enable coupon"
                description="Disabled coupons remain saved but won’t appear as active offers."
              />
              <button type="button" onClick={() => void saveCoupon()} className="button-primary px-5 py-3 text-sm font-medium">
                Save coupon
              </button>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="Promotion list" description="Review active, expiring, and targeted offers." />
            <div className="space-y-3">
              {workspace.coupons.map((coupon) => (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() => setDraft(coupon)}
                  className="flex w-full items-start justify-between gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 text-left transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{coupon.title}</p>
                      <AdminBadge tone={coupon.active ? "success" : "warning"}>
                        {coupon.active ? "Active" : "Paused"}
                      </AdminBadge>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{coupon.code}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {coupon.type === "percentage"
                        ? `${coupon.value}% off`
                        : coupon.type === "flat"
                          ? `Rs. ${coupon.value} off`
                          : "Free shipping"}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Usage {coupon.usedCount}/{coupon.usageLimit}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    <p>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("en-IN") : "No expiry"}</p>
                    <p className="mt-2">{coupon.customerEmail || "All customers"}</p>
                  </div>
                </button>
              ))}
            </div>
          </AdminPanel>
        </div>
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

