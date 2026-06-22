import { LoadingState } from "@/components/loading-state";

export default function StorefrontLoading() {
  return (
    <main className="lux-page py-12 sm:py-16">
      <div className="lux-container">
        <LoadingState
          title="Preparing the edit"
          description="Product information and availability are being checked."
        />
      </div>
    </main>
  );
}
