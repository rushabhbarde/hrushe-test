"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthPanel } from "@/components/auth-panel";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/my-orders";
  const nextQuery = searchParams.get("next")
    ? `?next=${encodeURIComponent(searchParams.get("next") || "")}`
    : "";

  useEffect(() => {
    router.prefetch(nextPath);
  }, [nextPath, router]);

  return (
    <main className="min-h-dvh bg-[#0b0b0b] text-white lg:grid lg:grid-cols-[1fr_minmax(430px,33vw)]">
      <Link
        href="/"
        aria-label="Close login"
        className="fixed right-5 top-5 z-20 flex h-11 w-11 items-center justify-center text-4xl font-light leading-none text-white/74 transition hover:text-white"
      >
        ×
      </Link>
      <section className="relative hidden min-h-dvh overflow-hidden bg-[#d7d7d7] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_45%,rgba(0,0,0,0.44),transparent_13rem),radial-gradient(circle_at_74%_38%,rgba(0,0,0,0.2),transparent_11rem),linear-gradient(90deg,rgba(255,255,255,0.55),rgba(210,210,210,0.92))] blur-2xl" />
        <div className="absolute left-[14%] top-[30%] h-[24rem] w-[24rem] rounded-full bg-black/24 blur-3xl" />
        <div className="absolute bottom-[10%] left-[6%] h-24 w-[42rem] bg-black/10 blur-3xl" />
      </section>
      <aside className="auth-prestige-gradient relative flex min-h-dvh items-center overflow-hidden px-6 py-20 sm:px-10 lg:px-12">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:4px_4px]" />
        <AuthPanel
          initialMode="login"
          variant="prestige"
          className="relative mx-auto w-full max-w-md"
          onModeChange={(nextMode) => {
            if (nextMode === "signup") {
              router.push(`/signup${nextQuery}`);
            }
          }}
          onSuccess={() => {
            router.push(nextPath);
          }}
        />
      </aside>
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
