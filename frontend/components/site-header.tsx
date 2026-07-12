"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useWishlist } from "@/components/wishlist-provider";

const navItems = [
  { href: "/women", label: "Women" },
  { href: "/men", label: "Men" },
  { href: "/new-in", label: "New In" },
  { href: "/story", label: "Story" },
];

const audienceMenus = {
  Women: {
    image: "/uploads/banners/banner2.png",
    imageAlt: "HRUSHE womenswear edit",
    cards: [
      {
        href: "/shop",
        label: "Sale: New Pieces Added",
        image: "/uploads/banners/banner2.png",
        imageAlt: "HRUSHE womenswear sale edit",
        objectPosition: "center",
      },
      {
        href: "/women",
        label: "Shop Women",
        image: "/uploads/banners/banner2.png",
        imageAlt: "HRUSHE womenswear campaign",
        objectPosition: "right center",
      },
    ],
    featured: [
      { href: "/women", label: "Women Home" },
      { href: "/new-in", label: "New Arrivals" },
      { href: "/collection/women", label: "All Womenswear" },
    ],
    categories: [
      { href: "/collection/women", label: "Clothing" },
      { href: "/shop", label: "Sale: New Pieces Added", tone: "sale" },
      { href: "/shop", label: "T-Shirts" },
      { href: "/shop", label: "Oversized Fits" },
      { href: "/shop", label: "Accessories" },
    ],
  },
  Men: {
    image: "/uploads/banners/banner1.png",
    imageAlt: "HRUSHE menswear edit",
    cards: [
      {
        href: "/shop",
        label: "Sale: New Pieces Added",
        image: "/uploads/banners/banner1.png",
        imageAlt: "HRUSHE menswear sale edit",
        objectPosition: "center",
      },
      {
        href: "/men",
        label: "Shop Men",
        image: "/uploads/banners/banner1.png",
        imageAlt: "HRUSHE menswear campaign",
        objectPosition: "left center",
      },
    ],
    featured: [
      { href: "/men", label: "Men Home" },
      { href: "/new-in", label: "New Arrivals" },
      { href: "/collection/men", label: "All Menswear" },
    ],
    categories: [
      { href: "/collection/men", label: "Clothing" },
      { href: "/shop", label: "Sale: New Pieces Added", tone: "sale" },
      { href: "/shop", label: "T-Shirts" },
      { href: "/shop", label: "Relaxed Fits" },
      { href: "/shop", label: "Accessories" },
    ],
  },
} as const;

