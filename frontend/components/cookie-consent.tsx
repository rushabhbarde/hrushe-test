"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getCookieConsentSnapshot,
  getServerCookieConsentSnapshot,
  OPEN_COOKIE_PREFERENCES_EVENT,
  saveCookieConsent,
  subscribeToCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

type ConsentView = "default" | "hidden" | "preferences";
type OptionalPreferences = Pick<CookieConsent, "analytics" | "marketing">;

const defaultPreferences: OptionalPreferences = {
  analytics: false,
  marketing: false,
};

export function CookieConsentBanner() {
  const pathname = usePathname();
  const storedConsent = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    getServerCookieConsentSnapshot
  );
  const [view, setView] = useState<ConsentView>("default");
  const [preferences, setPreferences] =
    useState<OptionalPreferences>(defaultPreferences);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openPreferences = () => {
      const currentConsent = getCookieConsentSnapshot();
      setPreferences(
        currentConsent
          ? {
              analytics: currentConsent.analytics,
              marketing: currentConsent.marketing,
            }
          : defaultPreferences
      );
      setView("preferences");
    };

    window.addEventListener(
      OPEN_COOKIE_PREFERENCES_EVENT,
      openPreferences
    );
    return () => {
      window.removeEventListener(
        OPEN_COOKIE_PREFERENCES_EVENT,
        openPreferences
      );
    };
  }, []);

  useEffect(() => {
    if (view !== "preferences") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = dialog
      ? Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      : [];

    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setView(getCookieConsentSnapshot() ? "hidden" : "default");
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [view]);

  function commitConsent(nextPreferences: OptionalPreferences) {
    setPreferences(nextPreferences);
    saveCookieConsent(nextPreferences);
    setView("hidden");
  }

  if (
    pathname.startsWith("/admin") ||
    storedConsent === undefined ||
    view === "hidden" ||
    (storedConsent && view !== "preferences")
  ) {
    return null;
  }

  if (view === "preferences") {
    return (
      <div
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
        role="presentation"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          aria-describedby="cookie-preferences-description"
          className="max-h-[92dvh] w-full overflow-y-auto bg-[var(--background)] text-[var(--foreground)] sm:max-w-[600px]"
        >
          <div className="flex items-start justify-between gap-6 px-5 pb-2 pt-6 sm:px-8 sm:pt-8">
            <div className="flex flex-col gap-3">
              <p className="fr-mono fr-muted">Your privacy</p>
              <h2 id="cookie-preferences-title" className="fr-word text-[clamp(2.5rem,8vw,3.5rem)]">
                Cookies.
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                setView(getCookieConsentSnapshot() ? "hidden" : "default")
              }
              className="fr-mono fr-choice is-active min-h-11"
              aria-label="Close cookie preferences"
            >
              Close ×
            </button>
          </div>

          <div className="flex flex-col px-5 py-5 sm:px-8">
            <p
              id="cookie-preferences-description"
              className="mb-3 max-w-2xl text-sm leading-6 text-[var(--muted)]"
            >
              Choose which optional technologies HRUSHE may use. Essential
              cookies remain active because they secure login, cart, checkout,
              and your privacy choices.
            </p>

            <ConsentCategory
              title="Essential"
              description="Required for authentication, fraud prevention, cart, checkout, and preference storage."
              checked
              locked
            />
            <ConsentCategory
              title="Analytics"
              description="Helps us understand visits and improve product discovery without changing essential site behavior."
              checked={preferences.analytics}
              onChange={(analytics) =>
                setPreferences((current) => ({ ...current, analytics }))
              }
            />
            <ConsentCategory
              title="Marketing"
              description="Allows advertising measurement and more relevant campaign experiences."
              checked={preferences.marketing}
              onChange={(marketing) =>
                setPreferences((current) => ({ ...current, marketing }))
              }
            />
          </div>

          <div className="grid gap-3 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 sm:grid-cols-2 sm:px-8 sm:pb-8">
            <button
              type="button"
              onClick={() => commitConsent(defaultPreferences)}
              className="fr-mono min-h-[3.25rem] border border-[var(--foreground)]"
            >
              Decline all optional
            </button>
            <button type="button" onClick={() => commitConsent(preferences)} className="fr-button">
              Save choices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[113] border-t border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[var(--background)] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-[var(--foreground)] lg:px-10 lg:py-5"
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline lg:gap-6">
          <div className="flex items-center justify-between gap-4 lg:contents">
            <p className="fr-mono fr-muted shrink-0">Your privacy</p>
            <button
              type="button"
              onClick={() => setView("preferences")}
              className="fr-mono fr-choice is-active fr-link min-h-11 lg:hidden"
            >
              Preferences
            </button>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Essential cookies run the store. Analytics and marketing ones only with your yes.{" "}
            <Link href="/policies?tab=privacy" className="fr-link text-[var(--foreground)]">
              Privacy policy
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-2 items-center gap-3 lg:grid-cols-[auto_auto_auto] lg:gap-x-6">
          <button
            type="button"
            onClick={() => setView("preferences")}
            className="fr-mono fr-choice is-active fr-link hidden min-h-11 lg:inline"
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={() => commitConsent(defaultPreferences)}
            className="fr-mono min-h-11 border border-[var(--foreground)] px-5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => commitConsent({ analytics: true, marketing: true })}
            className="fr-button min-h-11! px-5"
          >
            Accept all
          </button>
        </div>
      </div>
    </aside>
  );
}

function ConsentCategory({
  title,
  description,
  checked,
  locked = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] py-4">
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="fr-word text-[1.6rem]">{title}</h3>
          {locked ? <span className="fr-mono fr-muted">Always on</span> : null}
        </div>
        <p className="mt-2 max-w-md text-xs leading-5 text-[var(--muted)]">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${title} cookies`}
        disabled={locked}
        onClick={() => onChange?.(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 border transition ${
          checked
            ? "border-[var(--foreground)] bg-[var(--foreground)]"
            : "border-[var(--border)] bg-[var(--surface-strong)]"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span
          className={`absolute left-0 top-1 h-[18px] w-[18px] bg-[var(--background)] transition-transform ${
            checked ? "translate-x-[25px]" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
