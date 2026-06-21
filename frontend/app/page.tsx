import Image from "next/image";
import Link from "next/link";
import { HomepageNewsletter } from "@/components/homepage-newsletter";
import { ProductCard } from "@/components/product-card";
import { ServicePromise } from "@/components/service-promise";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProductDisplayName } from "@/lib/product-presentation";
import {
  getHomepageContent,
  getStorefrontProduct,
  getStorefrontProducts,
} from "@/lib/server-storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, homepage] = await Promise.all([
    getStorefrontProducts(),
    getHomepageContent(),
  ]);
  const featured = products
    .filter((product) => product.featured || product.newIn || product.newArrival)
    .concat(products)
    .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
    .slice(0, 8);
  const leadProduct = featured[0];
  const leadDetail = leadProduct
    ? await getStorefrontProduct(leadProduct.slug || leadProduct.id)
    : null;
  const heroMedia =
    homepage.mediaUrl ||
    homepage.imageUrl ||
    leadDetail?.images?.[0] ||
    leadProduct?.thumbnailUrl ||
    leadProduct?.images?.[0] ||
    "";
  const heroIsVideo = homepage.mediaType === "video" && !heroMedia.startsWith("data:");
  const colours = products
    .map((product) => ({
      id: product.id,
      name: product.colour || product.colors?.[0] || "",
      href: `/product/${product.slug || product.id}`,
      image: product.thumbnailUrl || product.images?.[0] || "",
    }))
    .filter((colour) => colour.name)
    .filter((colour, index, list) =>
      list.findIndex((item) => item.name.toLowerCase() === colour.name.toLowerCase()) === index
    )
    .slice(0, 8);
  const proof = [
    leadDetail?.fabric || leadDetail?.cottonType
      ? { label: "Composition", value: leadDetail.fabric || leadDetail.cottonType || "" }
      : null,
    leadDetail?.gsm || leadDetail?.weight
      ? { label: "Weight", value: leadDetail.gsm || leadDetail.weight || "" }
      : null,
    leadDetail?.fitNote || leadDetail?.fitType
      ? { label: "Fit", value: leadDetail.fitNote || leadDetail.fitType || "" }
      : null,
    { label: "Dispatch", value: "Within 1–3 business days" },
    { label: "Returns", value: "7 days from delivery" },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
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
            {heroMedia ? <div className="relative order-1 min-h-[54svh] overflow-hidden lg:order-2 lg:min-h-[760px]">
              {heroIsVideo ? (
                <video src={heroMedia} poster={homepage.posterImage || undefined} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" aria-label={homepage.title || "HRUSHE campaign"} />
              ) : (
                <Image src={heroMedia} alt={homepage.title || "HRUSHE collection"} fill priority sizes="(max-width: 1024px) 100vw, 62vw" className="object-cover" />
              )}
            </div> : null}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8" aria-label="Product proof">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-l border-t border-[var(--border)]">
            {proof.map((item) => (
              <div key={item.label} className="border-b border-r border-[var(--border)] px-4 py-5">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 text-sm leading-6">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {featured.length > 0 ? (
          <section className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <div className="mb-10 flex items-end justify-between gap-6 border-b border-[var(--border)] pb-7">
              <div>
                <p className="eyebrow text-[var(--muted)]">Featured collection</p>
                <h2 className="mt-4 text-[2rem] font-medium uppercase tracking-[-0.04em] sm:text-[2.8rem]">The current edit.</h2>
              </div>
              <Link href="/shop" className="hidden min-h-11 items-center border-b border-current text-xs font-semibold uppercase tracking-[0.12em] sm:inline-flex">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-16">
              {featured.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        ) : null}

        {colours.length > 0 ? (
          <section className="border-y border-[var(--border)] bg-[var(--surface)]">
            <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
              <p className="eyebrow text-[var(--muted)]">Colour story</p>
              <h2 className="mt-4 max-w-xl text-[2rem] font-medium uppercase leading-[0.96] tracking-[-0.04em] sm:text-[3rem]">A considered everyday palette.</h2>
              <div className="mt-10 grid grid-cols-2 gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
                {colours.map((colour) => (
                  <Link key={colour.id} href={colour.href} className="group bg-[var(--surface)] p-3">
                    <div className="relative aspect-square overflow-hidden bg-[var(--surface-strong)]">
                      {colour.image ? <Image src={colour.image} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-300 md:group-hover:scale-[1.015]" /> : null}
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em]">{colour.name.replace(/begie/gi, "Beige")}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {leadDetail && (leadDetail.fabric || leadDetail.gsm || leadDetail.weight || leadDetail.qualityNote || leadDetail.washCare) ? (
          <section className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
            <div className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28 xl:px-16">
              <p className="eyebrow text-[var(--muted)]">Specified without mystery</p>
              <h2 className="mt-5 max-w-[12ch] text-[2rem] font-medium uppercase leading-[0.96] tracking-[-0.04em] sm:text-[3rem]">Material, fit and care.</h2>
              <dl className="mt-10 border-t border-[var(--border)]">
                {[{label:"Composition",value:leadDetail.fabric || leadDetail.cottonType},{label:"GSM / weight",value:leadDetail.gsm || leadDetail.weight},{label:"Construction",value:leadDetail.qualityNote},{label:"Care",value:leadDetail.washCare}].filter((item)=>item.value).map((item)=>(
                  <div key={item.label} className="grid gap-2 border-b border-[var(--border)] py-5 sm:grid-cols-[150px_1fr]">
                    <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</dt>
                    <dd className="text-sm leading-7">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <Link href={`/product/${leadDetail.slug || leadDetail.id}`} className="button-primary mt-8 inline-flex min-h-12 items-center px-7 text-xs font-semibold uppercase tracking-[0.1em]">View {getProductDisplayName(leadDetail)}</Link>
            </div>
            <div className="relative min-h-[560px] bg-[var(--surface-strong)]">
              {leadDetail.images?.[0] ? <Image src={leadDetail.images[0]} alt={getProductDisplayName(leadDetail)} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /> : null}
            </div>
          </section>
        ) : null}

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
