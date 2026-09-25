"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AccountGuard } from "@/components/account-guard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { OrderTrackingView } from "@/components/order-tracking-view";
import { LoadingState } from "@/components/loading-state";
import type { OrderRecord } from "@/lib/orders";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshCart } = useCart();
  const { pushToast } = useToast();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      try {
        const response = await apiRequest<OrderRecord>(`/order/${params.id}`, {
          cache: "no-store",
        });

        if (active) {
          setOrder(response);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load this order."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      active = false;
    };
  }, [params.id]);

  const handleReorder = async () => {
    if (!order) {
      return;
    }

    setReordering(true);

    try {
      await apiRequest(`/order/${order.id}/reorder`, {
        method: "POST",
      });
      await refreshCart();
      pushToast("Items added to cart");
      router.push("/cart");
    } catch (reorderError) {
      setError(
        reorderError instanceof Error ? reorderError.message : "Could not reorder this order."
      );
      pushToast("Could not reorder", "error");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AccountGuard>
        <main className="px-5 pb-16 pt-6 lg:px-10 lg:pb-24 lg:pt-12">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/account?section=orders" className="fr-mono fr-link">
                ← Wardrobe
              </Link>
              <h1 className="fr-mono fr-muted">Order details</h1>
            </div>

            {loading ? (
              <LoadingState title="Loading your order" description="" />
            ) : error && !order ? (
              <p className="text-sm text-[var(--accent)]" role="alert">
                {error}
              </p>
            ) : order ? (
              <OrderTrackingView
                order={order}
                actions={
                  <>
                    {error ? (
                      <p className="text-sm text-[var(--accent)]" role="alert">
                        {error}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleReorder()}
                      disabled={reordering}
                      className={order.trackingUrl ? "fr-mono fr-choice fr-link is-active self-start" : "fr-button"}
                    >
                      {reordering ? "Adding to bag…" : "Order these again"}
                    </button>
                    <button
                      type="button"
                      onClick={() => pushToast("Invoice download will be connected next")}
                      className="fr-mono fr-choice fr-link self-start"
                    >
                      Download invoice
                    </button>
                  </>
                }
              />
            ) : null}
          </div>
        </main>
      </AccountGuard>
      <SiteFooter />
    </div>
  );
}
