"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AdminAuthPanel } from "@/components/admin-auth-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    router.prefetch(searchParams.get("next") || "/admin");
  }, [router, searchParams]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10 sm:px-8">
        <AdminAuthPanel
          onSuccess={() => {
            router.push(searchParams.get("next") || "/admin");
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPageContent />
    </Suspense>
  );
}
