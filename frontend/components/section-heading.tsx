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
    <div className="max-w-2xl">
      <p className={`eyebrow ${eyebrowClassName || "text-[var(--muted)]"}`}>
        {eyebrow}
      </p>
      <h2 className="display-font mt-3 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[var(--muted)]">{description}</p>
    </div>
  );
}
