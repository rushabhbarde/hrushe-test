type HeadingLevel = "h1" | "h2";

export function SectionHeading({
  eyebrow,
  title,
  description,
  eyebrowClassName,
  level = "h1",
}: {
  eyebrow: string;
  title: string;
  description: string;
  eyebrowClassName?: string;
  level?: HeadingLevel;
}) {
  const HeadingTag = level;

  return (
    <div className="reveal-up max-w-3xl">
      <div className="flex items-center gap-2">
        <p className={`eyebrow ${eyebrowClassName || "text-[var(--muted)]"}`}>
          {eyebrow}
        </p>
      </div>
      <HeadingTag className="mt-5 max-w-[16ch] text-[2rem] font-medium uppercase leading-[0.95] tracking-[-0.035em] text-[var(--foreground)] sm:text-[2.75rem] lg:text-[3.5rem]">
        {title}
      </HeadingTag>
      <p className="mt-6 max-w-2xl text-[0.92rem] leading-7 text-[var(--muted)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
