import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
}: {
  eyebrow: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.48fr_0.52fr] lg:gap-14">
      <div className="reveal-up max-w-lg">
        <p className="eyebrow text-[var(--muted)]">{eyebrow}</p>
        <h2 className="mt-3 text-[2.1rem] font-semibold uppercase leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3rem] lg:text-[3.4rem]">
          {title}
        </h2>
      </div>

      <div className="space-y-5 text-[0.97rem] leading-8 text-[var(--muted)]">
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
        <section className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8 lg:pb-20 lg:pt-10">
          <div className="border-b border-[var(--border)] pb-8 sm:pb-10 lg:pb-14">
            <div className="grid gap-8 lg:grid-cols-[0.66fr_0.34fr] lg:items-end lg:gap-10">
              <div className="reveal-up max-w-4xl">
                <p className="eyebrow text-[var(--muted)]">Story</p>
                <h1 className="mt-4 max-w-[11ch] text-[2.75rem] font-semibold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-[4.3rem] lg:text-[5.35rem]">
                  We built HRUSHE for everyday style that feels honest.
                </h1>
                <p className="mt-5 max-w-2xl text-[0.98rem] leading-8 text-[var(--muted)] sm:text-base">
                  This page is not about trends or noise. It is about why the brand exists, what we
                  care about, and the people shaping it.
                </p>
              </div>

              <div className="grid gap-px bg-[var(--border)]">
                {values.map((value) => (
                  <div
                    key={value}
                    className="bg-[var(--background)] px-5 py-5 text-[0.76rem] font-medium uppercase tracking-[0.18em] text-[var(--foreground)] sm:px-6"
                  >
                    {value}
                  </div>
                ))}
                <div className="bg-[var(--surface)] px-5 py-6 sm:px-6">
                  <p className="eyebrow text-[var(--muted)]">What we stand for</p>
                  <p className="mt-3 text-[1rem] leading-7 text-[var(--foreground)]">
                    Less trend chasing. More pieces you actually want to keep wearing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <StoryBlock
            eyebrow="Why we started"
            title="A middle ground between disposable and impractical."
            paragraphs={originStory}
          />
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="border-y border-[var(--border)] py-8 sm:py-10 lg:py-12">
            <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr] lg:items-end lg:gap-10">
              <div className="reveal-up">
                <p className="eyebrow text-[var(--muted)]">What we refuse</p>
                <div className="space-y-2">
                  <p className="text-[1.95rem] font-semibold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] sm:text-[3rem] lg:text-[4rem]">
                    Not overloaded with trends.
                  </p>
                  <p className="text-[1.95rem] font-semibold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] sm:text-[3rem] lg:text-[4rem]">
                    Not loud for the sake of attention.
                  </p>
                </div>
              </div>
              <p className="text-[0.98rem] leading-8 text-[var(--muted)]">
                Just clean, comfortable, premium everyday wear that lets people feel confident in
                their own skin.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.52fr_0.48fr] lg:gap-14">
            <div className="reveal-up max-w-lg">
              <p className="eyebrow text-[var(--muted)]">Built with care</p>
              <h2 className="mt-3 text-[2.1rem] font-semibold uppercase leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3rem] lg:text-[3.4rem]">
                Care shows up in the details.
              </h2>
            </div>

            <div className="space-y-5 text-[0.97rem] leading-8 text-[var(--muted)]">
              {buildStory.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr] lg:gap-10">
            <div className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 lg:p-10">
              <p className="eyebrow text-[var(--muted)]">What HRUSHE means</p>
              <div className="mt-5 space-y-5 text-[0.97rem] leading-8 text-[var(--muted)]">
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
            </div>

            <div className="flex flex-col justify-between gap-px bg-[var(--border)]">
              <div className="bg-[var(--background)] px-6 py-6">
                <p className="eyebrow text-[var(--muted)]">The brand language</p>
                <p className="mt-3 text-[1.6rem] font-semibold uppercase leading-[1] tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.2rem]">
                  Simplicity, authenticity, and modern everyday style.
                </p>
              </div>
              <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
                {values.map((value) => (
                  <div
                    key={`detail-${value}`}
                    className="bg-[var(--background)] px-5 py-5 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)]"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-4 border-t border-[var(--border)] py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow text-[var(--muted)]">Founders</p>
              <h2 className="mt-3 text-[2.1rem] font-semibold uppercase leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3rem] lg:text-[3.4rem]">
                The people shaping the brand.
              </h2>
            </div>
          </div>

          <div className="grid gap-6 pt-2 lg:grid-cols-2">
            {founders.map((founder) => (
              <article key={founder.name} className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
                <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-strong)]">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    fill
                    className="object-cover object-center"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col justify-end border-t border-[var(--border)] pt-4 lg:border-t-0 lg:pt-0">
                  <p className="text-[1.1rem] font-medium uppercase leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[1.3rem]">
                    {founder.name}
                  </p>
                  <p className="mt-1 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    {founder.role}
                  </p>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
                    {founder.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-12">
          <div className="border-t border-[var(--border)] py-8 sm:py-10 lg:py-12">
            <div className="max-w-3xl">
              <p className="eyebrow text-[var(--muted)]">The beginning</p>
              <p className="mt-3 text-[2.2rem] font-semibold uppercase leading-[0.94] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3.3rem] lg:text-[4rem]">
                This is where it all started.
              </p>
              <p className="mt-5 text-[0.98rem] leading-8 text-[var(--muted)]">
                And this is only the beginning.
              </p>
              <p className="mt-8 text-[0.98rem] font-medium uppercase tracking-[0.24em] text-[var(--accent)] sm:text-[1.08rem]">
                Welcome to HRUSHE
              </p>
              <p className="mt-4 max-w-2xl text-[1.05rem] leading-7 text-[var(--foreground)] sm:text-[1.15rem]">
                Where style is simple and comfort is everything.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
