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
    <div className="max-w-3xl">
      <p className={`eyebrow ${eyebrowClassName || "text-[var(--muted)]"}`}>
        {eyebrow}
      </p>
      <h2 className="display-font mt-4 text-[2.2rem] leading-[1.04] tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl lg:text-[3.6rem]">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-[0.96rem] leading-7 text-[var(--muted)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
