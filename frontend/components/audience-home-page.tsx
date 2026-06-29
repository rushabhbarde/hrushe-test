import Image from "next/image";
import Link from "next/link";
import { HomepageNewsletter } from "@/components/homepage-newsletter";
import { ServicePromise } from "@/components/service-promise";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Audience = "women" | "men";

type AudienceHomeConfig = {
  label: string;
  title: string;
  fallbackImage: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  storyEyebrow: string;
  storyTitle: string;
  storyDescription: string;
  cards: Array<{
    label: string;
    href: string;
    image: string;
    imageAlt: string;
    objectPosition?: string;
  }>;
};

const audienceHomeConfig: Record<Audience, AudienceHomeConfig> = {
  women: {
    label: "Women",
    title: "Summer: New & Now",
    fallbackImage: "/uploads/banners/banner2.png",
    primaryCtaLabel: "Shop New Arrivals",
    primaryCtaHref: "/new-in",
    secondaryCtaLabel: "Shop All Womenswear",
    secondaryCtaHref: "/collection/women",
    storyEyebrow: "Womenswear",
    storyTitle: "Clean summer pieces, cut for repeat wear.",
    storyDescription:
      "Considered colours, quiet fits, and everyday pieces designed to move from first plans to late evenings.",
    cards: [
      {
        label: "Dresses",
        href: "/collection/women",
        image: "/uploads/banners/banner2.png",
        imageAlt: "HRUSHE womenswear dresses edit",
        objectPosition: "center",
      },
      {
        label: "Shirts & Blouses",
        href: "/collection/women",
        image: "/uploads/banners/banner2.png",
        imageAlt: "HRUSHE womenswear shirts and blouses edit",
        objectPosition: "right center",
      },
    ],
  },
  men: {
    label: "Men",
    title: "Defined Quietly",
    fallbackImage: "/uploads/banners/banner1.png",
    primaryCtaLabel: "Shop New Arrivals",
    primaryCtaHref: "/new-in",
    secondaryCtaLabel: "Shop All Menswear",
    secondaryCtaHref: "/collection/men",
    storyEyebrow: "Menswear",
    storyTitle: "Relaxed uniforms with a sharper line.",
    storyDescription:
      "Easy proportions, graphic essentials, and summer layers built with the same quiet HRUSHE discipline.",
    cards: [
      {
        label: "Pants & Shorts",
        href: "/collection/men",
        image: "/uploads/banners/banner1.png",
        imageAlt: "HRUSHE menswear pants and shorts edit",
        objectPosition: "left center",
      },
      {
        label: "T-Shirts & Tank Tops",
        href: "/collection/men",
        image: "/uploads/banners/banner2.png",
        imageAlt: "HRUSHE menswear t-shirts and tank tops edit",
        objectPosition: "center",
      },
    ],
  },
};

export function AudienceHomePage({ audience }: { audience: Audience }) {
  const config = audienceHomeConfig[audience];
  const heroMedia = config.fallbackImage;

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="relative isolate h-[calc(100svh-5.5rem)] w-full overflow-hidden bg-[var(--foreground)] text-white sm:h-[calc(100svh-5.75rem)]">
          <div className="absolute inset-0">
            <Image
              src={heroMedia}
              alt={`HRUSHE ${config.label} campaign`}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.04)_48%,rgba(0,0,0,0.46)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[1600px] justify-center px-4 pb-7 text-center sm:px-6 sm:pb-8 lg:px-8 lg:pb-9">
            <div className="max-w-[56rem]">
              <h1 className="text-[1.6rem] font-bold uppercase leading-none tracking-tight sm:text-[1.95rem] lg:text-[2.25rem]">
                {config.title}
              </h1>
              <div className="mt-4 flex flex-col items-center justify-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.05em] text-white sm:flex-row sm:gap-8">
                <Link href={config.primaryCtaHref} className="inline-flex min-h-6 items-center px-1 transition-colors hover:text-white/75">
                  {config.primaryCtaLabel}
                </Link>
                <Link href={config.secondaryCtaHref} className="inline-flex min-h-6 items-center gap-2 px-1 transition-colors hover:text-white/75">
                  <span>{config.secondaryCtaLabel}</span>
                  <span aria-hidden="true">›</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid border-y border-[var(--border)] bg-[var(--foreground)] text-white lg:grid-cols-2">
          {config.cards.map((card) => {
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group relative block h-[72svh] min-h-[520px] overflow-hidden border-b border-white/10 sm:h-[78svh] lg:h-[calc(100svh-5.75rem)] lg:min-h-0 lg:border-b-0 lg:border-r lg:border-white/10 last:lg:border-r-0"
              >
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                  style={{ objectPosition: card.objectPosition || "center" }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_48%,rgba(0,0,0,0.42)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-5 pb-6 text-[0.82rem] font-semibold uppercase tracking-[0.06em] sm:px-8 sm:pb-8">
                  <span>{card.label}</span>
                  <span aria-hidden="true" className="text-white/75">›</span>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--foreground)] text-[var(--background)]">
          <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <p className="eyebrow text-white/55">{config.storyEyebrow}</p>
            <div>
              <h2 className="max-w-[18ch] text-[2rem] font-medium uppercase leading-[0.98] tracking-[-0.04em] sm:text-[3rem]">
                {config.storyTitle}
              </h2>
              <p className="mt-7 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                {config.storyDescription}
              </p>
              <Link href={config.secondaryCtaHref} className="mt-8 inline-flex min-h-11 items-center border-b border-white text-xs font-semibold uppercase tracking-[0.12em]">
                Shop {config.label}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <ServicePromise />
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="eyebrow text-[var(--muted)]">First access</p>
            <h2 className="mt-4 max-w-[16ch] text-[2rem] font-medium uppercase leading-[0.98] tracking-[-0.04em] sm:text-[3rem]">
              Restocks, product notes and new uniforms.
            </h2>
            <HomepageNewsletter />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
