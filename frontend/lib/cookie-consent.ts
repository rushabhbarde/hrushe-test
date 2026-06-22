export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_CHANGED_EVENT = "hrushe_cookie_consent_changed";
export const OPEN_COOKIE_PREFERENCES_EVENT = "hrushe_open_cookie_preferences";

const COOKIE_NAME = "hrushe-cookie-consent";
const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
let consentSnapshot: CookieConsent | null | undefined;

export type CookieConsent = {
  version: typeof COOKIE_CONSENT_VERSION;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

function readCookieValue(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

export function readCookieConsent(): CookieConsent | null {
  const value = readCookieValue(COOKIE_NAME);

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<CookieConsent>;

    if (parsed.version !== COOKIE_CONSENT_VERSION) {
      return null;
    }

    return {
      version: COOKIE_CONSENT_VERSION,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return null;
  }
}

export function getCookieConsentSnapshot() {
  if (consentSnapshot === undefined) {
    consentSnapshot = readCookieConsent();
  }

  return consentSnapshot;
}

export function getServerCookieConsentSnapshot() {
  return undefined;
}

export function subscribeToCookieConsent(onStoreChange: () => void) {
  const handleConsentChange = (event: Event) => {
    consentSnapshot =
      (event as CustomEvent<CookieConsent>).detail || readCookieConsent();
    onStoreChange();
  };

  window.addEventListener(
    COOKIE_CONSENT_CHANGED_EVENT,
    handleConsentChange
  );
  return () => {
    window.removeEventListener(
      COOKIE_CONSENT_CHANGED_EVENT,
      handleConsentChange
    );
  };
}

export function saveCookieConsent(
  preferences: Pick<CookieConsent, "analytics" | "marketing">
) {
  const consent: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    updatedAt: new Date().toISOString(),
  };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(consent)
  )}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  consentSnapshot = consent;
  window.dispatchEvent(
    new CustomEvent<CookieConsent>(COOKIE_CONSENT_CHANGED_EVENT, {
      detail: consent,
    })
  );

  return consent;
}

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
  }
}
