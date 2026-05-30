"use client";

import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import {
  buildReviewKey,
  resolveReviewModeration,
} from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";
import { useStorefrontData } from "@/lib/use-storefront";

export default function AdminReviewsPage() {
  const { products } = useStorefrontData();
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();

  const reviewRows = products.flatMap((product) =>
    (product.reviews || []).map((review, index) => ({
      productId: product.id,
      productName: product.name,
      review,
      moderation: resolveReviewModeration(workspace, product.id, review, index),
      reviewKey: buildReviewKey(product.id, review, index),
    }))
  );

  const averageRating =
    reviewRows.reduce((sum, row) => sum + row.review.rating, 0) / Math.max(reviewRows.length, 1);

  async function updateModeration(reviewKey: string, productId: string, status: "approved" | "rejected" | "hidden") {
    await saveWorkspace({
      reviewModeration: {
        ...workspace.reviewModeration,
        [reviewKey]: {
          reviewKey,
          productId,
          status,
        },
      },
    });
    pushToast(`Review marked as ${status}.`);
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Reviews"
          title="Moderate social proof with the same care as the storefront."
          description="Approve, reject, and hide product reviews while keeping a clear ratings overview across the catalog."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Total reviews" value={String(reviewRows.length)} />
          <Metric label="Average rating" value={averageRating.toFixed(1)} />
          <Metric label="Approved reviews" value={String(reviewRows.filter((row) => row.moderation.status === "approved").length)} />
        </div>

        <AdminPanel>
          <AdminSubhead title="Review moderation queue" description="Each review stays attached to its product so approvals stay commercially relevant." />
          <div className="space-y-3">
            {reviewRows.map((row) => (
              <div key={row.reviewKey} className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{row.review.reviewerName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{row.productName}</p>
                    <p className="mt-3 text-sm text-[var(--foreground)]">{row.review.quote}</p>
                    <p className="mt-3 text-xs text-[var(--muted)]">Rating: {row.review.rating}/5</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminBadge tone={row.moderation.status === "approved" ? "success" : row.moderation.status === "hidden" ? "warning" : "accent"}>
                      {row.moderation.status}
                    </AdminBadge>
                    <button type="button" onClick={() => void updateModeration(row.reviewKey, row.productId, "approved")} className="button-secondary px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em]">
                      Approve
                    </button>
                    <button type="button" onClick={() => void updateModeration(row.reviewKey, row.productId, "rejected")} className="button-secondary px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em]">
                      Reject
                    </button>
                    <button type="button" onClick={() => void updateModeration(row.reviewKey, row.productId, "hidden")} className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger)]">
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </AdminPanel>
  );
}