function routeIsActive(pathname: string, href: string) {
  if (href === "/women") {
    return pathname === href || pathname.startsWith("/collection/women");
  }

  if (href === "/men") {
    return pathname === href || pathname.startsWith("/collection/men");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function HeaderIcon({
  label,
  children,
  onClick,
  href,
  expanded,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  expanded?: boolean;
}) {
  const className =
    "flex h-11 w-11 items-center justify-center transition hover:bg-[var(--hover-fill)]";

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 -0.5 25 25" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M11.75 9.874C11.75 10.2882 12.0858 10.624 12.5 10.624C12.9142 10.624 13.25 10.2882 13.25 9.874H11.75ZM13.25 4C13.25 3.58579 12.9142 3.25 12.5 3.25C12.0858 3.25 11.75 3.58579 11.75 4H13.25ZM9.81082 6.66156C10.1878 6.48991 10.3542 6.04515 10.1826 5.66818C10.0109 5.29121 9.56615 5.12478 9.18918 5.29644L9.81082 6.66156ZM5.5 12.16L4.7499 12.1561L4.75005 12.1687L5.5 12.16ZM12.5 19L12.5086 18.25C12.5029 18.25 12.4971 18.25 12.4914 18.25L12.5 19ZM19.5 12.16L20.2501 12.1687L20.25 12.1561L19.5 12.16ZM15.8108 5.29644C15.4338 5.12478 14.9891 5.29121 14.8174 5.66818C14.6458 6.04515 14.8122 6.48991 15.1892 6.66156L15.8108 5.29644ZM13.25 9.874V4H11.75V9.874H13.25ZM9.18918 5.29644C6.49843 6.52171 4.7655 9.19951 4.75001 12.1561L6.24999 12.1639C6.26242 9.79237 7.65246 7.6444 9.81082 6.66156L9.18918 5.29644ZM4.75005 12.1687C4.79935 16.4046 8.27278 19.7986 12.5086 19.75L12.4914 18.25C9.08384 18.2892 6.28961 15.5588 6.24995 12.1513L4.75005 12.1687ZM12.4914 19.75C16.7272 19.7986 20.2007 16.4046 20.2499 12.1687L18.7501 12.1513C18.7104 15.5588 15.9162 18.2892 12.5086 18.25L12.4914 19.75ZM20.25 12.1561C20.2345 9.19951 18.5016 6.52171 15.8108 5.29644L15.1892 6.66156C17.3475 7.6444 18.7376 9.79237 18.75 12.1639L20.25 12.1561Z"
        fill="#d61f26"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M7 10.5c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4v6.2c0 2.2-1.8 4-4 4h-3.2L16 24.2l-2.4-3.5H11c-2.2 0-4-1.8-4-4v-6.2Z" strokeLinejoin="round" />
      <path d="M16 3.6V1.8M8.7 6.2 7.4 4.9M23.3 6.2l1.3-1.3M10.2 25.7l-1.3 1.3M21.8 25.7l1.3 1.3M16 28.4v1.8" strokeLinecap="round" />
      <text x="16" y="15.6" textAnchor="middle" fontSize="5.9" fontWeight="700" letterSpacing="0.3" fill="currentColor" stroke="none">
        HELP
      </text>
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.6L12 15.5l-6.5 4.1V6A1.5 1.5 0 0 1 7 4.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { itemCount: wishlistCount, openWishlist } = useWishlist();
  const { isAuthenticated, user, logout } = useCustomerAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [activeAudienceMenu, setActiveAudienceMenu] = useState<keyof typeof audienceMenus | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement | null>(null);
  const accountInitial = user?.name?.charAt(0).toUpperCase() || "H";
  const loginHref = `/login?next=${encodeURIComponent("/account")}`;

  useEffect(() => {
    if (!isAccountMenuOpen && !isMobileMenuOpen && !activeAudienceMenu) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (
        !mobileMenuRef.current?.contains(event.target as Node) &&
        !mobileMenuToggleRef.current?.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
        setActiveAudienceMenu(null);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeAudienceMenu, isAccountMenuOpen, isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--header-background)]"
      onMouseLeave={() => setActiveAudienceMenu(null)}
    >
      <div className="border-b border-[var(--border)] px-4 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <span>Dispatches in 1–3 business days · 7-day returns</span>
          <span className="hidden sm:block">One free size exchange</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-2 lg:gap-7">
            <button
              ref={mobileMenuToggleRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center lg:hidden"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-site-navigation"
            >
              <span className="relative flex h-4 w-5 items-center justify-center">
                <span
                  className={`absolute h-px w-5 bg-[var(--foreground)] transition ${
                    isMobileMenuOpen ? "rotate-45" : "-translate-y-[5px]"
                  }`}
                />
                <span
                  className={`absolute h-px w-5 bg-[var(--foreground)] transition ${
                    isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute h-px w-5 bg-[var(--foreground)] transition ${
                    isMobileMenuOpen ? "-rotate-45" : "translate-y-[5px]"
                  }`}
                />
              </span>
            </button>

            <nav className="hidden items-center gap-7 text-[0.74rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)] lg:flex">
              {navItems.map((item) => {
                const audienceMenu = item.label in audienceMenus ? (item.label as keyof typeof audienceMenus) : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setActiveAudienceMenu(audienceMenu)}
                    onFocus={() => setActiveAudienceMenu(audienceMenu)}
                    aria-current={routeIsActive(pathname, item.href) ? "page" : undefined}
                    className={routeIsActive(pathname, item.href) ? "nav-link-active" : "hover:text-[var(--foreground)]"}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/NEW_LOGO.png"
              alt="HRUSHE"
              width={220}
              height={72}
              priority
              className="h-9 w-auto object-contain sm:h-10 lg:h-12"
            />
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <div ref={accountMenuRef} className="relative hidden lg:block">
              {isAuthenticated ? (
                <HeaderIcon
                  label="Account"
                  expanded={isAccountMenuOpen}
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                >
                  <span className="flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[var(--accent)]/8 text-sm font-semibold text-[var(--accent)]">
                    {accountInitial}
                  </span>
                </HeaderIcon>
              ) : (
                <HeaderIcon label="Account" onClick={() => router.push(loginHref)}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.7-3.3 4.3-5 8-5s6.3 1.7 8 5" />
                  </svg>
                </HeaderIcon>
              )}

              {isAccountMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[190px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
                  <Link href="/account" className="block px-4 py-3 text-sm hover:bg-[var(--hover-fill)]" onClick={() => setIsAccountMenuOpen(false)}>
                    My account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      void logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--accent)] hover:bg-[var(--hover-fill)]"
                  >
                    <LogoutIcon />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>

            <div className="hidden lg:block">
              <HeaderIcon
                label="Saved"
                onClick={isAuthenticated ? openWishlist : () => router.push(loginHref)}
              >
                <span className="relative inline-flex">
                  <SaveIcon />
                  {wishlistCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-[var(--accent)] px-1 text-[9px] font-semibold text-white">
                      {wishlistCount}
                    </span>
                  ) : null}
                </span>
              </HeaderIcon>
            </div>

            <HeaderIcon label="Search" href="/search">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </HeaderIcon>

            <HeaderIcon label="Cart" onClick={openCart}>
              <span className="relative inline-flex">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M16 8H17.1597C18.1999 8 19.0664 8.79732 19.1528 9.83391L19.8195 17.8339C19.9167 18.9999 18.9965 20 17.8264 20H6.1736C5.00352 20 4.08334 18.9999 4.18051 17.8339L4.84718 9.83391C4.93356 8.79732 5.80009 8 6.84027 8H8M16 8H8M16 8L16 7C16 5.93913 15.5786 4.92172 14.8284 4.17157C14.0783 3.42143 13.0609 3 12 3C10.9391 3 9.92172 3.42143 9.17157 4.17157C8.42143 4.92172 8 5.93913 8 7L8 8M16 8L16 12M8 8L8 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {itemCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-[var(--accent)] px-1 text-[9px] font-semibold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </span>
            </HeaderIcon>

            <HeaderIcon
              label="Support"
              onClick={() => window.dispatchEvent(new CustomEvent("hrushe:open-support"))}
            >
              <SupportIcon />
            </HeaderIcon>

          </div>
        </div>
      </div>

      {activeAudienceMenu ? (
        <div className="absolute left-0 top-full hidden h-[calc(100svh-100%)] w-[min(760px,52vw)] overflow-hidden border-r border-t border-[var(--border)] bg-[var(--background)] shadow-[18px_28px_60px_rgba(0,0,0,0.08)] lg:grid lg:grid-cols-[1.12fr_1fr]">
          <div className="flex h-full flex-col overflow-y-auto px-8 py-7">
            <div className="space-y-4 text-[0.9rem] font-semibold uppercase tracking-[0.02em]">
              {audienceMenus[activeAudienceMenu].featured.map((item) => (
                <Link
                  key={`${activeAudienceMenu}-${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setActiveAudienceMenu(null)}
                  className="block hover:text-[var(--accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-14 space-y-4 text-[0.92rem]">
              {audienceMenus[activeAudienceMenu].categories.map((item) => (
                <Link
                  key={`${activeAudienceMenu}-${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setActiveAudienceMenu(null)}
                  className={`block hover:text-[var(--accent)] ${
                    "tone" in item && item.tone === "sale" ? "font-medium text-[var(--accent)]" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-auto space-y-4 text-[0.86rem]">
              <Link href="/signup" onClick={() => setActiveAudienceMenu(null)} className="block hover:text-[var(--accent)]">
                Sign up for first access
              </Link>
              <Link
                href={isAuthenticated ? "/account" : loginHref}
                onClick={() => setActiveAudienceMenu(null)}
                className="block hover:text-[var(--accent)]"
              >
                My Account
              </Link>
              <Link href="/contact" onClick={() => setActiveAudienceMenu(null)} className="block hover:text-[var(--accent)]">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--surface)]">
            {audienceMenus[activeAudienceMenu].cards.map((card) => (
              <Link
                key={`${activeAudienceMenu}-${card.href}-${card.label}`}
                href={card.href}
                onClick={() => setActiveAudienceMenu(null)}
                className="group relative block h-[34.25rem] min-h-[34.25rem] max-h-[34.25rem] overflow-hidden border-b border-white/10 last:border-b-0"
              >
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  sizes="360px"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  style={{ objectPosition: card.objectPosition }}
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/55 to-transparent px-7 pb-7 pt-20 text-[0.86rem] font-semibold uppercase tracking-[0.05em] text-white">
                  <span>{card.label}</span>
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    ›
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {isMobileMenuOpen ? (
        <div id="mobile-site-navigation" className="border-t border-[var(--border)] lg:hidden">
          <div ref={mobileMenuRef} className="mobile-drawer-enter mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
            <div className="bg-[var(--background)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <p className="eyebrow text-[var(--muted)]">Menu</p>
                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                  HRUSHE
                </p>
              </div>
              <nav className="mt-2 flex flex-col divide-y divide-[var(--border)] text-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={routeIsActive(pathname, item.href) ? "page" : undefined}
                    className={`flex items-center justify-between px-1 py-4 text-[0.78rem] font-medium uppercase tracking-[0.16em] ${
                      routeIsActive(pathname, item.href) ? "text-[var(--accent)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
                {isAuthenticated ? (
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="px-1 py-4 text-[0.78rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Signed in as {user?.name}
                  </Link>
                ) : null}
              </nav>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isAuthenticated) {
                      router.push("/account");
                    } else {
                      router.push(loginHref);
                    }
                  }}
                  className="min-h-11 border border-[var(--border)] text-[0.68rem] font-medium uppercase tracking-[0.14em]"
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isAuthenticated) {
                      openWishlist();
                    } else {
                      router.push(loginHref);
                    }
                  }}
                  className="min-h-11 border border-[var(--border)] text-[0.68rem] font-medium uppercase tracking-[0.14em]"
                >
                  Save{wishlistCount > 0 ? ` ${wishlistCount}` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openCart();
                  }}
                  className="min-h-11 border border-[var(--foreground)] bg-[var(--foreground)] text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--background)]"
                >
                  Cart{itemCount > 0 ? ` ${itemCount}` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
