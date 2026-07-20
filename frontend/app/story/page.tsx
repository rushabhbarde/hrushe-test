import Image from "next/image";
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
  "HRUSHE was born from a belief that fashion should be simple, expressive, and built for real life.",
  "Not overloaded with trends.",
  "Not loud for the sake of attention.",
  "Just clean, comfortable, premium everyday wear that lets people feel confident in their own skin.",
  "Our journey started with one idea: to create clothing that blends minimal design, perfect fit, and high-quality fabric at an honest price.",
  "When we looked around, we saw two kinds of fashion: cheap, disposable fast fashion or overpriced premium wear that wasn't practical for everyday use.",
  "We felt there had to be a middle ground, something stylish, affordable, long-lasting, and genuinely comfortable.",
  "So we set out to build it.",
];

const buildStory = [
  "What began as sketches, fabric samples, and late-night brainstorming slowly turned into a brand with a purpose.",
  "Every product we create today is a reflection of that purpose.",
  "We obsess over small details: the stitching, the softness, the fall of the fabric, the color tone, and the fit on different body types.",
  "Because we want every piece to make you feel good the moment you wear it.",
];

const meaningStory = [
  "HRUSHE isn't just a clothing line. It's a mindset, a celebration of minimalism, comfort, and effortless confidence.",
  "We design for people who want more out of their wardrobe: more durability, more comfort, more style, and more honesty.",
  "From oversized tees to daily essentials, each product is crafted with care and finished with quality checks that ensure you get something worth owning, not just wearing.",
  "Our story is still being written, and every customer who chooses HRUSHE becomes part of that journey.",
  "A community built on simplicity, authenticity, and modern everyday style.",
];

const values = [
  "Minimal design",
  "Better fit",
  "Honest quality",
  "Everyday comfort",
];

