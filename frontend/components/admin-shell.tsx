"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin-guard";
import { AdminBadge } from "@/components/admin-ui";
import { adminNavigation } from "@/lib/admin";
import { useAdminAuth } from "@/components/admin-auth-provider";

function groupNavigation() {
  const map = new Map<string, typeof adminNavigation>();

  adminNavigation.forEach((item) => {
    const current = map.get(item.group) || [];
    current.push(item);
    map.set(item.group, current);
  });

  return Array.from(map.entries());
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4a4 4 0 0 0-4 4v2.3c0 1.1-.28 2.18-.82 3.14L6 15h12l-1.18-1.56A6.5 6.5 0 0 1 16 10.3V8a4 4 0 0 0-4-4Z" />
      <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

export function AdminShell({
  children,
  contextualActions,
}: {
  children: ReactNode;
  contextualActions?: ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const grouped = useMemo(() => groupNavigation(), []);

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((segment) => segment.replace(/-/g, " "));

  const activeItem = adminNavigation.find((item) => pathname === item.href);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#fafafa)] text-[var(--foreground)]">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 border-r border-[rgba(17,17,17,0.08)] bg-white/92 px-5 py-6 xl:block">
            <Link href="/admin" className="flex items-center gap-3 border-b border-[rgba(17,17,17,0.08)] pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(214,31,38,0.08)] text-[var(--accent)]">
                <span className="display-font text-2xl leading-none">H</span>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
                  Admin OS
                </p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">Hrushe operations</p>
              </div>
            </Link>

            <div className="mt-6 space-y-7">
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <p className="px-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    {group}
                  </p>
                  <div className="mt-3 space-y-1">
                    {items.map((item) => {
                      const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition ${
                            active
                              ? "bg-[rgba(17,17,17,0.95)] text-white shadow-[0_16px_32px_rgba(17,17,17,0.16)]"
                              : "text-[var(--muted)] hover:bg-[rgba(17,17,17,0.04)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span>{item.label}</span>
                          {active ? <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 border-b border-[rgba(17,17,17,0.08)] bg-white/84 px-4 py-3 backdrop-blur sm:px-5 lg:px-7">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(17,17,17,0.1)] bg-white xl:hidden"
                  aria-label="Open admin navigation"
                >
                  <HamburgerIcon />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    <span>Admin</span>
                    {crumbs.map((crumb) => (
                      <span key={crumb} className="flex items-center gap-2">
                        <span>/</span>
                        <span>{crumb}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="truncate text-lg font-semibold tracking-[-0.03em]">
                      {activeItem?.label || "Dashboard"}
                    </p>
                    <AdminBadge tone="accent">Live</AdminBadge>
                  </div>
                </div>

                <div className="hidden flex-1 items-center justify-end gap-3 lg:flex">
                  <div className="flex min-w-[240px] items-center gap-2 rounded-full border border-[rgba(17,17,17,0.08)] bg-white px-4 py-2.5 text-sm text-[var(--muted)]">
                    <SearchIcon />
                    <span>Search products, orders, customers</span>
                  </div>
                  {contextualActions}
                  <Link
                    href="/admin/add-product"
                    className="button-primary rounded-full px-4 py-2.5 text-sm font-medium"
                  >
                    Quick create
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(17,17,17,0.08)] bg-white"
                    aria-label="Notifications"
                  >
                    <BellIcon />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileOpen((current) => !current)}
                      className="inline-flex h-11 items-center gap-3 rounded-full border border-[rgba(17,17,17,0.08)] bg-white px-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(214,31,38,0.08)] text-sm font-semibold text-[var(--accent)]">
                        A
                      </span>
                      <span className="text-sm font-medium">Admin</span>
                    </button>
                    {profileOpen ? (
                      <div className="absolute right-0 top-[calc(100%+0.75rem)] w-56 rounded-[1.5rem] border border-[rgba(17,17,17,0.08)] bg-white p-3 shadow-[0_22px_50px_rgba(17,17,17,0.12)]">
                        <Link href="/admin/settings" className="block rounded-xl px-3 py-2 text-sm hover:bg-[rgba(17,17,17,0.04)]">
                          Settings
                        </Link>
                        <button
                          type="button"
                          onClick={() => void logout()}
                          className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--accent)] hover:bg-[rgba(214,31,38,0.06)]"
                        >
                          Logout
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {mobileNavOpen ? (
                <div className="mobile-drawer-enter mt-4 space-y-5 rounded-[1.5rem] border border-[rgba(17,17,17,0.08)] bg-white p-4 xl:hidden">
                  {grouped.map(([group, items]) => (
                    <div key={group}>
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                        {group}
                      </p>
                      <div className="mt-2 grid gap-2">
                        {items.map((item) => {
                          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileNavOpen(false)}
                              className={`rounded-2xl px-3 py-2.5 text-sm ${
                                active
                                  ? "bg-[rgba(17,17,17,0.95)] text-white"
                                  : "border border-[rgba(17,17,17,0.08)] bg-white text-[var(--foreground)]"
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </header>

            <main className="flex-1 px-4 py-5 sm:px-5 lg:px-7 lg:py-7">{children}</main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
