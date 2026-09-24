import type { HomepageCard } from "@/lib/admin-workspace";

export type GatewaySide = "women" | "men";

export type GatewayOption = {
  id: string;
  side: GatewaySide | null;
  label: string;
  href: string;
  image: string;
  mobileImage: string;
  alt: string;
  objectPosition: string;
};

export const GATEWAY_INTRO_MS = 1500;
export const GATEWAY_AUTO_SWAP_MS = 4200;
export const GATEWAY_SIDE_COOKIE = "hrushe_side";
const GATEWAY_SIDE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const GATEWAY_INTRO_STORAGE_KEY = "hrushe:gateway-intro-seen";

export function isGatewaySide(value: unknown): value is GatewaySide {
  return value === "women" || value === "men";
}

function sideFromHref(href: string): GatewaySide | null {
  const lastSegment = href.split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop()?.toLowerCase();
  return isGatewaySide(lastSegment) ? lastSegment : null;
}

export function toGatewayOption(card: HomepageCard): GatewayOption {
  const href = card.ctaLink || "/shop";
  const side = sideFromHref(href);
  const label = side === "women" ? "Women" : side === "men" ? "Men" : card.title.replace(/^shop\s+/i, "").trim() || card.title;

  return {
    id: card.id,
    side,
    label,
    href,
    image: card.image,
    mobileImage: card.mobileImage,
    alt: card.imageAlt || card.title,
    objectPosition: card.objectPosition,
  };
}

export function hasSeenGatewayIntro() {
  try {
    return window.localStorage.getItem(GATEWAY_INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGatewayIntroSeen() {
  try {
    window.localStorage.setItem(GATEWAY_INTRO_STORAGE_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); the intro simply plays again.
  }
}

export function rememberGatewaySide(side: GatewaySide | null) {
  if (!side || typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${GATEWAY_SIDE_COOKIE}=${side}; Max-Age=${GATEWAY_SIDE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Returning visitors who arrive from outside the site skip the gateway and land on the side they chose last.
 * Internal navigation to "/" (e.g. the header logo) and `/?choose` always show the gateway.
 */
export function getGatewayRedirectPath({
  sideCookie,
  referer,
  host,
  wantsGateway,
  isRscRequest,
}: {
  sideCookie: string | undefined;
  referer: string | null;
  host: string;
  wantsGateway: boolean;
  isRscRequest: boolean;
}) {
  if (!isGatewaySide(sideCookie) || wantsGateway || isRscRequest) {
    return null;
  }

  if (referer) {
    try {
      if (new URL(referer).host === host) {
        return null;
      }
    } catch {
      // Malformed referer: treat as an external arrival.
    }
  }

  return `/${sideCookie}`;
}
