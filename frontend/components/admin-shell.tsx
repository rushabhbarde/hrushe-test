"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin-guard";
import { AdminBadge, AdminPanel, AdminSectionLabel } from "@/components/admin-ui";
import { useAdminAuth } from "@/components/admin-auth-provider";
import { useTheme } from "@/components/theme-provider";
import { adminNavigation, getAdminRoutePermission } from "@/lib/admin";

function groupNavigation(navigation: typeof adminNavigation) {
  const navigationMap = new Map<string, typeof navigation>();

  navigation.forEach((item) => {
    const current = navigationMap.get(item.group) || [];
    current.push(item);
    navigationMap.set(item.group, current);
  });

  return Array.from(navigationMap.entries());
}

function IconShell({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)]">
      {children}
    </span>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
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

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 4a4 4 0 0 0-4 4v2.25c0 1.15-.3 2.28-.86 3.28L6 15h12l-1.14-1.47a6 6 0 0 1-.86-3.28V8a4 4 0 0 0-4-4Z" />
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
  const router = useRouter();
  const { logout, user, hasPermission } = useAdminAuth();
  const { isDark, toggleTheme } = useTheme();
  const [globalQuery, setGlobalQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const visibleNavigation = useMemo(
    () => adminNavigation.filter((item) => hasPermission(item.permission)),
    [hasPermission]
  );
  const groupedNavigation = useMemo(() => groupNavigation(visibleNavigation), [visibleNavigation]);
  const routePermission = getAdminRoutePermission(pathname);
  const canViewRoute = hasPermission(routePermission);
  const canQuickCreate = hasPermission("products.edit");
  const canOpenSettings = hasPermission("settings.manage");

  const activeItem = adminNavigation.find(
    (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
  );
  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((segment) => segment.replace(/-/g, " "));

  function handleGlobalSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = globalQuery.trim();

    if (!query) {
      return;
    }

    const encodedQuery = encodeURIComponent(query);

    if (
      hasPermission("customers.view") &&
      (query.includes("@") || /^\+?\d{8,}$/.test(query.replace(/\s/g, "")))
    ) {
      router.push(`/admin/customers?query=${encodedQuery}`);
      return;
    }

    if (hasPermission("orders.view") && /^#?\d+$/.test(query)) {
      router.push(`/admin/orders?query=${encodedQuery.replace(/^%23/, "")}`);
      return;
    }

    if (hasPermission("products.view")) {
      router.push(`/admin/products?query=${encodedQuery}`);
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_98%,white_2%),var(--background))] text-[var(--foreground)]">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-[310px] shrink-0 border-r border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)] px-5 py-6 backdrop-blur xl:block">
            <Link href="/admin" className="flex items-center gap-4 border-b border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] pb-5">
              <div className="flex h-12 w-12 items-center justify-center border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--foreground)_5%,transparent)]">
                <span className="display-font text-2xl leading-none">H</span>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                  HRUSHE Admin
                </p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">Luxury commerce control</p>
              </div>
            </Link>

            <div className="mt-6 flex items-center gap-3 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-strong)_84%,transparent)] px-4 py-4">
              <div className="h-2.5 w-2.5 bg-[#12824a]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
                  Secure workspace
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Central control for catalog, content, orders, and reporting.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-7">
              {groupedNavigation.map(([group, items]) => (
                <div key={group}>
                  <p className="px-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    {group}
                  </p>
                  <div className="mt-3 space-y-1">
                    {items.map((item) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-3 text-sm transition ${
                            active
                              ? "bg-[var(--foreground)] text-[var(--background)] shadow-[0_16px_36px_rgba(17,17,17,0.16)]"
                              : "text-[var(--muted)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_4%,transparent)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span>{item.label}</span>
                          {active ? <span className="h-2 w-2 bg-current" /> : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 border-b border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)] px-4 py-3 backdrop-blur sm:px-5 lg:px-7">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] xl:hidden"
                  aria-label="Open admin navigation"
                >
                  <MenuIcon />
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
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-semibold tracking-[-0.03em]">
                      {activeItem?.label || "Overview"}
                    </p>
                    {activeItem?.group ? <AdminBadge tone="accent">{activeItem.group}</AdminBadge> : null}
                  </div>
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                  <form
                    onSubmit={handleGlobalSearch}
                    className="flex min-w-[300px] items-center gap-2 border border-[color:color-mix(in_srgb,var(--foreground)_9%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)] px-4 py-2.5 text-sm text-[var(--muted)] transition focus-within:border-[color:color-mix(in_srgb,var(--foreground)_24%,transparent)]"
                  >
                    <SearchIcon />
                    <input
                      value={globalQuery}
                      onChange={(event) => setGlobalQuery(event.target.value)}
                      placeholder="Search product, order, customer"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                    />
                  </form>
                  {contextualActions}
                  {canQuickCreate ? (
                    <Link href="/admin/add-product" className="button-primary px-4 py-2.5 text-sm font-medium">
                      Quick create
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex h-11 w-11 items-center justify-center border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]"
                    aria-label="Toggle theme"
                  >
                    <ThemeIcon dark={isDark} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]"
                    aria-label="Notifications"
                  >
                    <BellIcon />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileOpen((current) => !current)}
                      className="inline-flex h-11 items-center gap-3 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] px-3"
                    >
                      <IconShell>
                        <span className="text-sm font-semibold">A</span>
                      </IconShell>
                      <span className="text-sm font-medium">Admin</span>
                    </button>
                    {profileOpen ? (
                      <div className="absolute right-0 top-[calc(100%+0.75rem)] w-60 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,transparent),color-mix(in_srgb,var(--surface-strong)_92%,transparent))] p-3 shadow-[0_24px_64px_rgba(17,17,17,0.14)]">
                        <div className="px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Session</p>
                          <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                            {user?.adminRoleName || "Admin"}
                          </p>
                          {user?.email ? (
                            <p className="mt-1 truncate text-xs text-[var(--muted)]">{user.email}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={toggleTheme}
                          className="mt-1 block w-full px-3 py-2 text-left text-sm hover:bg-[color:color-mix(in_srgb,var(--foreground)_4%,transparent)]"
                        >
                          Switch to {isDark ? "light" : "dark"} mode
                        </button>
                        {canOpenSettings ? (
                          <Link
                            href="/admin/settings"
                            className="mt-1 block px-3 py-2 text-sm hover:bg-[color:color-mix(in_srgb,var(--foreground)_4%,transparent)]"
                          >
                            Open settings
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void logout()}
                          className="mt-1 block w-full px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[rgba(214,31,38,0.06)]"
                        >
                          Logout
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {mobileNavOpen ? (
                <div className="mobile-drawer-enter mt-4 space-y-5 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_92%,transparent)] p-4 xl:hidden">
                  <form
                    onSubmit={handleGlobalSearch}
                    className="flex items-center gap-2 border border-[color:color-mix(in_srgb,var(--foreground)_9%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)] px-4 py-2.5 text-sm text-[var(--muted)]"
                  >
                    <SearchIcon />
                    <input
                      value={globalQuery}
                      onChange={(event) => setGlobalQuery(event.target.value)}
                      placeholder="Search everywhere"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                    />
                  </form>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={toggleTheme} className="button-secondary px-4 py-2.5 text-sm font-medium">
                      {isDark ? "Light mode" : "Dark mode"}
                    </button>
                    {canQuickCreate ? (
                      <Link href="/admin/add-product" className="button-primary px-4 py-2.5 text-sm font-medium">
                        Quick create
                      </Link>
                    ) : null}
                  </div>
                  {groupedNavigation.map(([group, items]) => (
                    <div key={group}>
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                        {group}
                      </p>
                      <div className="mt-2 grid gap-2">
                        {items.map((item) => {
                          const active =
                            pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileNavOpen(false)}
                              className={`px-3 py-3 text-sm ${
                                active
                                  ? "bg-[var(--foreground)] text-[var(--background)]"
                                  : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] text-[var(--foreground)]"
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

            <main className="flex-1 px-4 py-5 sm:px-5 lg:px-7 lg:py-7">
              {canViewRoute ? (
                children
              ) : (
                <AdminPanel className="min-h-[360px]">
                  <AdminSectionLabel>Restricted access</AdminSectionLabel>
                  <h1 className="display-font mt-4 max-w-2xl text-5xl leading-none">
                    This workspace area is outside your role.
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    Your current role is {user?.adminRoleName || "Admin"}. Ask a Super Admin
                    to change your role if you need access to this module.
                  </p>
                  <Link href="/admin" className="button-secondary mt-7 inline-flex px-5 py-3 text-sm font-medium">
                    Back to overview
                  </Link>
                </AdminPanel>
              )}
            </main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
