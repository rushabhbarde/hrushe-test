import { Suspense } from "react";
import { PolicyLayout } from "@/components/policy-layout";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LoadingState } from "@/components/loading-state";
import { policyTabs } from "@/lib/policies";



export default function PoliciesPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <Suspense fallback={(
        <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
          <LoadingState title="Preparing policies" description="Loading the requested policy section." />
        </main>
      )}>
        <PolicyLayout
          policies={policyTabs}
          defaultPolicyKey="terms"
          label="Policies"
          title="Clear information, before you order."
          description="Shipping, returns, privacy, and purchase terms—kept in one place and written to be understood."
          lastUpdated="Last updated: 21 June 2026"
        />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
