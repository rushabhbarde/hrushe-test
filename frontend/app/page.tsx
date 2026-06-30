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
    <main className="h-svh overflow-hidden bg-[var(--background)] text-[var(--foreground)] lg:h-auto lg:min-h-svh lg:overflow-visible">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[3.375rem] items-center justify-start border-b border-[var(--border)] bg-[var(--header-background)] px-6 sm:h-[4.5rem] sm:justify-center sm:px-4 lg:relative lg:inset-auto">
        <Link href="/" aria-label="HRUSHE home" className="inline-flex items-center justify-center">
          <Image
            src="/NEW_LOGO.png"
            alt="HRUSHE"
            width={220}
            height={72}
            priority
            className="h-7 w-auto object-contain sm:h-12"
          />
        </Link>
      </header>

      <div className="mt-[3.375rem] h-[calc(100svh-3.375rem)] snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] sm:mt-[4.5rem] sm:h-[calc(100svh-4.5rem)] lg:mt-0 lg:h-auto lg:snap-none lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        <section className="flex h-full snap-start snap-always snap-x snap-mandatory overflow-x-auto bg-[var(--foreground)] text-white [scrollbar-width:none] lg:grid lg:h-auto lg:min-h-[calc(100svh-4.5rem)] lg:snap-none lg:grid-cols-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {entryCards.map((card, index) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative block h-full w-full flex-none snap-start snap-always overflow-hidden border-r border-white/10 lg:h-[calc(100svh-4.5rem)] lg:w-auto lg:snap-none lg:border-b-0 lg:border-r lg:border-white/10 last:lg:border-r-0"
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
              <div className="absolute inset-x-0 top-[51%] z-10 flex -translate-y-1/2 justify-center px-5 font-sans lg:hidden">
                <span className="text-center text-[1.75rem] font-bold uppercase leading-none tracking-tight sm:text-[2rem]">
                  {card.label}
                </span>
              </div>
              <span
                className={`absolute top-[51%] z-10 -translate-y-1/2 whitespace-nowrap font-sans text-[0.92rem] font-bold uppercase leading-none tracking-tight sm:text-[1rem] lg:hidden ${
                  index === 0 ? "right-4" : "left-4"
                }`}
              >
                {card.sideLabel}
              </span>
              <div className="absolute inset-x-0 bottom-0 z-10 hidden justify-center px-5 pb-11 text-center sm:pb-14 lg:flex lg:pb-20">
                <span className="relative inline-flex pb-2 text-[1rem] font-bold uppercase leading-none tracking-tight sm:text-[1.75rem] lg:text-[2rem]">
                  {card.label}
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 bg-white opacity-0 transition group-hover:opacity-100" />
                </span>
              </div>
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
