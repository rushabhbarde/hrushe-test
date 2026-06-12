"use client";

import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getAdminAuthHeaders } from "@/lib/admin-auth";
import type { ProductReview } from "@/lib/catalog";

type ReviewRow = {
  productId: string;
  productName: string;
  review: ProductReview & { id: string; status: "pending" | "approved" | "rejected" | "hidden" };
};

export default function AdminReviewsPage() {
  const { pushToast } = useToast();
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ reviews: ReviewRow[] }>("/products/admin/reviews", {
      headers: getAdminAuthHeaders(),
    })
      .then((data) => setReviewRows(data.reviews))
      .catch((error) =>
        pushToast(error instanceof Error ? error.message : "Could not load reviews.", "error")
      )
      .finally(() => setLoading(false));
  }, [pushToast]);

  const averageRating =
    reviewRows.reduce((sum, row) => sum + row.review.rating, 0) / Math.max(reviewRows.length, 1);

  async function updateModeration(
    reviewId: string,
    productId: string,
    status: "approved" | "rejected" | "hidden"
  ) {
    try {
      await apiRequest(`/products/${productId}/reviews/${reviewId}`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      setReviewRows((current) =>
        current.map((row) =>
          row.review.id === reviewId
            ? { ...row, review: { ...row.review, status } }
            : row
        )
      );
      pushToast(`Review marked as ${status}.`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not update review.", "error");
    }
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
          <Metric label="Approved reviews" value={String(reviewRows.filter((row) => row.review.status === "approved").length)} />
        </div>

        <AdminPanel>
          <AdminSubhead title="Review moderation queue" description="Each review stays attached to its product so approvals stay commercially relevant." />
          <div className="space-y-3">
            {loading ? <p className="text-sm text-[var(--muted)]">Loading review queue...</p> : null}
            {!loading && reviewRows.length === 0 ? <p className="text-sm text-[var(--muted)]">No reviews are waiting for moderation.</p> : null}
            {reviewRows.map((row) => (
              <div key={row.review.id} className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{row.review.reviewerName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{row.productName}</p>
                    <p className="mt-3 text-sm text-[var(--foreground)]">{row.review.quote}</p>
                    <p className="mt-3 text-xs text-[var(--muted)]">Rating: {row.review.rating}/5</p>
                    {row.review.verifiedPurchase ? <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Verified purchase</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminBadge tone={row.review.status === "approved" ? "success" : row.review.status === "hidden" ? "warning" : "accent"}>
                      {row.review.status}
                    </AdminBadge>
                    <button type="button" onClick={() => void updateModeration(row.review.id, row.productId, "approved")} className="button-secondary px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em]">
                      Approve
                    </button>
                    <button type="button" onClick={() => void updateModeration(row.review.id, row.productId, "rejected")} className="button-secondary px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em]">
                      Reject
                    </button>
                    <button type="button" onClick={() => void updateModeration(row.review.id, row.productId, "hidden")} className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger)]">
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
