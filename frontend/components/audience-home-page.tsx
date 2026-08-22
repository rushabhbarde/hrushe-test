import Link from "next/link";
import {
  getHomepageSectionsForAudience,
  getVisibleHomepageCards,
  type HomepageCard,
  type HomepageSection,
  type HomepageTextAlign,
  type HomepageTextPosition,
  type HomepageTitleFontSize,
} from "@/lib/admin-workspace";
import { getHomepageManagement } from "@/lib/server-storefront";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HomepageMediaFrame } from "@/components/homepage-media";

type Audience = "women" | "men";

const audienceLabels: Record<Audience, string> = {
  women: "Women",
  men: "Men",
};

const audienceFallbackLinks: Record<Audience, string> = {
  women: "/collection/women",
  men: "/collection/men",
};

const categoryImageSizes = "(max-width: 1024px) 50vw, 25vw";

const cardTitleFontSizeClasses: Record<HomepageTitleFontSize, string> = {
  small: "text-[0.78rem] sm:text-[0.88rem]",
  medium: "text-[0.9rem] sm:text-[1rem]",
  large: "text-[1.05rem] sm:text-[1.18rem]",
};

const textAlignClasses: Record<HomepageTextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const inlineJustifyClasses: Record<HomepageTextAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const cardTitlePositionClasses: Record<HomepageTextPosition, string> = {
  "top-left": "absolute inset-x-0 top-0 flex justify-start px-5 pt-6 sm:px-7 sm:pt-8 lg:px-8 lg:pt-9",
  "top-center": "absolute inset-x-0 top-0 flex justify-center px-5 pt-6 sm:px-7 sm:pt-8 lg:px-8 lg:pt-9",
  "top-right": "absolute inset-x-0 top-0 flex justify-end px-5 pt-6 sm:px-7 sm:pt-8 lg:px-8 lg:pt-9",
  "center-left": "absolute inset-y-0 left-0 flex items-center justify-start px-5 sm:px-7 lg:px-8",
  center: "absolute inset-0 flex items-center justify-center px-5 sm:px-7 lg:px-8",
  "center-right": "absolute inset-y-0 right-0 flex items-center justify-end px-5 sm:px-7 lg:px-8",
  "bottom-left": "absolute inset-x-0 bottom-0 flex justify-start px-5 pb-6 sm:px-7 sm:pb-8 lg:px-8 lg:pb-9",
  "bottom-center": "absolute inset-x-0 bottom-0 flex justify-center px-5 pb-6 sm:px-7 sm:pb-8 lg:px-8 lg:pb-9",
  "bottom-right": "absolute inset-x-0 bottom-0 flex justify-end px-5 pb-6 sm:px-7 sm:pb-8 lg:px-8 lg:pb-9",
};

function CardTitle({ card }: { card: HomepageCard }) {
  const titlePosition = card.titlePosition || "bottom-right";
  const textAlign = card.textAlign || "right";
  const fontSize = card.titleFontSize || "small";

  return (
    <div className={cardTitlePositionClasses[titlePosition] || cardTitlePositionClasses["bottom-right"]}>
      <span
        className={`inline-flex max-w-[16rem] items-center ${inlineJustifyClasses[textAlign]} ${textAlignClasses[textAlign]} ${cardTitleFontSizeClasses[fontSize]} font-medium uppercase leading-tight tracking-[0.08em]`}
      >
        {card.title}
        <span aria-hidden="true" className="ml-0 max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-4 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-4 group-focus-visible:translate-x-1 group-focus-visible:opacity-100">
          &gt;
        </span>
      </span>
    </div>
  );
}

