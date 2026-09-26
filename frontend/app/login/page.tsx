"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { sanitizeCustomerRedirect } from "@/lib/redirects";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const nextPath = sanitizeCustomerRedirect(searchParams.get("next"), "/my-orders");
  const fallbackClosePath =
    nextPath && nextPath !== "/account" && nextPath !== "/my-orders" ? nextPath : "/shop";

  useEffect(() => {
    router.prefetch(nextPath);
  }, [nextPath, router]);

  const closeLogin = () => {
    const historyIndex =
      typeof window.history.state?.idx === "number" ? window.history.state.idx : null;

    if ((historyIndex !== null && historyIndex > 0) || (historyIndex === null && window.history.length > 1)) {
      router.back();
      return;
    }

    router.push(fallbackClosePath);
  };

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <h1 className="sr-only">{initialMode === "signup" ? "Create a HRUSHE account" : "Sign in to HRUSHE"}</h1>
      <button
        type="button"
        onClick={closeLogin}
        aria-label="Close login"
        className="fr-mono fr-choice is-active fixed right-5 top-5 z-20 min-h-11"
      >
        Close ×
      </button>
      <div className="mx-auto flex min-h-dvh max-w-[1100px] items-center px-0 py-16 sm:px-6">
        <AuthPanel
          initialMode={initialMode}
          className="w-full"
          onSuccess={() => {
            router.push(nextPath);
          }}
        />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
