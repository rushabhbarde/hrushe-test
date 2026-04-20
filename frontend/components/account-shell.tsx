"use client";

import Link from "next/link";
import { useMemo } from "react";

export type AccountSectionId =
  | "dashboard"
  | "profile"
  | "addresses"
  | "orders"
  | "wishlist"
  | "preferences"
  | "notifications"
  | "support";

type AccountShellProps = {
  activeSection: AccountSectionId;
  onSectionChange: (section: AccountSectionId) => void;
  userName: string;
  summaryBadges?: Partial<Record<AccountSectionId, string>>;
  children: React.ReactNode;
};

const navigationItems: {
  id: AccountSectionId;
  label: string;
  description: string;
}[] = [
  { id: "dashboard", label: "Dashboard", description: "Overview and quick links" },
  { id: "profile", label: "Profile", description: "Personal details and account identity" },
  { id: "addresses", label: "Address book", description: "Shipping addresses and defaults" },
  { id: "orders", label: "Orders", description: "History, tracking, and reorder" },
  { id: "wishlist", label: "Wishlist", description: "Saved products and move to cart" },
  { id: "preferences", label: "Preferences", description: "Sizing, fit, and color tastes" },
  { id: "notifications", label: "Notifications", description: "Email and WhatsApp settings" },
  { id: "support", label: "Support", description: "Track, return, exchange, and contact help" },
];

export function AccountShell({
  activeSection,
  onSectionChange,
  userName,
  summaryBadges,
  children,
}: AccountShellProps) {
  const nav = useMemo(() => navigationItems, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="grain-card h-fit rounded-[2rem] p-5 sm:p-6 lg:sticky lg:top-24">
        <p className="eyebrow text-[var(--accent)]">My account</p>
        <h1 className="display-font mt-3 text-[2rem] leading-tight sm:text-4xl">
          {userName || "HRUSHE member"}.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          A single premium workspace for profile updates, repeat buying, saved delivery details,
          and post-purchase care.
        </p>

        <div className="mt-6 lg:hidden">
          <label
            htmlFor="account-section-selector"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent)]"
          >
            Open section
          </label>
          <div className="mt-2 rounded-[1.3rem] border border-[var(--border)] bg-white/85 p-1.5">
            <select
              id="account-section-selector"
              value={activeSection}
              onChange={(event) => onSectionChange(event.target.value as AccountSectionId)}
              className="min-h-12 w-full rounded-[1rem] bg-transparent px-3 text-sm font-medium text-[var(--foreground)] outline-none"
            >
              {nav.map((item) => (
                <option key={`mobile-selector-${item.id}`} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {nav.slice(0, 4).map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={`mobile-chip-${item.id}`}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-black text-white"
                      : "border border-[var(--border)] bg-white/70 text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <nav className="mt-6 hidden lg:block lg:space-y-2">
          {nav.map((item) => {
            const isActive = activeSection === item.id;
            const badge = summaryBadges?.[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={`min-h-[122px] rounded-[1.4rem] border px-4 py-4 text-left transition lg:w-full lg:min-h-0 ${
                  isActive
                    ? "border-black bg-black text-white shadow-[0_16px_30px_rgba(0,0,0,0.14)]"
                    : "border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:border-black/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-tight sm:text-[0.95rem]">
                      {item.label}
                    </p>
                    <p
                      className={`mt-1 text-[11px] leading-4 sm:text-xs sm:leading-5 ${
                        isActive ? "text-white/70" : "text-[var(--muted)]"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                  {badge ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                        isActive
                          ? "bg-white/14 text-white"
                          : "border border-[var(--border)] text-[var(--accent)]"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="section-divider mt-6 hidden lg:block" />
        <div className="mt-6 hidden rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4 lg:block">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Need quick help?</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            You can still use the public tracking flow any time if you just need shipment updates.
          </p>
          <Link
            href="/track-order"
            className="button-secondary mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 py-2.5 text-sm transition sm:w-auto"
          >
            Open track order
          </Link>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}

export function AccountSectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grain-card rounded-[2rem] p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          {description ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
