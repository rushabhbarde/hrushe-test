import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const principles = [
  {
    number: "01",
    title: "Fit before noise",
    body: "Relaxed proportions are refined through sampling, movement, and everyday wear—not decoration.",
  },
  {
    number: "02",
    title: "Material matters",
    body: "Fabric weight, hand-feel, neckline structure, and wash behaviour shape every piece.",
  },
  {
    number: "03",
    title: "Fewer, better choices",
    body: "A considered palette and focused edit make each release easier to understand and keep wearing.",
  },
];

const founders = [
  {
    name: "Hrushabh Barde",
    role: "Founder",
    image: "/uploads/founders/Hrushabh%20Barde.jpeg",
  },
  {
    name: "Kshitij Jogi",
    role: "Founder",
    image: "/uploads/founders/KshitijJogi.jpeg",
  },
];

export default function StoryPage() {
  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-[1600px] gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.56fr_0.44fr] lg:items-end lg:px-8 lg:py-24">
          <div>
            <p className="eyebrow text-[var(--muted)]">Our story</p>
            <h1 className="mt-5 max-w-[10ch] text-[3rem] font-medium uppercase leading-[0.92] tracking-[-0.045em] sm:text-[4.5rem] lg:text-[5.5rem]">
              Quiet clothes for real life.
            </h1>
          </div>
          <div>
            <p className="max-w-xl text-lg leading-8 text-[var(--foreground)]">
              HRUSHE makes considered everyday clothing for people who want confidence without excess.
            </p>
            <p className="mt-6 max-w-xl text-[0.94rem] leading-7 text-[var(--muted)]">
              The brand began with a simple gap: clothing that feels substantial and expressive, without becoming disposable fast fashion or impractical occasion wear.
            </p>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.4fr_0.6fr] lg:gap-24 lg:px-8 lg:py-32">
            <div>
              <p className="eyebrow text-[var(--muted)]">Why HRUSHE exists</p>
              <h2 className="mt-5 max-w-[10ch] text-[2rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">
                Defined by what we leave out.
              </h2>
            </div>
            <div className="space-y-8 text-lg leading-9 text-[var(--muted)]">
              <p>We do not design around constant novelty. We begin with proportion, material, colour, and how a piece earns its place in an everyday wardrobe.</p>
              <p>That means fewer releases, calmer graphics, and more attention to the details that are felt rather than announced.</p>
              <p className="font-medium text-[var(--foreground)]">Less trend chasing. More pieces you actually want to keep wearing.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.36fr_0.64fr] lg:gap-24">
            <div>
              <p className="eyebrow text-[var(--muted)]">Our approach</p>
              <h2 className="mt-5 max-w-[9ch] text-[2rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">
                Less, considered closely.
              </h2>
            </div>
            <div className="border-t border-[var(--border)]">
              {principles.map((principle) => (
                <article key={principle.number} className="grid gap-4 border-b border-[var(--border)] py-8 sm:grid-cols-[64px_200px_1fr]">
                  <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-[var(--muted)]">{principle.number}</p>
                  <h3 className="text-lg font-medium">{principle.title}</h3>
                  <p className="text-sm leading-7 text-[var(--muted)]">{principle.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-[var(--muted)]">The people behind HRUSHE</p>
                <h2 className="mt-5 text-[2rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">Built with intent.</h2>
              </div>
              <Link href="/contact" className="button-secondary inline-flex w-fit items-center justify-center px-7 text-[0.68rem] font-semibold uppercase tracking-[0.1em]">Contact the studio</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {founders.map((founder) => (
                <article key={founder.name}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-strong)]">
                    <Image src={founder.image} alt={founder.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover grayscale" />
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--border)] py-5">
                    <h3 className="text-base font-medium">{founder.name}</h3>
                    <p className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">{founder.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
