import Image from "next/image";
import Link from "next/link";
import { HomepageNewsletter } from "@/components/homepage-newsletter";
import { ServicePromise } from "@/components/service-promise";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getHomepageContent,
  getStorefrontProducts,
} from "@/lib/server-storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, homepage] = await Promise.all([
    getStorefrontProducts(),
    getHomepageContent(),
  ]);
  const leadProduct =
    products.find((product) => product.featured || product.newIn || product.newArrival) ||
    products[0];
  const heroMedia =
    homepage.mediaUrl ||
    homepage.imageUrl ||
    leadProduct?.thumbnailUrl ||
    leadProduct?.images?.[0] ||
    "";
  const heroIsVideo = homepage.mediaType === "video" && !heroMedia.startsWith("data:");

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="w-full">
          <div className={`grid min-h-[620px] bg-[var(--surface)] lg:min-h-[760px] ${heroMedia ? "lg:grid-cols-[38%_62%]" : ""}`}>
            <div className="order-2 flex flex-col justify-center px-5 py-12 sm:px-9 sm:py-16 lg:order-1 lg:px-12 xl:px-16">
              <p className="eyebrow text-[var(--muted)]">{homepage.eyebrow || "Elevated Everyday"}</p>
              <h1 className="mt-6 max-w-[8ch] text-[3rem] font-medium uppercase leading-[0.9] tracking-[-0.05em] sm:text-[4rem] lg:text-[5.3rem]">
                {homepage.title || "Defined Quietly"}
              </h1>
              <p className="mt-7 max-w-[29rem] text-[0.95rem] leading-7 text-[var(--muted)] sm:text-base">
                {homepage.description || "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction."}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link href={homepage.primaryCtaHref || "/shop"} className="button-primary inline-flex min-h-12 items-center justify-center px-7 text-xs font-semibold uppercase tracking-[0.1em]">
                  {homepage.primaryCtaLabel || "Shop Collection"}
                </Link>
                <Link href={homepage.secondaryCtaHref || "/story"} className="button-secondary inline-flex min-h-12 items-center justify-center px-7 text-xs font-semibold uppercase tracking-[0.1em]">
                  {homepage.secondaryCtaLabel || "Read the Story"}
                </Link>
              </div>
            </div>
            {heroMedia ? <div className="relative order-1 min-h-[420px] min-h-[54svh] overflow-hidden lg:order-2 lg:min-h-[760px]">
              {heroIsVideo ? (
                <video src={heroMedia} poster={homepage.posterImage || homepage.imageUrl || undefined} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-label={homepage.title || "HRUSHE campaign"} />
              ) : (
                <Image src={heroMedia} alt={homepage.title || "HRUSHE collection"} fill priority sizes="(max-width: 1024px) 100vw, 62vw" className="object-cover" />
              )}
            </div> : null}
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--foreground)] text-[var(--background)]">
          <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <p className="eyebrow text-white/55">Defined Quietly</p>
            <div>
              <h2 className="max-w-[18ch] text-[2rem] font-medium uppercase leading-[0.98] tracking-[-0.04em] sm:text-[3rem]">Quiet everyday uniforms, clearly specified.</h2>
              <p className="mt-7 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">HRUSHE creates quiet everyday uniforms with clear proportions, honest materials, and repeat-wear construction.</p>
              <Link href="/story" className="mt-8 inline-flex min-h-11 items-center border-b border-white text-xs font-semibold uppercase tracking-[0.12em]">Read the story</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <ServicePromise />
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="eyebrow text-[var(--muted)]">First access</p>
            <h2 className="mt-4 max-w-[16ch] text-[2rem] font-medium uppercase leading-[0.98] tracking-[-0.04em] sm:text-[3rem]">Restocks, product notes and new uniforms.</h2>
            <HomepageNewsletter />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
