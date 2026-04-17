import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const founders = [
  {
    name: "Hrushabh Barde",
    image: "/uploads/founders/Hrushabh%20Barde.jpeg",
    description:
      "Building HRUSHE around simplicity, fit, comfort, and honest everyday style.",
  },
  {
    name: "Kshitij Jogi",
    image: "/uploads/founders/KshitijJogi.jpeg",
    description:
      "Shaping the brand with a focus on quality, durability, and wearable minimal design.",
  },
];

export default function StoryPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="eyebrow text-[var(--accent)]">Our story</p>
        <h1 className="display-font mt-4 max-w-4xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
          Fashion should feel simple, expressive, and made for real life.
        </h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 text-base leading-8 text-[var(--muted)]">
            <p>
              <strong className="text-[var(--foreground)]">HRUSHE</strong> was born from a belief
              that fashion should be simple, expressive, and built for real life.
            </p>
            <p>Not overloaded with trends.</p>
            <p>Not loud for the sake of attention.</p>
            <p>
              Just clean, comfortable, premium everyday wear that lets people feel confident in
              their own skin.
            </p>
            <p>
              Our journey started with one idea: to create clothing that blends minimal design,
              perfect fit, and high-quality fabric at an honest price.
            </p>
            <p>
              When we looked around, we saw two kinds of fashion: cheap, disposable fast fashion
              or overpriced premium wear that wasn&apos;t practical for everyday use.
            </p>
            <p>
              We felt there had to be a middle ground, something stylish, affordable, long-lasting,
              and genuinely comfortable.
            </p>
            <p>So we set out to build it.</p>
          </section>

          <aside className="grain-card h-fit rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow text-[var(--accent)]">What we stand for</p>
            <div className="mt-6 space-y-4">
              <p className="text-xl font-semibold">More durability</p>
              <p className="text-xl font-semibold">More comfort</p>
              <p className="text-xl font-semibold">More style</p>
              <p className="text-xl font-semibold">More honesty</p>
            </div>
          </aside>
        </div>

        <section className="mt-12 space-y-6 text-base leading-8 text-[var(--muted)]">
          <p>
            What began as sketches, fabric samples, and late-night brainstorming slowly turned
            into a brand with a purpose.
          </p>
          <p>Every product we create today is a reflection of that purpose.</p>
          <p>
            We obsess over small details: the stitching, the softness, the fall of the fabric,
            the color tone, and the fit on different body types.
          </p>
          <p>
            Because we want every piece to make you feel good the moment you wear it.
          </p>
          <p>
            HRUSHE isn&apos;t just a clothing line. It&apos;s a mindset, a celebration of minimalism,
            comfort, and effortless confidence.
          </p>
          <p>
            We design for people who want more out of their wardrobe: more durability, more
            comfort, more style, and more honesty.
          </p>
          <p>
            From oversized tees to daily essentials, each product is crafted with care and
            finished with quality checks that ensure you get something worth owning, not just
            wearing.
          </p>
          <p>
            <strong className="text-[var(--foreground)]">Our story is still being written,</strong>{" "}
            and every customer who chooses HRUSHE becomes part of that journey.
          </p>
          <p>
            A community built on simplicity, authenticity, and modern everyday style.
          </p>
        </section>

        <section className="mt-14">
          <p className="eyebrow text-[var(--accent)]">Founders</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {founders.map((founder) => (
              <div key={founder.name} className="grain-card overflow-hidden rounded-[2rem]">
                <div className="relative aspect-[4/5] bg-[var(--surface-strong)]">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xl font-semibold">{founder.name}, Founder</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{founder.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] px-6 py-10 text-center sm:px-10">
          <p className="display-font text-3xl sm:text-4xl">This is where it all started.</p>
          <p className="mt-4 text-lg text-[var(--muted)]">And this is only the beginning.</p>
          <p className="mt-8 text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
            Welcome to HRUSHE
          </p>
          <p className="mt-3 text-xl text-[var(--foreground)]">
            Where style is simple and comfort is everything.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
