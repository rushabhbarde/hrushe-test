"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOptionalCart } from "@/components/cart-provider";
import { useOptionalCustomerAuth } from "@/components/customer-auth-provider";
import { useOptionalWishlist } from "@/components/wishlist-provider";
import { apiRequest } from "@/lib/api";
import {
  HRUSHE_LOGO_DIMENSIONS,
  HRUSHE_LOGO_PATH,
} from "@/lib/brand-assets";
import {
  defaultAdminWorkspace,
  getHomepageSectionsForAudience,
  normalizeAdminWorkspace,
  type HomeManagement,
  type HomepageAudience,
  type HomepageSection,
} from "@/lib/admin-workspace";
import { resolveHomepageMediaUrl } from "@/lib/homepage-media";

const noop = () => {};

type AudienceMenuKey = "Women" | "Men";
type AudienceMenuItem = {
  href: string;
  label: string;
  tone?: "sale";
};
type AudienceMenuCard = {
  href: string;
  label: string;
  image: string;
  imageAlt: string;
  objectPosition: string;
};
type AudienceMenu = {
  image: string;
  imageAlt: string;
  cards: AudienceMenuCard[];
  featured: AudienceMenuItem[];
  categories: AudienceMenuItem[];
};
type AudienceMenus = Record<AudienceMenuKey, AudienceMenu>;
type HomepageManagementPayload = Partial<HomeManagement> & {
  hasCustomSections?: boolean;
};

