"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthPanel } from "@/components/auth-panel";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/my-orders";
  const nextQuery = searchParams.get("next")
    ? `?next=${encodeURIComponent(searchParams.get("next") || "")}`
    : "";
  const fallbackClosePath =
    nextPath && nextPath !== "/account" && nextPath !== "/my-orders" ? nextPath : "/shop";

  useEffect(() => {
    router.prefetch(nextPath);
  }, [nextPath, router]);

  const closeSignup = () => {
    const historyIndex =
      typeof window.history.state?.idx === "number" ? window.history.state.idx : null;

    if ((historyIndex !== null && historyIndex > 0) || (historyIndex === null && window.history.length > 1)) {
      router.back();
      return;
    }

    router.push(fallbackClosePath);
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_18%_32%,rgba(255,255,255,0.12),transparent_20rem),linear-gradient(135deg,#242424,#0d0d0d_58%,#242424)] text-white">
      <button
        type="button"
        onClick={closeSignup}
        aria-label="Close create account"
        className="fixed right-5 top-5 z-20 flex h-11 w-11 items-center justify-center text-4xl font-light leading-none text-white/74 transition hover:text-white"
      >
        ×
      </button>
      <div className="pointer-events-none absolute inset-0 opacity-24 [background-image:radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:4px_4px]" />
      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1480px] items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.92fr_1fr] lg:px-20">
        <section className="hidden justify-center lg:flex">
          <div className="relative aspect-[1.58/1] w-full max-w-[500px] overflow-hidden rounded-[1.2rem] bg-white text-[#9c9c9c] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 opacity-45 [background-image:repeating-linear-gradient(135deg,rgba(0,0,0,0.08)_0_1px,transparent_1px_7px)]" />
            <div className="relative flex h-full flex-col justify-between p-8">
              <div className="flex items-center justify-between text-xl font-black">
                <span>Member</span>
                <span className="uppercase tracking-tight">HRUSHE</span>
              </div>
              <div className="self-center text-[8rem] font-black leading-none text-black/78">H</div>
              <div className="h-px w-full bg-black/12" />
            </div>
          </div>
        </section>
        <section className="mx-auto w-full max-w-[520px]">
          <AuthPanel
            initialMode="signup"
            variant="prestige"
            className="relative"
            onModeChange={(nextMode) => {
              if (nextMode === "login") {
                router.replace(`/login${nextQuery}`);
              }
            }}
            onSuccess={() => {
              router.push(nextPath);
            }}
          />
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}
