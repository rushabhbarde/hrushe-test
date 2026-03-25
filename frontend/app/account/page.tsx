"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AccountGuard } from "@/components/account-guard";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { apiRequest } from "@/lib/api";
import { formatOrderDate, type OrderRecord } from "@/lib/orders";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

const accountLinks = [
  {
    href: "/contact",
    label: "Need help?",
    description: "Reach support for exchange, delivery, or product questions.",
  },
];

export default function AccountPage() {
  const { user, updateProfile, changePassword, isAuthenticated, isChecking } = useCustomerAuth();
  const { wishlistIds } = useWishlist();
  const { products } = useStorefrontData();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const memberSince = "Member";
  const wishlistProducts = wishlistIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  useEffect(() => {
    if (isChecking || !isAuthenticated) {
      return;
    }

    let active = true;

    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const response = await apiRequest<OrderRecord[]>("/order/myorders", {
          cache: "no-store",
        });

        if (active) {
          setOrders(response);
        }
      } catch (loadError) {
        if (active) {
          setOrdersError(
            loadError instanceof Error ? loadError.message : "Could not load orders."
          );
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
  }, [isAuthenticated, isChecking]);

  const quickStats = [
    {
      label: "Primary email",
      value: user?.email || "Not provided",
      note: "Used for order updates and support replies.",
    },
    {
      label: "Phone",
      value: user?.phone || "Not provided",
      note: "Used for delivery updates and account recovery.",
    },
    {
      label: "Address",
      value: user?.address || "No default address added yet.",
      note: user?.address
        ? "This address will be ready to use at checkout."
        : "Add your default shipping address so checkout stays faster.",
      multiline: true,
    },
  ];

  const hasChanged =
    form.name !== (user?.name || "") ||
    form.email !== (user?.email || "") ||
    form.phone !== (user?.phone || "") ||
    form.address !== (user?.address || "");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const success = await updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });

    setIsSaving(false);

    if (success) {
      setIsEditing(false);
      setSaveMessage("Profile updated successfully.");
      return;
    }

    setSaveMessage("We couldn't save your profile right now. Please try again.");
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New password and confirm password must match.");
      return;
    }

    setIsSavingPassword(true);
    setPasswordMessage(null);

    const success = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    setIsSavingPassword(false);

    if (success) {
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("Password changed successfully.");
      return;
    }

    setPasswordMessage("We couldn't change your password right now. Please try again.");
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AccountGuard>
        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <section className="grain-card rounded-[2.25rem] px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="eyebrow text-[var(--accent)]">My account</p>
                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-3xl font-semibold uppercase text-white shadow-[0_12px_30px_rgba(208,32,39,0.22)]">
                    {user?.name?.charAt(0) || "H"}
                  </div>
                  <div>
                    <h1 className="display-font text-4xl sm:text-5xl lg:text-6xl">
                      {user?.name || "Your account"}.
                    </h1>
                    <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                      {memberSince}
                    </p>
                  </div>
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                  Review your profile, check shipping details, and track your orders from a
                  cleaner, wider account hub designed for quick actions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/account#my-orders" className="button-primary rounded-full px-5 py-3 transition">
                  View orders
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                    } else {
                      setForm({
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        address: user?.address || "",
                      });
                      setIsEditing(true);
                    }
                    setSaveMessage(null);
                  }}
                  className="button-secondary rounded-full px-5 py-3 transition"
                >
                  {isEditing ? "Close editor" : "Edit profile"}
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-[1.75rem] border border-[var(--border)] bg-white/55 px-5 py-5 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                    {item.label}
                  </p>
                  <p
                    className={`mt-3 font-semibold text-[var(--foreground)] ${
                      "multiline" in item && item.multiline
                        ? "text-base leading-6 sm:text-lg"
                        : "text-xl"
                    }`}
                  >
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>

            {isEditing ? (
              <div className="mt-8 rounded-[2rem] border border-[var(--border)] bg-white/60 p-5 backdrop-blur-md sm:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-[var(--muted)]">Name</span>
                    <input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-[1.1rem] border border-[var(--border)] bg-white/85 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                      placeholder="Your full name"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-[var(--muted)]">Email</span>
                    <input
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="w-full rounded-[1.1rem] border border-[var(--border)] bg-white/85 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                      placeholder="you@example.com"
                      type="email"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-[var(--muted)]">Phone</span>
                    <input
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      className="w-full rounded-[1.1rem] border border-[var(--border)] bg-white/85 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                      placeholder="+91 98xxxxxxx"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm text-[var(--muted)]">Default address</span>
                    <textarea
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      className="min-h-32 w-full rounded-[1.1rem] border border-[var(--border)] bg-white/85 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                      placeholder="Add your default shipping address"
                    />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving || !hasChanged}
                    className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save profile"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSaveMessage(null);
                      setForm({
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        address: user?.address || "",
                      });
                    }}
                    className="button-secondary rounded-full px-5 py-3 transition"
                  >
                    Cancel
                  </button>
                  {saveMessage ? (
                    <p className={`text-sm ${saveMessage.includes("successfully") ? "text-[var(--accent)]" : "text-red-500"}`}>
                      {saveMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section>
              <div
                id="my-orders"
                className="grain-card flex h-[540px] flex-col rounded-[2rem] p-6 sm:h-[580px] sm:p-7"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                  Order center
                </p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">My orders</p>
                    <p className="mt-3 max-w-md text-[var(--muted)]">
                      See every purchase, payment update, and delivery status in one scrollable panel.
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                    {orders.length} total
                  </div>
                </div>

                <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
                  {ordersLoading ? (
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4 text-sm text-[var(--muted)]">
                      Loading your orders...
                    </div>
                  ) : ordersError ? (
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4 text-sm text-[var(--accent)]">
                      {ordersError}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4 text-sm text-[var(--muted)]">
                      Your orders will appear here after your first checkout.
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4 backdrop-blur-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-lg font-semibold">
                              Order #{order.orderNumber || order.id}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {order.products[0]?.name || "Order items"} • {formatOrderDate(order.createdAt)}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              Tracking ID: {order.trackingId || "Will be added after dispatch"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">Rs. {order.totalAmount}</p>
                            <p className="mt-1 text-sm text-[var(--accent)]">{order.orderStatus}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Link
                            href={`/my-orders/${order.id}`}
                            className="inline-flex text-sm font-medium text-[var(--accent)] underline underline-offset-4"
                          >
                            View order details
                          </Link>
                          {order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex text-sm font-medium !text-[#1f7a39] underline underline-offset-4 transition hover:!text-[#17622d]"
                              style={{ color: "#1f7a39" }}
                            >
                              Track shipment
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              <div
                id="wishlist"
                className="grain-card flex h-[380px] flex-col rounded-[2rem] p-6 sm:h-[420px] sm:p-7"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                  Saved items
                </p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">Wishlist</p>
                    <p className="mt-3 max-w-md text-[var(--muted)]">
                      Keep your favorite pieces ready for the next drop, checkout, or restock.
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                    {wishlistProducts.length} saved
                  </div>
                </div>

                <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
                  {wishlistProducts.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4 text-sm text-[var(--muted)]">
                      Saved products will appear here after you tap the heart on any product.
                    </div>
                  ) : (
                    wishlistProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug || product.id}`}
                        className="flex items-center gap-4 rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4 transition hover:-translate-y-0.5"
                      >
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[1rem] bg-[#f4f4f1]">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{ background: product.accent }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold">
                            {product.name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {product.category}
                          </p>
                          <p className="mt-2 font-medium">
                            Rs. {product.price.toLocaleString("en-IN")}.00
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="grain-card rounded-[2rem] p-6 sm:p-7">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                  Security
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-tight">Change password</p>
                <p className="mt-3 text-[var(--muted)]">
                  Keep your account secure by updating your password whenever you need.
                </p>
                {isChangingPassword ? (
                  <div className="mt-5 grid gap-3">
                    <input
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      placeholder="Current password"
                      type="password"
                    />
                    <input
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      placeholder="New password"
                      type="password"
                    />
                    <input
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                      placeholder="Confirm new password"
                      type="password"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handlePasswordSave()}
                        disabled={isSavingPassword}
                        className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingPassword ? "Saving..." : "Save password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordMessage(null);
                          setPasswordForm({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="button-secondary rounded-full px-5 py-3 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(true);
                      setPasswordMessage(null);
                    }}
                    className="button-secondary mt-5 rounded-full px-5 py-3 transition"
                  >
                    Change password
                  </button>
                )}
                {passwordMessage ? (
                  <p
                    className={`mt-4 text-sm ${
                      passwordMessage.includes("successfully")
                        ? "text-[var(--accent)]"
                        : "text-red-500"
                    }`}
                  >
                    {passwordMessage}
                  </p>
                ) : null}
              </div>

              <div className="grain-card rounded-[2rem] p-6 sm:p-7">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                  Rewards
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-tight">Style points</p>
                <p className="mt-3 text-[var(--muted)]">
                  Earn more points as you place orders and keep your profile updated for a smoother launch-member experience.
                </p>
                <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-5 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                    Available points
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                    {orders.length * 25}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {orders.length > 0
                      ? "You earn 25 points per order in this demo rewards view."
                      : "Place your first order to start collecting launch-member points."}
                  </p>
                </div>
              </div>

              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="grain-card rounded-[2rem] p-6 transition hover:-translate-y-1 sm:p-7"
                >
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Support
                  </p>
                  <p className="mt-4 text-2xl font-semibold tracking-tight">{link.label}</p>
                  <p className="mt-3 max-w-md text-[var(--muted)]">{link.description}</p>
                </Link>
              ))}
            </section>
          </div>
        </main>
      </AccountGuard>
      <SiteFooter />
    </div>
  );
}
