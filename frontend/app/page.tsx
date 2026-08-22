import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getHomepageSectionsForAudience,
  getVisibleHomepageCards,
  type HomepageCard,
  type HomepageTextAlign,
  type HomepageTextPosition,
  type HomepageTitleFontSize,
} from "@/lib/admin-workspace";
import { getHomepageManagement } from "@/lib/server-storefront";
import { SiteFooter } from "@/components/site-footer";
import {
  HRUSHE_LOGO_DIMENSIONS,
  HRUSHE_LOGO_PATH,
} from "@/lib/brand-assets";
import { HomepageMediaFrame } from "@/components/homepage-media";

export const metadata: Metadata = {
  title: "Shop Women & Men",
  description: "Choose HRUSHE womenswear or menswear and shop the latest quiet uniforms.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shop Women & Men | HRUSHE",
    description: "Choose HRUSHE womenswear or menswear and shop the latest quiet uniforms.",
    url: "/",
  },
};

const entryTitleFontSizeClasses: Record<HomepageTitleFontSize, string> = {
  small: "text-[0.9rem] sm:text-[1.2rem] lg:text-[1.35rem]",
  medium: "text-[1rem] sm:text-[1.55rem] lg:text-[1.75rem]",
  large: "text-[1rem] sm:text-[1.75rem] lg:text-[2rem]",
};

const entryTextAlignClasses: Record<HomepageTextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const entryPositionClasses: Record<HomepageTextPosition, string> = {
  "top-left": "absolute inset-x-0 top-0 z-10 hidden justify-start px-5 pt-11 sm:pt-14 lg:flex lg:pt-20",
  "top-center": "absolute inset-x-0 top-0 z-10 hidden justify-center px-5 pt-11 sm:pt-14 lg:flex lg:pt-20",
  "top-right": "absolute inset-x-0 top-0 z-10 hidden justify-end px-5 pt-11 sm:pt-14 lg:flex lg:pt-20",
  "center-left": "absolute inset-y-0 left-0 z-10 hidden items-center justify-start px-5 lg:flex",
  center: "absolute inset-0 z-10 hidden items-center justify-center px-5 lg:flex",
  "center-right": "absolute inset-y-0 right-0 z-10 hidden items-center justify-end px-5 lg:flex",
  "bottom-left": "absolute inset-x-0 bottom-0 z-10 hidden justify-start px-5 pb-11 sm:pb-14 lg:flex lg:pb-20",
  "bottom-center": "absolute inset-x-0 bottom-0 z-10 hidden justify-center px-5 pb-11 text-center sm:pb-14 lg:flex lg:pb-20",
  "bottom-right": "absolute inset-x-0 bottom-0 z-10 hidden justify-end px-5 pb-11 sm:pb-14 lg:flex lg:pb-20",
};

function EntryCardDesktopTitle({ card }: { card: HomepageCard }) {
  const position = card.titlePosition || "bottom-center";
  const fontSize = card.titleFontSize || "large";
  const textAlign = card.textAlign || "center";

  return (
    <div className={entryPositionClasses[position] || entryPositionClasses["bottom-center"]}>
      <span className={`relative inline-flex pb-2 ${entryTitleFontSizeClasses[fontSize]} font-bold uppercase leading-none tracking-tight ${entryTextAlignClasses[textAlign]}`}>
        {card.title}
        <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 bg-white opacity-0 transition group-hover:opacity-100" />
      </span>
    </div>
  );
}

export default async function Home() {
  const homeManagement = await getHomepageManagement();
  const entrySection = getHomepageSectionsForAudience(homeManagement, "home").find(
    (section) => section.sectionType === "entry-cards"
  );
  const entryCards = entrySection ? getVisibleHomepageCards(entrySection.cards) : [];

  return (
    <main className="h-svh overflow-hidden bg-[var(--background)] text-[var(--foreground)] lg:h-auto lg:min-h-svh lg:overflow-visible">
      <h1 className="sr-only">HRUSHE women and men collections</h1>
      <header className="fixed inset-x-0 top-0 z-30 flex h-[3.375rem] items-center justify-start border-b border-[var(--border)] bg-[var(--header-background)] px-6 sm:h-[4.5rem] sm:justify-center sm:px-4 lg:relative lg:inset-auto">
        <Link href="/" aria-label="HRUSHE home" className="inline-flex items-center justify-center">
          <Image
            src={HRUSHE_LOGO_PATH}
            alt="HRUSHE"
            width={HRUSHE_LOGO_DIMENSIONS.width}
            height={HRUSHE_LOGO_DIMENSIONS.height}
            priority
            className="h-7 w-auto object-contain sm:h-12"
          />
        </Link>
      </header>

      <div className="mt-[3.375rem] h-[calc(100svh-3.375rem)] snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] sm:mt-[4.5rem] sm:h-[calc(100svh-4.5rem)] lg:mt-0 lg:h-auto lg:snap-none lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        <section
          className="flex h-full snap-start snap-always snap-x snap-mandatory overflow-x-auto bg-[var(--foreground)] text-white [scrollbar-width:none] lg:grid lg:h-auto lg:min-h-[calc(100svh-4.5rem)] lg:snap-none lg:grid-cols-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
          style={{ gridTemplateColumns: `repeat(${Math.max(entryCards.length, 1)}, minmax(0, 1fr))` }}
        >
          {entryCards.map((card, index) => (
            <Link
              key={card.id}
              href={card.ctaLink || "/shop"}
              className="group relative block h-full w-full flex-none snap-start snap-always overflow-hidden lg:h-[calc(100svh-4.5rem)] lg:w-auto lg:snap-none"
            >
              <HomepageMediaFrame
                src={card.image}
                mobileSrc={card.mobileImage}
                alt={card.imageAlt || card.title}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                objectPosition={card.objectPosition}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_40%,rgba(0,0,0,0.38)_100%)]" />
              <div className="absolute inset-x-0 top-[51%] z-10 flex -translate-y-1/2 justify-center px-5 font-sans lg:hidden">
                <span className="text-center text-[1.75rem] font-bold uppercase leading-none tracking-tight sm:text-[2rem]">
                  {card.title}
                </span>
              </div>
              {card.subtitle ? (
                <span
                  className={`absolute top-[51%] z-10 -translate-y-1/2 whitespace-nowrap font-sans text-[0.92rem] font-bold uppercase leading-none tracking-tight sm:text-[1rem] lg:hidden ${
                    index === 0 ? "right-4" : "left-4"
                  }`}
                >
                  {card.subtitle}
                </span>
              ) : null}
              <EntryCardDesktopTitle card={card} />
            </Link>
          ))}
        </section>

        <div className="min-h-full snap-start snap-always bg-[var(--foreground)] lg:min-h-0 lg:snap-none">
          <SiteFooter compact />
        </div>
      </div>
    </main>
  );
}