const defaultAudienceMenus: AudienceMenus = {
  Women: {
    image: "",
    imageAlt: "HRUSHE womenswear edit",
    cards: [
      {
        href: "/shop",
        label: "Sale: New Pieces Added",
        image: "",
        imageAlt: "HRUSHE womenswear sale edit",
        objectPosition: "center",
      },
      {
        href: "/women",
        label: "Shop Women",
        image: "",
        imageAlt: "HRUSHE womenswear campaign",
        objectPosition: "right center",
      },
    ],
    featured: [
      { href: "/women", label: "Women Home" },
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
    image: "",
    imageAlt: "HRUSHE menswear edit",
    cards: [
      {
        href: "/shop",
        label: "Sale: New Pieces Added",
        image: "",
        imageAlt: "HRUSHE menswear sale edit",
        objectPosition: "center",
      },
      {
        href: "/men",
        label: "Shop Men",
        image: "",
        imageAlt: "HRUSHE menswear campaign",
        objectPosition: "left center",
      },
    ],
    featured: [
      { href: "/men", label: "Men Home" },
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
};

const audienceMenuKeys: AudienceMenuKey[] = ["Women", "Men"];
const audienceMap: Record<AudienceMenuKey, HomepageAudience> = {
  Women: "women",
  Men: "men",
};


function normalizeHomepageManagementPayload(payload: HomepageManagementPayload) {
  const { hasCustomSections, ...homeManagementPayload } = payload || {};
  const hasSectionsPayload = Array.isArray(payload?.sections);
  const sectionsPayload =
    hasSectionsPayload && (hasCustomSections || payload.sections!.length > 0)
      ? payload.sections!
      : defaultAdminWorkspace.homeManagement.sections;

  return normalizeAdminWorkspace({
    homeManagement: {
      ...defaultAdminWorkspace.homeManagement,
      ...homeManagementPayload,
      sections: sectionsPayload,
    },
  }).homeManagement;
}

function sectionToMenuCard(
  section: HomepageSection | undefined,
  fallback: AudienceMenuCard
): AudienceMenuCard {
  if (!section) {
    return fallback;
  }

  return {
    href: section.ctaLink || fallback.href,
    label: section.title || fallback.label,
    image:
      resolveHomepageMediaUrl(section.image) ||
      resolveHomepageMediaUrl(section.mobileImage) ||
      fallback.image,
    imageAlt: section.imageAlt || fallback.imageAlt,
    objectPosition: section.objectPosition || fallback.objectPosition,
  };
}

function buildAudienceMenus(homeManagement: HomeManagement): AudienceMenus {
  return audienceMenuKeys.reduce((menus, key) => {
    const fallback = defaultAudienceMenus[key];
    const sections = getHomepageSectionsForAudience(homeManagement, audienceMap[key]);
    const saleSection = sections.find((section) => section.sectionType === "sale-banner");
    const heroSection = sections.find((section) => section.sectionType === "audience-hero");

    menus[key] = {
      ...fallback,
      image: resolveHomepageMediaUrl(heroSection?.image) || fallback.image,
      imageAlt: heroSection?.imageAlt || fallback.imageAlt,
      cards: [
        sectionToMenuCard(saleSection, fallback.cards[0]),
        sectionToMenuCard(heroSection, fallback.cards[1]),
      ],
    };

    return menus;
  }, {} as AudienceMenus);
}


function MenuOverlay({
  open,
  onClose,
  initialSide,
  audienceMenus,
  isAuthenticated,
  loginHref,
  wishlistCount,
  onOpenWishlist,
}: {
  open: boolean;
  onClose: () => void;
  initialSide: AudienceMenuKey;
  audienceMenus: AudienceMenus;
  isAuthenticated: boolean;
  loginHref: string;
  wishlistCount: number;
  onOpenWishlist: () => void;
}) {
  const [side, setSide] = useState<AudienceMenuKey>(initialSide);
  const menu = audienceMenus[side];
  const sidePath = side === "Men" ? "men" : "women";
  const links = [
    { href: "/new-in", label: "New in" },
    { href: `/collection/${sidePath}`, label: `All ${side.toLowerCase()}` },
    ...menu.featured,
    ...menu.categories.filter((item) => item.tone !== "sale"),
  ].filter(
    (item, index, items) =>
      !/home$/i.test(item.label) &&
      items.findIndex((candidate) => candidate.href === item.href) === index
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[120] flex flex-col overflow-y-auto bg-[var(--background)]"
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-5 lg:h-[5.5rem] lg:px-10">
        <Link href="/" onClick={onClose} aria-label="HRUSHE home">
          <Image
            src={HRUSHE_LOGO_PATH}
            alt="HRUSHE"
            width={HRUSHE_LOGO_DIMENSIONS.width}
            height={HRUSHE_LOGO_DIMENSIONS.height}
            className="h-7 w-auto lg:h-9"
          />
        </Link>
        <button type="button" onClick={onClose} className="fr-mono fr-choice is-active min-h-11 px-2">
          Close
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-8 px-5 pb-8 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="flex items-baseline gap-5 lg:flex-col lg:gap-2" role="group" aria-label="Collection">
          {(["Men", "Women"] as AudienceMenuKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSide(key)}
              aria-pressed={side === key}
              className={`fr-choice fr-word text-[3.25rem]! lg:text-[7rem]! ${side === key ? "is-active" : ""}`}
            >
              {key}
            </button>
          ))}
        </div>

        <nav aria-label={`${side} categories`} className="flex flex-col">
          {links.map((item) => (
            <Link
              key={`${side}-${item.href}-${item.label}`}
              href={item.href}
              onClick={onClose}
              className="fr-index-row is-active grid-cols-[minmax(0,1fr)_auto]! py-3"
            >
              <span className="fr-word text-[2rem] lg:text-[3rem]">{item.label}</span>
              <span className="fr-mono" aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--border)] px-5 py-5 lg:px-10">
        <Link href={isAuthenticated ? "/account" : loginHref} onClick={onClose} className="fr-mono">
          {isAuthenticated ? "Wardrobe" : "Sign in"}
        </Link>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenWishlist();
          }}
          className="fr-mono fr-choice is-active min-h-11"
        >
          Saved{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
        </button>
        <Link href="/track-order" onClick={onClose} className="fr-mono">
          Track order
        </Link>
        <Link href="/story" onClick={onClose} className="fr-mono">
          Our story
        </Link>
        <Link href="/contact" onClick={onClose} className="fr-mono">
          Contact
        </Link>
        <button
          type="button"
          onClick={() => {
            onClose();
            window.dispatchEvent(new CustomEvent("hrushe:open-support"));
          }}
          className="fr-mono fr-choice is-active min-h-11"
        >
          Help
        </button>
        <span className="ml-auto text-[0.8rem] text-[var(--muted)]">Defined quietly.</span>
      </div>
    </div>
  );
}

function hidesMobileBar(pathname: string) {
  return pathname.startsWith("/product/") || pathname.startsWith("/checkout");
}

export function SiteHeader() {
  const pathname = usePathname();
  const cart = useOptionalCart();
  const wishlist = useOptionalWishlist();
  const customerAuth = useOptionalCustomerAuth();
  const itemCount = cart?.itemCount || 0;
  const openCart = cart?.openCart || noop;
  const wishlistCount = wishlist?.itemCount || 0;
  const openWishlist = wishlist?.openWishlist || noop;
  const isAuthenticated = customerAuth?.isAuthenticated || false;
  const router = useRouter();
  const routeSide: AudienceMenuKey | null =
    pathname.startsWith("/men") || pathname.startsWith("/collection/men")
      ? "Men"
      : pathname.startsWith("/women") || pathname.startsWith("/collection/women")
        ? "Women"
        : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [audienceMenus, setAudienceMenus] = useState<AudienceMenus>(() =>
    buildAudienceMenus(defaultAdminWorkspace.homeManagement)
  );
  const loginHref = `/login?next=${encodeURIComponent("/account")}`;
  const openSaved = isAuthenticated ? openWishlist : () => router.push(loginHref);
  const showMobileBar = !hidesMobileBar(pathname);

  useEffect(() => {
    let active = true;

    void apiRequest<HomepageManagementPayload>("/content/homepage-management")
      .then((payload) => {
        if (active) {
          setAudienceMenus(buildAudienceMenus(normalizeHomepageManagementPayload(payload)));
        }
      })
      .catch(() => {
        if (active) {
          setAudienceMenus(buildAudienceMenus(defaultAdminWorkspace.homeManagement));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const sideLink = (key: AudienceMenuKey, className: string) => (
    <Link
      key={key}
      href={key === "Men" ? "/men" : "/women"}
      aria-current={routeSide === key ? "page" : undefined}
      className={`fr-choice ${routeSide === key ? "is-active" : ""} ${className}`}
    >
      {key}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--header-background)]">
        <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-5 lg:h-[5.5rem] lg:px-10">
          <nav aria-label="Site" className="hidden items-center gap-6 lg:flex">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="fr-mono fr-choice is-active min-h-11"
            >
              Menu
            </button>
            <span className="h-3 w-px bg-[var(--border)]" aria-hidden="true" />
            {(["Women", "Men"] as AudienceMenuKey[]).map((key) => sideLink(key, "fr-mono min-h-11 inline-flex items-center"))}
          </nav>
          <span className="lg:hidden" />

          <Link href="/" aria-label="HRUSHE home" className="justify-self-center">
            <Image
              src={HRUSHE_LOGO_PATH}
              alt="HRUSHE"
              width={HRUSHE_LOGO_DIMENSIONS.width}
              height={HRUSHE_LOGO_DIMENSIONS.height}
              priority
              className="h-6 w-auto object-contain lg:h-9"
            />
          </Link>

          <nav aria-label="Account" className="hidden items-center justify-end gap-6 lg:flex">
            <Link href="/search" className="fr-mono min-h-11 inline-flex items-center">
              Search
            </Link>
            <Link href={isAuthenticated ? "/account" : loginHref} className="fr-mono min-h-11 inline-flex items-center">
              {isAuthenticated ? "Wardrobe" : "Account"}
            </Link>
            <button type="button" onClick={openSaved} className="fr-mono fr-choice is-active min-h-11">
              Saved{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
            </button>
            <button type="button" onClick={openCart} className="fr-mono fr-choice is-active min-h-11">
              Bag ({itemCount})
            </button>
          </nav>
          <span className="lg:hidden" />
        </div>
      </header>

      {showMobileBar ? (
        <nav aria-label="Main" className="fr-cap lg:hidden">
          <div className="flex items-baseline gap-4">
            {(["Men", "Women"] as AudienceMenuKey[]).map((key) => sideLink(key, "fr-word text-[1.5rem] min-h-11 inline-flex items-center"))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/search" className="fr-mono inline-flex min-h-11 items-center">
              Search
            </Link>
            <button type="button" onClick={openCart} className="fr-mono fr-choice is-active min-h-11">
              Bag {itemCount}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="fr-mono fr-choice is-active min-h-11"
            >
              Menu
            </button>
          </div>
        </nav>
      ) : null}

      <MenuOverlay
        key={menuOpen ? "open" : "closed"}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        initialSide={routeSide || "Men"}
        audienceMenus={audienceMenus}
        isAuthenticated={isAuthenticated}
        loginHref={loginHref}
        wishlistCount={wishlistCount}
        onOpenWishlist={openSaved}
      />
    </>
  );
}
