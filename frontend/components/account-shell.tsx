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

function AccountNavIcon({ id }: { id: AccountSectionId }) {
  const sharedProps = {
    className: "h-[18px] w-[18px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (id) {
    case "profile":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8" />
        </svg>
      );
    case "addresses":
      return (
        <svg {...sharedProps}>
          <path d="M12 21s-5-5.3-5-10a5 5 0 0 1 10 0c0 4.7-5 10-5 10Z" />
          <circle cx="12" cy="11" r="1.7" />
        </svg>
      );
    case "orders":
      return (
        <svg {...sharedProps}>
          <path d="M8 7h10" />
          <path d="M8 12h10" />
          <path d="M8 17h10" />
          <path d="M4 7h.01" />
          <path d="M4 12h.01" />
          <path d="M4 17h.01" />
        </svg>
      );
    case "wishlist":
      return (
        <svg {...sharedProps}>
          <path d="M12 20s-6.8-4.3-6.8-9.6A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 6.8 2.4C18.8 15.7 12 20 12 20Z" />
        </svg>
      );
    case "preferences":
      return (
        <svg {...sharedProps}>
          <path d="M4 7h8" />
          <path d="M4 17h12" />
          <path d="M16 7h4" />
          <path d="M12 17h8" />
          <circle cx="14" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...sharedProps}>
          <path d="M6 17h12" />
          <path d="M8 17V11a4 4 0 1 1 8 0v6" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "support":
      return (
        <svg {...sharedProps}>
          <path d="M12 18h.01" />
          <path d="M9.1 9a3 3 0 1 1 5.8 1c-.4 1.1-1.5 1.5-2.1 2.1-.5.4-.8.9-.8 1.9" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "dashboard":
    default:
      return (
        <svg {...sharedProps}>
          <path d="M4 13h7V4H4Z" />
          <path d="M13 20h7v-7h-7Z" />
          <path d="M13 11h7V4h-7Z" />
          <path d="M4 20h7v-5H4Z" />
        </svg>
      );
  }
}

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
      <div className="space-y-5 lg:hidden">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,#111111_0%,#1d1d1d_38%,rgba(214,31,38,0.86)_140%)] px-5 py-6 text-white shadow-[0_18px_45px_rgba(17,17,17,0.16)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">My account</p>
          <h1 className="display-font mt-3 text-[2rem] leading-[1.05]">
            Hello, {(userName || "member").split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-[28ch] text-sm leading-6 text-white/78">
            Keep orders, addresses, saved pieces, and support in one premium workspace.
          </p>
        </section>

        <section className="overflow-hidden rounded-[1.7rem] border border-[var(--border)] bg-white shadow-[0_14px_34px_rgba(17,17,17,0.06)]">
          <nav>
            {nav.map((item, index) => {
              const isActive = activeSection === item.id;
              const badge = summaryBadges?.[item.id];

              return (
                <button
                  key={`mobile-list-${item.id}`}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${
                    index !== nav.length - 1 ? "border-b border-[var(--border)]" : ""
                  } ${isActive ? "bg-black/[0.03]" : "bg-white"}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      isActive
                        ? "border-black bg-black text-white"
                        : "border-[var(--border)] bg-white text-[var(--foreground)]"
                    }`}
                  >
                    <AccountNavIcon id={item.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block text-[0.96rem] font-semibold tracking-tight text-[var(--foreground)]">
                        {item.label}
                      </span>
                      {badge ? (
                        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                          {badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                      {item.description}
                    </span>
                  </span>
                  <span className="text-lg text-[var(--muted)]">›</span>
                </button>
              );
            })}
          </nav>
        </section>
      </div>

      <aside className="hidden grain-card h-fit rounded-[2rem] p-5 sm:p-6 lg:block lg:sticky lg:top-24">
        <p className="eyebrow text-[var(--accent)]">My account</p>
        <h1 className="display-font mt-3 text-[2rem] leading-tight sm:text-4xl">
          {userName || "HRUSHE member"}.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          A single premium workspace for profile updates, repeat buying, saved delivery details,
          and post-purchase care.
        </p>

        <nav className="mt-6 lg:space-y-2">
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