function StoryBlock({
  eyebrow,
  title,
  paragraphs,
  index,
}: {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  index: string;
}) {
  return (
    <div className="grid gap-8 border-t border-[var(--border)] py-10 sm:py-14 lg:grid-cols-[0.38fr_0.62fr] lg:gap-16 lg:py-20">
      <div className="reveal-up max-w-xl">
        <div className="flex items-center gap-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {index}
          </span>
          <p className="eyebrow text-[var(--muted)]">{eyebrow}</p>
        </div>
        <h2 className="mt-5 text-[2.25rem] font-semibold uppercase leading-[0.92] tracking-normal text-[var(--foreground)] sm:text-[3.25rem] lg:text-[4rem]">
          {title}
        </h2>
      </div>

      <div className="max-w-3xl space-y-5 text-[1rem] leading-8 text-[var(--muted)] sm:text-[1.05rem]">
        {paragraphs.map((paragraph, index) => (
          <p key={`${eyebrow}-${index}`}>
            {paragraph.includes("Our story is still being written") ? (
              <>
                <strong className="text-[var(--foreground)]">
                  Our story is still being written,
                </strong>{" "}
                and every customer who chooses HRUSHE becomes part of that journey.
              </>
            ) : paragraph.startsWith("HRUSHE was born") ? (
              <>
                <strong className="text-[var(--foreground)]">HRUSHE</strong>
                {paragraph.replace("HRUSHE", "")}
              </>
            ) : (
              paragraph
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function StoryPage() {
  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="relative min-h-[calc(100svh-5.6rem)] overflow-hidden bg-black text-white">
          <div className="absolute inset-0 grid grid-cols-2" aria-hidden="true">
            {founders.map((founder) => (
              <div key={`hero-${founder.name}`} className="relative min-h-full overflow-hidden">
                <Image
                  src={founder.image}
                  alt=""
                  fill
                  priority
                  className="object-cover object-center opacity-[0.68]"
                  unoptimized
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.58)_48%,rgba(0,0,0,0.24)_100%)]" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.6rem)] max-w-[1600px] flex-col justify-end px-4 pb-8 pt-24 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
            <div className="reveal-up max-w-5xl">
              <p className="eyebrow text-white/70">Story</p>
              <h1 className="mt-5 max-w-[13ch] break-normal text-[3rem] font-semibold uppercase leading-[0.9] tracking-normal text-white sm:text-[5rem] lg:max-w-[980px] lg:text-[5.8rem] xl:text-[6.25rem]">
                We built HRUSHE for everyday style that feels honest.
              </h1>
              <p className="mt-6 max-w-2xl text-[1rem] leading-8 text-white/76 sm:text-[1.08rem]">
                This page is not about trends or noise. It is about why the brand exists, what we
                care about, and the people shaping it.
              </p>
            </div>

            <div className="mt-10 grid border-y border-white/18 sm:grid-cols-[0.9fr_1.1fr] lg:mt-14 lg:grid-cols-[0.48fr_0.52fr]">
              <div className="grid grid-cols-2 border-white/18 sm:border-r">
                {values.map((value) => (
                  <div
                    key={value}
                    className="border-b border-white/18 px-4 py-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-white sm:px-5 sm:py-5"
                  >
                    {value}
                  </div>
                ))}
              </div>
              <div className="px-4 py-5 sm:px-6">
                <p className="eyebrow text-white/58">What we stand for</p>
                <p className="mt-3 max-w-xl text-[1rem] leading-7 text-white">
                  Less trend chasing. More pieces you actually want to keep wearing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <StoryBlock
            eyebrow="Why we started"
            title="A middle ground between disposable and impractical."
            paragraphs={originStory}
            index="01"
          />
        </section>

        <section className="bg-[var(--foreground)] text-[var(--background)]">
          <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-[0.68fr_0.32fr] lg:items-end lg:gap-12">
              <div className="reveal-up">
                <p className="eyebrow text-white/54">What we refuse</p>
                <div className="mt-5 space-y-2">
                  <p className="text-[2.2rem] font-semibold uppercase leading-[0.92] tracking-normal text-white sm:text-[4rem] lg:text-[5.4rem]">
                    Not overloaded with trends.
                  </p>
                  <p className="text-[2.2rem] font-semibold uppercase leading-[0.92] tracking-normal text-white sm:text-[4rem] lg:text-[5.4rem]">
                    Not loud for the sake of attention.
                  </p>
                </div>
              </div>
              <p className="max-w-md text-[1rem] leading-8 text-white/68 sm:text-[1.08rem]">
                Just clean, comfortable, premium everyday wear that lets people feel confident in
                their own skin.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <StoryBlock
            eyebrow="Built with care"
            title="Care shows up in the details."
            paragraphs={buildStory}
            index="02"
          />
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
            <div className="flex flex-col justify-between gap-8 border-y border-[var(--border)] py-8 lg:min-h-[34rem]">
              <div>
                <p className="eyebrow text-[var(--muted)]">The brand language</p>
                <p className="mt-5 text-[2.3rem] font-semibold uppercase leading-[0.92] tracking-normal text-[var(--foreground)] sm:text-[3.4rem]">
                  Simplicity, authenticity, and modern everyday style.
                </p>
              </div>
              <p className="max-w-md text-[0.98rem] leading-8 text-[var(--muted)]">
                A quieter wardrobe built around pieces that feel easy, wearable, and worth coming back to.
              </p>
            </div>

            <div className="border-y border-[var(--border)] py-8">
              <p className="eyebrow text-[var(--muted)]">What HRUSHE means</p>
              <div className="mt-6 space-y-5 text-[1rem] leading-8 text-[var(--muted)] sm:text-[1.05rem]">
                {meaningStory.map((paragraph) => (
                  <p key={paragraph}>
                    {paragraph.startsWith("Our story is still being written") ? (
                      <>
                        <strong className="text-[var(--foreground)]">
                          Our story is still being written,
                        </strong>{" "}
                        and every customer who chooses HRUSHE becomes part of that journey.
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
              <div className="mt-9 grid border-t border-l border-[var(--border)] sm:grid-cols-2">
                {values.map((value) => (
                  <div
                    key={`detail-${value}`}
                    className="border-b border-r border-[var(--border)] px-5 py-5 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)]"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 border-t border-[var(--border)] py-8 sm:flex-row sm:items-end sm:justify-between lg:py-10">
            <div className="max-w-2xl">
              <p className="eyebrow text-[var(--muted)]">Founders</p>
              <h2 className="mt-4 text-[2.35rem] font-semibold uppercase leading-[0.92] tracking-normal text-[var(--foreground)] sm:text-[3.6rem] lg:text-[4.4rem]">
                The people shaping the brand.
              </h2>
            </div>
          </div>

          <div className="grid gap-8 pt-2 lg:grid-cols-2">
            {founders.map((founder, index) => (
              <article key={founder.name} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-strong)]">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    fill
                    className="object-cover object-center transition duration-500 group-hover:scale-[1.015]"
                    unoptimized
                  />
                </div>
                <div className="grid gap-4 border-b border-[var(--border)] py-5 sm:grid-cols-[auto_1fr] sm:gap-8">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-[1.25rem] font-medium uppercase leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[1.55rem]">
                      {founder.name}
                    </p>
                    <p className="mt-1 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                      {founder.role}
                    </p>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                      {founder.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-14 pt-4 sm:px-6 lg:px-8 lg:pb-20">
          <div className="border-y border-[var(--border)] py-10 sm:py-14 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr] lg:items-end lg:gap-16">
              <div>
                <p className="eyebrow text-[var(--muted)]">The beginning</p>
                <p className="mt-5 text-[1rem] leading-8 text-[var(--muted)]">
                  And this is only the beginning.
                </p>
              </div>
              <div>
                <p className="text-[2.45rem] font-semibold uppercase leading-[0.92] tracking-normal text-[var(--foreground)] sm:text-[4rem] lg:text-[5.25rem]">
                  This is where it all started.
                </p>
                <p className="mt-9 text-[0.98rem] font-medium uppercase tracking-[0.24em] text-[var(--accent)] sm:text-[1.08rem]">
                  Welcome to HRUSHE
                </p>
                <p className="mt-4 max-w-2xl text-[1.05rem] leading-7 text-[var(--foreground)] sm:text-[1.15rem]">
                  Where style is simple and comfort is everything.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
