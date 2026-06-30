import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

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

const entryCards = [
  {
    label: "Shop Women",
    sideLabel: "Men >",
    href: "/women",
    image: "/uploads/banners/shopwomen.png",
    alt: "HRUSHE womenswear campaign",
    objectPosition: "center",
  },
  {
    label: "Shop Men",
    sideLabel: "< Women",
    href: "/men",
    image: "/uploads/banners/shopmen.png",
    alt: "HRUSHE menswear campaign",
    objectPosition: "center",
  },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-[var(--background)] pt-14 text-[var(--foreground)] sm:pt-[4.5rem] lg:pt-0">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-start border-b border-[var(--border)] bg-[var(--header-background)] px-6 sm:h-[4.5rem] sm:justify-center sm:px-4 lg:relative lg:inset-auto">
        <Link href="/" aria-label="HRUSHE home" className="inline-flex items-center justify-center">
          <Image
            src="/NEW_LOGO.png"
            alt="HRUSHE"
            width={220}
            height={72}
            priority
            className="h-8 w-auto object-contain sm:h-12"
          />
        </Link>
      </header>

      <section className="flex min-h-[calc(100svh-3.5rem)] snap-x snap-mandatory overflow-x-auto bg-[var(--foreground)] text-white [scrollbar-width:none] sm:min-h-[calc(100svh-4.5rem)] lg:grid lg:snap-none lg:grid-cols-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {entryCards.map((card, index) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative block h-[calc(100svh-3.5rem)] w-full flex-none snap-start snap-always overflow-hidden border-r border-white/10 sm:h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-4.5rem)] lg:w-auto lg:snap-none lg:border-b-0 lg:border-r lg:border-white/10 last:lg:border-r-0"
          >
            <Image
              src={card.image}
              alt={card.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              style={{ objectPosition: card.objectPosition }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_40%,rgba(0,0,0,0.38)_100%)]" />
            <div className="absolute inset-x-4 top-[56%] z-10 flex -translate-y-1/2 items-baseline justify-center gap-4 whitespace-nowrap font-sans lg:hidden">
              {index === 1 ? (
                <span className="text-[0.9rem] font-bold uppercase leading-none tracking-tight sm:text-[1rem]">
                  {card.sideLabel}
                </span>
              ) : null}
              <span className="text-[1.55rem] font-bold uppercase leading-none tracking-tight sm:text-[1.85rem] lg:text-[2.15rem]">
                {card.label}
              </span>
              {index === 0 ? (
                <span className="text-[0.9rem] font-bold uppercase leading-none tracking-tight sm:text-[1rem]">
                  {card.sideLabel}
                </span>
              ) : null}
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 hidden justify-center px-5 pb-11 text-center sm:pb-14 lg:flex lg:pb-20">
              <span className="relative inline-flex pb-2 text-[1rem] font-bold uppercase leading-none tracking-tight sm:text-[1.75rem] lg:text-[2rem]">
                {card.label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 bg-white opacity-0 transition group-hover:opacity-100" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <SiteFooter compact />
    </main>
  );
}
