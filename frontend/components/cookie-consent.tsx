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
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
        role="presentation"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          aria-describedby="cookie-preferences-description"
          className="max-h-[92dvh] w-full overflow-y-auto border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] sm:max-w-[640px]"
        >
          <div className="flex items-start justify-between gap-6 border-b border-[var(--border)] px-5 py-5 sm:px-8 sm:py-7">
            <div>
              <p className="eyebrow text-[var(--muted)]">Privacy controls</p>
              <h2
                id="cookie-preferences-title"
                className="mt-3 text-2xl font-medium uppercase tracking-[-0.03em] sm:text-3xl"
              >
                Cookie preferences
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                setView(getCookieConsentSnapshot() ? "hidden" : "default")
              }
              className="min-h-11 min-w-11 border border-[var(--border)] text-xl"
              aria-label="Close cookie preferences"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 px-5 py-5 sm:px-8 sm:py-7">
            <p
              id="cookie-preferences-description"
              className="max-w-2xl text-sm leading-6 text-[var(--muted)]"
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

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] px-5 py-5 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={() => commitConsent(defaultPreferences)}
              className="button-secondary px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => commitConsent(preferences)}
              className="button-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              Save preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[110] border-t border-white/15 bg-[#11110f] text-[#f6f4ef]"
    >
      <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:py-5">
        <div className="max-w-3xl">
          <p className="eyebrow text-white/50">Your privacy</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            We use essential cookies to run HRUSHE. With your permission, we
            also use analytics and marketing technologies to understand and
            improve your experience. Read our{" "}
            <Link
              href="/policies?tab=privacy"
              className="underline decoration-white/35 underline-offset-4 hover:text-white"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => setView("preferences")}
            className="min-h-12 border border-white/25 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85 hover:border-white/60 hover:text-white"
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={() => commitConsent(defaultPreferences)}
            className="min-h-12 border border-white/25 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85 hover:border-white/60 hover:text-white"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={() =>
              commitConsent({ analytics: true, marketing: true })
            }
            className="col-span-2 min-h-12 bg-[#f6f4ef] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#11110f] hover:bg-white sm:col-span-1"
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
    <div className="flex items-start justify-between gap-5 border border-[var(--border)] px-4 py-4 sm:px-5">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em]">
            {title}
          </h3>
          {locked ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Always active
            </span>
          ) : null}
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
