"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    router.prefetch(searchParams.get("next") || "/my-orders");
  }, [router, searchParams]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10 sm:px-8">
        <AuthPanel
          initialMode="signup"
          onSuccess={() => {
            router.push(searchParams.get("next") || "/my-orders");
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
