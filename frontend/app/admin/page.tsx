"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { formatOrderDate, type OrderRecord } from "@/lib/orders";
import { useStorefrontData } from "@/lib/use-storefront";

const adminLinks = [
  {
    href: "/admin/products",
    label: "Manage products",
    description: "Review the live catalog and edit launch items.",
  },
  {
    href: "/admin/add-product",
    label: "Add product",
    description: "Create the next fashion drop or hero piece.",
  },
  {
    href: "/admin/homepage",
    label: "Homepage banner",
    description: "Change the homepage banner image and copy.",
  },
  {
    href: "/admin/orders",
    label: "Manage orders",
    description: "Move orders from pending to delivered.",
  },
];

const statusToneMap = {
  Pending: "bg-[#fff5eb] text-[#b95d19]",
  Confirmed: "bg-[#edf7ff] text-[#145ea8]",
  Packed: "bg-[#f4f4ff] text-[#4b47b8]",
  Shipped: "bg-[#f4f0ff] text-[#6c3dc8]",
  "Out for delivery": "bg-[#fff3f7] text-[#b8326e]",
  Delivered: "bg-[#effaf2] text-[#1f7a39]",
  Cancelled: "bg-[#fff0f0] text-[#c63a3a]",
  Returned: "bg-[#f5f5f5] text-[#575757]",
} as const;

