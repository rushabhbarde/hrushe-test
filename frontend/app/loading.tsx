import { LoadingState } from "@/components/loading-state";

export default function StorefrontLoading() {
  return (
    <main className="lux-page grid min-h-[70svh] place-items-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-sm">
        <LoadingState />
      </div>
    </main>
  );
}
