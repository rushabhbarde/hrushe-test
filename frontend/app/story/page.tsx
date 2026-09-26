import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

const founders = [
  {
    name: "Hrushabh Barde",
    role: "Founder",
    image: "/uploads/founders/Hrushabh%20Barde.jpeg",
    description:
      "Building HRUSHE around simplicity, fit, comfort, and honest everyday style.",
  },
  {
    name: "Kshitij Jogi",
    role: "Founder",
    image: "/uploads/founders/KshitijJogi.jpeg",
    description:
      "Shaping the brand with a focus on quality, durability, and wearable minimal design.",
  },
];

const originStory = [
  "Most fashion sits at two extremes.",
  "Fast fashion: trend-heavy, over-designed, made to be replaced.",
  "Traditional luxury: expensive, often formal, and leaning on logos to say what the clothes should.",
  "HRUSHE sits between them. Premium-feeling everyday clothing, at an accessible premium price.",
  "Clothes that feel right at a café, at work, on a journey or on a relaxed evening — without changing who you are.",
];

const buildStory = [
  "A garment doesn’t need a huge logo or complicated graphics to feel premium.",
  "That feeling comes from fabric, fit, construction, proportion, colour and finishing.",
  "If a detail doesn’t add value, we remove it.",
  "Fewer, stronger pieces. The ones you reach for again and again.",
];

const meaningStory = [
  "Not “look at my expensive clothes.” Just clothes that feel like you.",
  "Modern everyday uniforms, designed with intention, for people who want to look refined without trying too hard.",
  "Clothing is where HRUSHE begins. Quiet confidence and intentional living are what it is built around.",
];

const values = ["Clean silhouettes", "Honest materials", "Repeat wear", "Quiet confidence"];

const chapters = [
  { index: "01", word: "Between", title: "Fast fashion and loud luxury.", paragraphs: originStory },
  { index: "02", word: "Less", title: "Less, but better.", paragraphs: buildStory },
  { index: "03", word: "You", title: "This just feels like me.", paragraphs: meaningStory },
];

const refusals = ["Loud logos", "Hype", "Trend-chasing", "Visual noise"];

function Chapter({ index, word, title, paragraphs }: (typeof chapters)[number]) {
  return (
    <article className="grid gap-6 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] py-12 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-16 lg:py-20">
      <div className="flex flex-col gap-4">
        <span className="fr-mono fr-muted">{index} · {title}</span>
        <h2 className="fr-word text-[clamp(3.5rem,14vw,8rem)] lg:text-[clamp(4rem,7vw,8rem)]">{word}</h2>
      </div>
      <div className="flex max-w-[44rem] flex-col gap-4 text-[1.02rem] leading-8 text-[var(--muted)] lg:pt-10">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

export default function StoryPage() {
  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="px-5 lg:px-10">
        <section className="mx-auto grid max-w-[1320px] gap-6 pb-14 pt-6 lg:grid-cols-[minmax(0,1fr)_min(28vw,400px)_minmax(0,1fr)] lg:items-center lg:gap-x-14 lg:pb-24 lg:pt-12">
          <div className="flex flex-col gap-4 lg:items-end lg:self-start lg:pt-10 lg:text-right">
            <span className="fr-mono fr-muted">Our story</span>
            <h1 aria-label="Defined quietly." className="fr-word text-[clamp(3.5rem,16vw,7rem)] lg:text-[clamp(3.5rem,5.6vw,7rem)]">
              Defined
              <span className="lg:hidden"> quietly.</span>
            </h1>
          </div>
          <div aria-hidden="true" className="fr-frame h-[36svh] w-full lg:h-auto lg:aspect-[4/5]">
            <span className="absolute inset-0 flex items-center justify-center">
              <Image src="/HRUSHESYLOGO.png" alt="" width={300} height={300} priority className="h-auto w-1/3 opacity-80" />
            </span>
          </div>
          <div className="flex flex-col gap-6 lg:self-end lg:pb-4">
            <p aria-hidden="true" className="fr-word hidden text-[clamp(3.5rem,5.6vw,7rem)] lg:block">
              quietly.
            </p>
            <p className="max-w-md text-base leading-7 text-[var(--muted)]">
              HRUSHE is modern everyday clothing: refined essentials with clean silhouettes, honest materials and quiet
              confidence.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {values.map((value) => (
                <li key={value} className="fr-mono">
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mx-auto max-w-[1320px]">
          <Chapter {...chapters[0]} />

          <section className="border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] py-12 lg:py-20" aria-label="What we refuse">
            <span className="fr-mono fr-muted">What we refuse</span>
            <ul className="mt-6 flex flex-col gap-1">
              {refusals.map((word) => (
                <li
                  key={word}
                  className="fr-word fr-quiet text-[clamp(2.75rem,9vw,7rem)] line-through decoration-[3px]"
                >
                  {word}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-md text-base leading-7">
              You don’t need to be loud to be noticed. You simply wear something that feels right.
            </p>
          </section>

          <Chapter {...chapters[1]} />
          <Chapter {...chapters[2]} />

          <section className="border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] py-12 lg:py-20" aria-label="Founders">
            <span className="fr-mono fr-muted">04 · The people shaping the brand</span>
            <div className="mt-8 grid gap-12 sm:grid-cols-2 lg:gap-10">
              {founders.map((founder) => (
                <article key={founder.name} className="flex flex-col gap-4">
                  <div className="fr-frame aspect-[4/5] w-full">
                    <div className="fr-frame__layer is-active">
                      <Image src={founder.image} alt={founder.name} fill unoptimized sizes="(min-width: 640px) 50vw, 100vw" />
                    </div>
                  </div>
                  <h2 className="fr-word text-[clamp(2.25rem,5vw,3.75rem)]">{founder.name}</h2>
                  <span className="fr-mono fr-muted">{founder.role}</span>
                  <p className="max-w-md text-sm leading-7 text-[var(--muted)]">{founder.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] py-14 lg:py-24">
            <span className="fr-mono fr-muted">Defined quietly</span>
            <p className="fr-word text-[clamp(3rem,10vw,8rem)]">Welcome to HRUSHE.</p>
            <p className="max-w-md text-base leading-7 text-[var(--muted)]">Wear what feels like you.</p>
            <Link href="/?choose" className="fr-button max-w-sm">
              Enter the edit
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