export default function AdminPage() {
  const { products, homepageBanner, loading } = useStorefrontData();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const featuredCount = products.filter((product) => product.featured).length;
  const newArrivalCount = products.filter((product) => product.newArrival).length;
  const orderCount = orders.length;
  const pendingOrders = orders.filter((order) =>
    ["Pending", "Confirmed", "Packed", "Shipped", "Out for delivery"].includes(
      order.orderStatus
    )
  ).length;
  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "Delivered"
  ).length;
  const grossRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const lowImageProducts = products.filter(
    (product) => product.images.length < 2
  ).length;
  const outOfStockStyledProducts = products.filter(
    (product) => product.sizes.length === 0 || product.colors.length === 0
  ).length;
  const averageOrderValue = orderCount > 0 ? Math.round(grossRevenue / orderCount) : 0;
  const productsWithoutSale = products.filter(
    (product) => !product.compareAtPrice || product.compareAtPrice <= product.price
  ).length;
  const recentProducts = [...products].slice(0, 4);
  const recentOrders = [...orders].slice(0, 5);
  const topCategories = useMemo(
    () =>
      Object.entries(
        products.reduce<Record<string, number>>((accumulator, product) => {
          const productCategories =
            product.categories && product.categories.length > 0
              ? product.categories
              : [product.category];

          productCategories.forEach((category) => {
            accumulator[category] = (accumulator[category] || 0) + 1;
          });

          return accumulator;
        }, {})
      )
        .sort((first, second) => second[1] - first[1])
        .slice(0, 5),
    [products]
  );
  const statusSummary = useMemo(
    () =>
      Object.entries(
        orders.reduce<Record<string, number>>((accumulator, order) => {
          accumulator[order.orderStatus] =
            (accumulator[order.orderStatus] || 0) + 1;
          return accumulator;
        }, {})
      ),
    [orders]
  );
  const actionItems = [
    lowImageProducts > 0
      ? `${lowImageProducts} products still need at least two images for a stronger PDP and shop grid.`
      : "All current products have enough image coverage.",
    outOfStockStyledProducts > 0
      ? `${outOfStockStyledProducts} products are missing size or color setup.`
      : "All products have size and color selections configured.",
    pendingOrders > 0
      ? `${pendingOrders} live orders still need fulfillment updates.`
      : "No pending fulfillment actions right now.",
    productsWithoutSale > 0
      ? `${productsWithoutSale} products do not have a compare-at sale price set.`
      : "All products currently have sale storytelling in place.",
  ];

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        const response = await apiRequest<OrderRecord[]>("/order/all");

        if (active) {
          setOrders(response);
        }
      } catch {
        if (active) {
          setOrders([]);
        }
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-shell">
      <SiteHeader />
      <AdminGuard>
        <main className="mx-auto w-full max-w-[1600px] px-5 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow text-[var(--accent)]">Admin</p>
              <h1 className="display-font mt-3 text-4xl sm:text-5xl">
                Brand operations dashboard.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Keep the launch moving with a single view of catalog health,
                order flow, homepage readiness, and the next actions your store
                team should take.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/add-product"
                className="button-primary inline-flex rounded-full px-5 py-3 transition"
              >
                Add new product
              </Link>
              <Link
                href="/admin/orders"
                className="button-secondary inline-flex rounded-full px-5 py-3 transition"
              >
                Review orders
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="grain-card rounded-[2rem] p-6">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                Total products
              </p>
              <p className="mt-3 text-4xl font-semibold">{loading ? "..." : products.length}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {featuredCount} featured and {newArrivalCount} marked as new
                arrivals.
              </p>
            </div>
            <div className="grain-card rounded-[2rem] p-6">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                Active orders
              </p>
              <p className="mt-3 text-4xl font-semibold">
                {ordersLoading ? "..." : pendingOrders}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {deliveredOrders} delivered from {orderCount} total orders.
              </p>
            </div>
            <div className="grain-card rounded-[2rem] p-6">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                Revenue snapshot
              </p>
              <p className="mt-3 text-4xl font-semibold">
                {ordersLoading ? "..." : `Rs. ${grossRevenue.toLocaleString("en-IN")}`}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Based on current orders recorded in the store.
              </p>
            </div>
            <div className="grain-card rounded-[2rem] p-6">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                Catalog cleanup
              </p>
              <p className="mt-3 text-4xl font-semibold">{lowImageProducts}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Products still need richer image coverage for a premium
                storefront.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/45 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Avg. order value
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Rs. {averageOrderValue.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/45 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Missing setup
              </p>
              <p className="mt-3 text-2xl font-semibold">{outOfStockStyledProducts}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Products missing size or color setup.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/45 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Non-sale products
              </p>
              <p className="mt-3 text-2xl font-semibold">{productsWithoutSale}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Pieces without compare-at pricing.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/45 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Banner CTA
              </p>
              <p className="mt-3 text-2xl font-semibold">{homepageBanner.primaryCtaLabel}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Current homepage primary action.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="grain-card rounded-[2rem] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[var(--accent)]">Launch overview</p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    What needs attention today.
                  </h2>
                </div>
                <Link
                  href="/admin/homepage"
                  className="text-sm text-[var(--muted)] underline"
                >
                  Edit banner
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-5">
                  <p className="text-sm font-semibold">Homepage banner</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {homepageBanner.title}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-5">
                  <p className="text-sm font-semibold">Order attention</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {pendingOrders > 0
                      ? `${pendingOrders} orders are still in motion and need status updates.`
                      : "All current orders look clear right now."}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-5">
                  <p className="text-sm font-semibold">Catalog attention</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {lowImageProducts > 0
                      ? `${lowImageProducts} products have fewer than two images.`
                      : "Your current products all have solid visual coverage."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-[1.5rem] border border-[var(--border)] bg-white/45 p-5 transition hover:-translate-y-0.5 hover:bg-white/70"
                  >
                    <p className="text-lg font-semibold">{link.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="grain-card rounded-[2rem] p-6 sm:p-7">
              <p className="eyebrow text-[var(--accent)]">Order pulse</p>
              <h2 className="mt-3 text-2xl font-semibold">Status distribution.</h2>
              <div className="mt-6 space-y-3">
                {ordersLoading ? (
                  <p className="text-sm text-[var(--muted)]">
                    Loading order summary...
                  </p>
                ) : statusSummary.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No orders yet.</p>
                ) : (
                  statusSummary.map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-[1.2rem] border border-[var(--border)] bg-white/45 px-4 py-3"
                    >
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusToneMap[status as keyof typeof statusToneMap] ||
                          "bg-black/5 text-black"
                        }`}
                      >
                        {status}
                      </span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="grain-card rounded-[2rem] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[var(--accent)]">Action needed</p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    Operational checklist.
                  </h2>
                </div>
                <Link
                  href="/admin/products"
                  className="text-sm text-[var(--muted)] underline"
                >
                  Open catalog
                </Link>
              </div>
              <div className="mt-6 space-y-3">
                {actionItems.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[1.3rem] border border-[var(--border)] bg-white/45 px-4 py-4"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                      •
                    </span>
                    <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grain-card rounded-[2rem] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[var(--accent)]">Category mix</p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    What your catalog leans toward.
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="text-sm text-[var(--muted)] underline"
                >
                  View storefront
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {topCategories.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Category distribution will appear once products are live.
                  </p>
                ) : (
                  topCategories.map(([category, count]) => {
                    const ratio = Math.max(
                      12,
                      Math.min(100, Math.round((count / Math.max(products.length, 1)) * 100))
                    );

                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="text-[var(--muted)]">{count}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/6">
                          <div
                            className="h-full rounded-full bg-[var(--accent)]"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="grain-card rounded-[2rem] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[var(--accent)]">Recent products</p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    Latest catalog additions.
                  </h2>
                </div>
                <Link
                  href="/admin/products"
                  className="text-sm text-[var(--muted)] underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-[1.4rem] border border-[var(--border)] bg-white/45 p-4"
                  >
                    <div className="relative h-20 w-16 overflow-hidden rounded-[1rem] bg-[var(--surface-strong)]">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {product.category} · Rs. {product.price}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.featured ? (
                          <span className="rounded-full bg-black px-3 py-1 text-[11px] text-white">
                            Featured
                          </span>
                        ) : null}
                        {product.newArrival ? (
                          <span className="rounded-full border border-[var(--accent)] px-3 py-1 text-[11px] text-[var(--accent)]">
                            New arrival
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      href={`/admin/products/${product.slug || product.id}`}
                      className="text-sm text-[var(--muted)] underline"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="grain-card rounded-[2rem] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[var(--accent)]">Recent orders</p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    Latest customer activity.
                  </h2>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-sm text-[var(--muted)] underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {ordersLoading ? (
                  <p className="text-sm text-[var(--muted)]">
                    Loading recent orders...
                  </p>
                ) : recentOrders.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No orders yet.</p>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block rounded-[1.4rem] border border-[var(--border)] bg-white/45 p-4 transition hover:bg-white/70"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold">
                            Order #{order.orderNumber || order.id}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                            Ref {order.id.slice(-8)}
                          </p>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {order.customerName} · {formatOrderDate(order.createdAt)}
                          </p>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            Rs. {order.totalAmount.toLocaleString("en-IN")} ·{" "}
                            {order.products.length} item
                            {order.products.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusToneMap[order.orderStatus]}`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </AdminGuard>
      <SiteFooter />
    </div>
  );
}
