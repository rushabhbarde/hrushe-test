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
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-[var(--accent)]/70 sm:w-10" />
        <p className={`eyebrow ${eyebrowClassName || "text-[var(--muted)]"}`}>
          {eyebrow}
        </p>
      </div>
      <h2 className="display-font mt-4 max-w-[15ch] text-[2.2rem] leading-[0.98] tracking-[-0.055em] text-[var(--foreground)] sm:text-5xl lg:text-[3.6rem]">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-[0.94rem] leading-7 text-[var(--muted)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
