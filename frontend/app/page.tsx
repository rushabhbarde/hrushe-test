import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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
    href: "/women",
    image: "/uploads/banners/shopwomen.png",
    alt: "HRUSHE womenswear campaign",
    objectPosition: "center",
  },
  {
    label: "Shop Men",
    href: "/men",
    image: "/uploads/banners/shopmen.png",
    alt: "HRUSHE menswear campaign",
    objectPosition: "center",
  },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      <header className="relative z-20 flex h-16 items-center justify-center border-b border-[var(--border)] bg-[var(--header-background)] px-4 sm:h-[4.5rem]">
        <Link href="/" aria-label="HRUSHE home" className="inline-flex items-center justify-center">
          <Image
            src="/NEW_LOGO.png"
            alt="HRUSHE"
            width={220}
            height={72}
            priority
            className="h-10 w-auto object-contain sm:h-12"
          />
        </Link>
      </header>

      <section className="grid min-h-[calc(100svh-4rem)] bg-[var(--foreground)] text-white sm:min-h-[calc(100svh-4.5rem)] lg:grid-cols-2">
        {entryCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative block h-[calc((100svh-4rem)/2)] min-h-[380px] overflow-hidden border-b border-white/10 lg:h-[calc(100svh-4.5rem)] lg:border-b-0 lg:border-r lg:border-white/10 last:lg:border-r-0"
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
            <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-5 pb-11 text-center sm:pb-14 lg:pb-20">
              <span className="relative inline-flex pb-2 text-[1rem] font-bold uppercase leading-none tracking-tight sm:text-[1.75rem] lg:text-[2rem]">
                {card.label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 bg-white opacity-0 transition group-hover:opacity-100" />
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
