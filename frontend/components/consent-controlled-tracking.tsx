"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getCookieConsentSnapshot,
  getServerCookieConsentSnapshot,
  subscribeToCookieConsent,
} from "@/lib/cookie-consent";

type TrackingWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const googleAnalyticsId =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() || "";
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

export function ConsentControlledTracking() {
  const pathname = usePathname();
  const lastTrackedPath = useRef(pathname);
  const consent = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    getServerCookieConsentSnapshot
  );

  useEffect(() => {
    const trackingWindow = window as TrackingWindow;

    if (googleAnalyticsId) {
      (trackingWindow as unknown as Record<string, unknown>)[
        `ga-disable-${googleAnalyticsId}`
      ] = consent?.analytics !== true;
      trackingWindow.gtag?.("consent", "update", {
        analytics_storage: consent?.analytics ? "granted" : "denied",
      });
    }

    if (metaPixelId && trackingWindow.fbq) {
      trackingWindow.fbq(
        "consent",
        consent?.marketing ? "grant" : "revoke"
      );
    }
  }, [consent]);

  useEffect(() => {
    if (lastTrackedPath.current === pathname) {
      return;
    }

    const trackingWindow = window as TrackingWindow;

    if (consent?.analytics && trackingWindow.gtag) {
      trackingWindow.gtag("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    if (consent?.marketing && trackingWindow.fbq) {
      trackingWindow.fbq("track", "PageView");
    }

    lastTrackedPath.current = pathname;
  }, [consent?.analytics, consent?.marketing, pathname]);

  return (
    <>
      {consent?.analytics && googleAnalyticsId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              googleAnalyticsId
            )}`}
            strategy="afterInteractive"
          />
          <Script id="hrushe-google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', { analytics_storage: 'granted' });
              gtag('config', ${JSON.stringify(googleAnalyticsId)});
            `}
          </Script>
        </>
      ) : null}

      {consent?.marketing && metaPixelId ? (
        <Script id="hrushe-meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('consent', 'grant');
            fbq('init', ${JSON.stringify(metaPixelId)});
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}
