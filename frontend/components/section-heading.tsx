export function SectionHeading({
  eyebrow,
  title,
  description,
  eyebrowClassName,
}: {
  eyebrow: string;
  title: string;
  description: string;
  eyebrowClassName?: string;
}) {
  return (
    <div className="reveal-up max-w-3xl">
      <div className="flex items-center gap-2">
        <p className={`eyebrow ${eyebrowClassName || "text-[var(--muted)]"}`}>
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-3 max-w-[16ch] text-[2rem] font-semibold uppercase leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-[2.85rem] lg:text-[3.5rem]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-[0.92rem] leading-7 text-[var(--muted)] sm:text-[0.98rem]">
        {description}
      </p>
    </div>
  );
}
