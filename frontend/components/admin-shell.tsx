"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin-guard";
import { AdminPanel, AdminSectionLabel } from "@/components/admin-ui";
import { useAdminAuth } from "@/components/admin-auth-provider";
import { useTheme } from "@/components/theme-provider";
import { adminNavigation, getAdminRoutePermission } from "@/lib/admin";
import {
  HRUSHE_SYMBOL_LOGO_DIMENSIONS,
  HRUSHE_SYMBOL_LOGO_PATH,
} from "@/lib/brand-assets";

function groupNavigation(navigation: typeof adminNavigation) {
  const navigationMap = new Map<string, typeof navigation>();

  navigation.forEach((item) => {
    const current = navigationMap.get(item.group) || [];
    current.push(item);
    navigationMap.set(item.group, current);
  });

  return Array.from(navigationMap.entries());
}

const primaryNavigation = [
  { label: "Workbench", href: "/admin", permission: "dashboard.view", match: (path: string) => path === "/admin" },
  {
    label: "Orders",
    href: "/admin/orders",
    permission: "orders.view",
    match: (path: string) => path.startsWith("/admin/orders"),
  },
  {
    label: "Pieces",
    href: "/admin/products",
    permission: "products.view",
    match: (path: string) =>
      ["/admin/products", "/admin/add-product", "/admin/inventory"].some((prefix) => path.startsWith(prefix)),
  },
  {
    label: "Homepage",
    href: "/admin/homepage",
    permission: "home.manage",
    match: (path: string) => path.startsWith("/admin/homepage"),
  },
] as const;

/**
 * The Atelier: HRUSHE's admin in the Frame language. Four words carry the daily work
 * (Workbench, Orders, Pieces, Homepage); everything else lives behind "More".
 */
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
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleNavigation = useMemo(
    () => adminNavigation.filter((item) => hasPermission(item.permission)),
    [hasPermission]
  );
  const groupedNavigation = useMemo(() => groupNavigation(visibleNavigation), [visibleNavigation]);
  const visiblePrimary = primaryNavigation.filter((item) => hasPermission(item.permission));
  const routePermission = getAdminRoutePermission(pathname);
  const canViewRoute = hasPermission(routePermission);
  const primaryActive = visiblePrimary.some((item) => item.match(pathname));

  function handleGlobalSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = globalQuery.trim();

    if (!query) {
      return;
    }

    const encodedQuery = encodeURIComponent(query);
    setMoreOpen(false);

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

  const searchForm = (className: string) => (
    <form role="search" onSubmit={handleGlobalSearch} className={className}>
      <label className="sr-only" htmlFor={`admin-search-${className.length}`}>
        Search pieces, orders or customers
      </label>
      <input
        id={`admin-search-${className.length}`}
        value={globalQuery}
        onChange={(event) => setGlobalQuery(event.target.value)}
        placeholder="Search"
        className="fr-mono w-full border-0 border-b border-[color-mix(in_srgb,var(--foreground)_22%,transparent)] bg-transparent py-2 outline-none! placeholder:text-[var(--fr-quiet)] focus:border-[var(--foreground)]"
      />
    </form>
  );

  return (
    <AdminGuard>
      <div className="fr-atelier min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <header className="sticky top-0 z-40 grid h-16 grid-cols-[1fr_auto] items-center gap-6 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--background)] px-5 lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
          <Link href="/admin" className="flex items-center gap-3 justify-self-start">
            <Image
              src={HRUSHE_SYMBOL_LOGO_PATH}
              alt="HRUSHE"
              width={HRUSHE_SYMBOL_LOGO_DIMENSIONS.width}
              height={HRUSHE_SYMBOL_LOGO_DIMENSIONS.height}
              className="h-7 w-7 object-contain"
            />
            <span className="fr-mono">Atelier</span>
          </Link>

          <nav aria-label="Admin" className="hidden items-center gap-8 lg:flex">
            {visiblePrimary.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`fr-mono fr-choice min-h-11 inline-flex items-center ${active ? "is-active fr-link" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={`fr-mono fr-choice min-h-11 ${!primaryActive ? "is-active fr-link" : ""}`}
            >
              More
            </button>
          </nav>

          <div className="flex items-center justify-end gap-6">
            {searchForm("hidden w-44 xl:block")}
            {contextualActions}
            <span className="fr-mono fr-muted hidden max-w-[10rem] truncate xl:inline">
              {user?.adminRoleName || "Admin"}
            </span>
            <button type="button" onClick={() => setMoreOpen(true)} className="fr-mono fr-choice is-active min-h-11 lg:hidden">
              Menu
            </button>
            <button type="button" onClick={() => void logout()} className="fr-mono fr-choice hidden min-h-11 lg:inline">
              Sign out
            </button>
          </div>
        </header>

        {moreOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Atelier menu"
            className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)] px-5 pb-10 pt-5 lg:px-10"
          >
            <div className="flex items-center justify-between">
              <span className="fr-mono">Atelier</span>
              <button type="button" onClick={() => setMoreOpen(false)} className="fr-mono fr-choice is-active min-h-11">
                Close ×
              </button>
            </div>
            {searchForm("mt-8 max-w-md")}
            <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {groupedNavigation.map(([group, items]) => (
                <div key={group} className="flex flex-col gap-2">
                  <span className="fr-mono fr-muted">{group}</span>
                  {items.map((item) => {
                    const active =
                      pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`fr-choice fr-word text-[clamp(1.75rem,3vw,2.5rem)] ${active ? "is-active" : ""}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] pt-6">
              <Link href="/" className="fr-mono fr-link">
                View the store ↗
              </Link>
              <button type="button" onClick={toggleTheme} className="fr-mono fr-choice is-active fr-link">
                {isDark ? "Light" : "Dark"} mode
              </button>
              <button type="button" onClick={() => void logout()} className="fr-mono fr-choice is-active fr-link">
                Sign out
              </button>
              {user?.email ? <span className="fr-mono fr-muted">{user.email}</span> : null}
            </div>
          </div>
        ) : null}

        <main className="px-5 py-8 lg:px-10 lg:py-10">
          {canViewRoute ? (
            children
          ) : (
            <AdminPanel className="min-h-[360px]">
              <AdminSectionLabel>Restricted access</AdminSectionLabel>
              <h1 className="fr-word mt-4 max-w-2xl text-[clamp(2.5rem,6vw,4.5rem)]">Not in your role.</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Your current role is {user?.adminRoleName || "Admin"}. Ask a Super Admin to change your role if you
                need this area.
              </p>
              <Link href="/admin" className="fr-mono fr-link mt-7 inline-flex">
                Back to the workbench
              </Link>
            </AdminPanel>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