function AudienceHeroSection({ section, audience }: { section: HomepageSection; audience: Audience }) {
  const primaryCtaText = section.ctaText || "Shop New Arrivals";
  const primaryCtaHref =
    primaryCtaText.toLowerCase().includes("new arrival")
      ? "/shop?sort=newest"
      : !section.ctaLink || section.ctaLink === `/${audience}`
        ? audienceFallbackLinks[audience]
        : section.ctaLink;

  return (
    <section className="relative isolate h-full snap-start snap-always overflow-hidden bg-[var(--foreground)] text-white">
      <div className="absolute inset-0">
        <HomepageMediaFrame
          src={section.image}
          mobileSrc={section.mobileImage}
          alt={section.imageAlt || `HRUSHE ${audienceLabels[audience]} campaign`}
          priority
          sizes="100vw"
          className="object-cover object-center"
          objectPosition={section.objectPosition}
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.04)_48%,rgba(0,0,0,0.46)_100%)]" />
      <div className="absolute inset-x-0 bottom-8 z-10 mx-auto flex w-full max-w-[1600px] justify-center px-4 pb-7 text-center sm:bottom-10 sm:px-6 sm:pb-8 lg:bottom-12 lg:px-8 lg:pb-9">
        <div className="max-w-[56rem]">
          <h1 className="text-[1.6rem] font-bold uppercase leading-none tracking-tight sm:text-[1.95rem] lg:text-[2.25rem]">
            {section.title}
          </h1>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.05em] text-white sm:flex-row sm:gap-8">
            {primaryCtaText ? (
              <Link href={primaryCtaHref} className="group inline-flex min-h-6 items-center px-1 transition-colors hover:text-white/75">
                <span>{primaryCtaText}</span>
                <span aria-hidden="true" className="ml-0 max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-3 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-3 group-focus-visible:opacity-100">
                  ›
                </span>
              </Link>
            ) : null}
            {section.secondaryCtaText ? (
              <Link href={section.secondaryCtaLink || audienceFallbackLinks[audience]} className="group inline-flex min-h-6 items-center px-1 transition-colors hover:text-white/75">
                <span>{section.secondaryCtaText}</span>
                <span aria-hidden="true" className="ml-0 max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-3 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-3 group-focus-visible:opacity-100">
                  ›
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCardsSection({ section, audience }: { section: HomepageSection; audience: Audience }) {
  const cards = getVisibleHomepageCards(section.cards);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="flex h-full snap-start snap-always snap-x snap-mandatory overflow-x-auto overflow-y-hidden bg-[var(--foreground)] text-white overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={card.ctaLink || audienceFallbackLinks[audience]}
          className="group relative block h-full min-w-[50vw] snap-start overflow-hidden bg-[var(--foreground)] lg:min-w-[25vw]"
        >
            <HomepageMediaFrame
            src={card.image}
            mobileSrc={card.mobileImage}
            alt={card.imageAlt || card.title}
            sizes={categoryImageSizes}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
            objectPosition={card.objectPosition}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0)_38%,rgba(0,0,0,0.62)_100%)]" />
          <CardTitle card={card} />
        </Link>
      ))}
    </section>
  );
}

function SaleBannerSection({ section, audience }: { section: HomepageSection; audience: Audience }) {
  return (
    <section className="relative isolate h-full snap-start snap-always overflow-hidden bg-[var(--foreground)] text-white">
      <HomepageMediaFrame
        src={section.image}
        mobileSrc={section.mobileImage}
        alt={section.imageAlt || section.title}
        sizes="100vw"
        className="h-full w-full object-cover"
        objectPosition={section.objectPosition}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.06)_45%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[1600px] justify-center px-4 pb-10 text-center sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
        <div>
          <h2 className="text-[1.55rem] font-bold uppercase leading-none tracking-tight sm:text-[1.95rem] lg:text-[2.25rem]">
            {section.title}
          </h2>
          {section.subtitle ? (
            <p className="mt-5 text-[0.95rem] font-bold uppercase tracking-[0.08em] sm:text-[1.05rem]">
              {section.subtitle}
            </p>
          ) : null}
          {section.ctaText ? (
            <Link
              href={section.ctaLink || audienceFallbackLinks[audience]}
              className="group mt-6 inline-flex min-h-6 items-center px-1 text-[0.72rem] font-medium uppercase tracking-[0.05em] transition-colors hover:text-white/75"
            >
              <span>{section.ctaText}</span>
              <span aria-hidden="true" className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1">
                ›
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export async function AudienceHomePage({ audience }: { audience: Audience }) {
  const homeManagement = await getHomepageManagement();
  const sections = getHomepageSectionsForAudience(homeManagement, audience);

  return (
    <div className="page-shell flex h-svh flex-col overflow-hidden bg-[var(--background)]">
      <SiteHeader />
      <main className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth">
        {sections.map((section) => {
          if (section.sectionType === "audience-hero") {
            return <AudienceHeroSection key={section.id} section={section} audience={audience} />;
          }

          if (section.sectionType === "category-cards") {
            return <CategoryCardsSection key={section.id} section={section} audience={audience} />;
          }

          if (section.sectionType === "sale-banner") {
            return <SaleBannerSection key={section.id} section={section} audience={audience} />;
          }

          return null;
        })}

        <section className="snap-start bg-[var(--foreground)] text-[var(--background)]">
          <SiteFooter />
        </section>
      </main>
    </div>
  );
}
