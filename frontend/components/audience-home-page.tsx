import Image from "next/image";
import Link from "next/link";
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
  cards: Array<{
    label: string;
    href: string;
    image: string;
    imageAlt: string;
    objectPosition?: string;
  }>;
  saleBanner: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
    imageAlt: string;
    objectPosition?: string;
  };
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
      {
        label: "T-Shirts & Tank Tops",
        href: "/collection/women",
        image: "/uploads/banners/shopwomen.png",
        imageAlt: "HRUSHE womenswear t-shirts and tank tops edit",
        objectPosition: "center",
      },
      {
        label: "Pants & Shorts",
        href: "/collection/women",
        image: "/uploads/banners/shopwomen.png",
        imageAlt: "HRUSHE womenswear pants and shorts edit",
        objectPosition: "left center",
      },
    ],
    saleBanner: {
      title: "Sale: New Pieces Added",
      subtitle: "Online Exclusive",
      ctaLabel: "Shop Women",
      ctaHref: "/collection/women",
      image: "/uploads/banners/banner2.png",
      imageAlt: "HRUSHE womenswear sale campaign",
      objectPosition: "center",
    },
  },
  men: {
    label: "Men",
    title: "Defined Quietly",
    fallbackImage: "/uploads/banners/banner1.png",
    primaryCtaLabel: "Shop New Arrivals",
    primaryCtaHref: "/new-in",
    secondaryCtaLabel: "Shop All Menswear",
    secondaryCtaHref: "/collection/men",
    cards: [
      {
        label: "Shirts",
        href: "/collection/men",
        image: "/uploads/banners/banner2.png",
        imageAlt: "HRUSHE menswear shirts edit",
        objectPosition: "center",
      },
      {
        label: "T-Shirts & Tank Tops",
        href: "/collection/men",
        image: "/uploads/banners/banner2.png",
        imageAlt: "HRUSHE menswear t-shirts and tank tops edit",
        objectPosition: "center",
      },
      {
        label: "Polo Shirts",
        href: "/collection/men",
        image: "/uploads/banners/banner1.png",
        imageAlt: "HRUSHE menswear polo shirts edit",
        objectPosition: "center",
      },
      {
        label: "Pants & Shorts",
        href: "/collection/men",
        image: "/uploads/banners/banner1.png",
        imageAlt: "HRUSHE menswear pants and shorts edit",
        objectPosition: "left center",
      },
    ],
    saleBanner: {
      title: "Sale: New Pieces Added",
      subtitle: "Online Exclusive",
      ctaLabel: "Shop Men",
      ctaHref: "/collection/men",
      image: "/uploads/banners/banner1.png",
      imageAlt: "HRUSHE menswear sale campaign",
      objectPosition: "center",
    },
  },
};

export function AudienceHomePage({ audience }: { audience: Audience }) {
  const config = audienceHomeConfig[audience];
  const heroMedia = config.fallbackImage;
  const categoryImageSizes = "(max-width: 1024px) 50vw, 25vw";

  return (
    <div className="page-shell flex h-svh flex-col overflow-hidden bg-[var(--background)]">
      <SiteHeader />
      <main className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth">
        <section className="relative isolate h-full snap-start snap-always overflow-hidden bg-[var(--foreground)] text-white">
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
          <div className="absolute inset-x-0 bottom-8 z-10 mx-auto flex w-full max-w-[1600px] justify-center px-4 pb-7 text-center sm:bottom-10 sm:px-6 sm:pb-8 lg:bottom-12 lg:px-8 lg:pb-9">
            <div className="max-w-[56rem]">
              <h1 className="text-[1.6rem] font-bold uppercase leading-none tracking-tight sm:text-[1.95rem] lg:text-[2.25rem]">
                {config.title}
              </h1>
              <div className="mt-4 flex flex-col items-center justify-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.05em] text-white sm:flex-row sm:gap-8">
                <Link href={config.primaryCtaHref} className="group inline-flex min-h-6 items-center px-1 transition-colors hover:text-white/75">
                  <span>{config.primaryCtaLabel}</span>
                  <span aria-hidden="true" className="ml-0 max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-3 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-3 group-focus-visible:opacity-100">
                    ›
                  </span>
                </Link>
                <Link href={config.secondaryCtaHref} className="group inline-flex min-h-6 items-center px-1 transition-colors hover:text-white/75">
                  <span>{config.secondaryCtaLabel}</span>
                  <span aria-hidden="true" className="ml-0 max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-3 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-3 group-focus-visible:opacity-100">
                    ›
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="flex h-full snap-start snap-always snap-x snap-mandatory overflow-x-auto overflow-y-hidden bg-[var(--foreground)] text-white overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {config.cards.map((card) => {
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group relative block h-full min-w-[50vw] snap-start overflow-hidden bg-[var(--foreground)] lg:min-w-[25vw]"
              >
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  sizes={categoryImageSizes}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                  style={{ objectPosition: card.objectPosition || "center" }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0)_38%,rgba(0,0,0,0.62)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 flex justify-end px-5 pb-6 text-right sm:px-7 sm:pb-8 lg:px-8 lg:pb-9">
                  <span className="inline-flex max-w-[16rem] items-center justify-end gap-2 text-[0.78rem] font-medium uppercase leading-tight tracking-[0.08em] sm:text-[0.88rem]">
                    {card.label}
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1">
                      &gt;
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="relative isolate h-full snap-start snap-always overflow-hidden bg-[var(--foreground)] text-white">
          <Image
            src={config.saleBanner.image}
            alt={config.saleBanner.imageAlt}
            fill
            sizes="100vw"
            className="h-full w-full object-cover"
            style={{ objectPosition: config.saleBanner.objectPosition || "center" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.06)_45%,rgba(0,0,0,0.5)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[1600px] justify-center px-4 pb-10 text-center sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
            <div>
              <h2 className="text-[1.55rem] font-bold uppercase leading-none tracking-tight sm:text-[1.95rem] lg:text-[2.25rem]">
                {config.saleBanner.title}
              </h2>
              <p className="mt-5 text-[0.95rem] font-bold uppercase tracking-[0.08em] sm:text-[1.05rem]">
                {config.saleBanner.subtitle}
              </p>
              <Link
                href={config.saleBanner.ctaHref}
                className="group mt-6 inline-flex min-h-6 items-center px-1 text-[0.72rem] font-medium uppercase tracking-[0.05em] transition-colors hover:text-white/75"
              >
                <span>{config.saleBanner.ctaLabel}</span>
                <span aria-hidden="true" className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1">
                  ›
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="min-h-full snap-start bg-[var(--foreground)] text-[var(--background)]">
          <SiteFooter />
        </section>
      </main>
    </div>
  );
}
