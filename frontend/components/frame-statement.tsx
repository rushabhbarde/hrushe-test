import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type FrameStatementAction = { href: string; label: string };
export type FrameStatementRow = { label: string; value: string; done?: boolean };

/**
 * A quiet full-page statement: two big words at the edges of an (often empty) frame,
 * a short line of copy, an optional timeline and one clear action.
 * Used for order results, the 404 and other "moments" in the Frame system.
 */
export function FrameStatement({
  kicker,
  words,
  body,
  reference,
  rows,
  actions,
  frame = "empty",
  children,
}: {
  kicker: string;
  words: [string, string];
  body: string;
  reference?: string | null;
  rows?: FrameStatementRow[];
  actions: FrameStatementAction[];
  frame?: "mark" | "empty" | ReactNode;
  children?: ReactNode;
}) {
  const [primary, ...secondary] = actions;
  const frameContent =
    frame === "mark" ? (
      <span className="absolute inset-0 flex items-center justify-center">
        <Image src="/HRUSHESYLOGO.png" alt="" width={300} height={300} className="h-auto w-1/3 opacity-80" />
      </span>
    ) : frame === "empty" ? null : (
      frame
    );

  return (
    <main className="px-5 pb-16 pt-6 lg:px-10 lg:pb-24 lg:pt-12">
      <div className="mx-auto grid max-w-[1320px] gap-6 lg:grid-cols-[minmax(0,1fr)_min(28vw,400px)_minmax(0,1fr)] lg:items-center lg:gap-x-14">
        <div className="flex flex-col gap-4 lg:items-end lg:self-start lg:pt-10 lg:text-right">
          <span className="fr-mono fr-muted">{kicker}</span>
          <h1 aria-label={words.join(" ")} className="fr-word text-[clamp(3.5rem,16vw,7rem)] lg:text-[clamp(3.5rem,5.6vw,7rem)]">
            {words[0]}
            <span className="lg:hidden"> {words[1]}</span>
          </h1>
        </div>

        <div aria-hidden="true" className="fr-frame h-[32svh] w-full lg:h-auto lg:aspect-[4/5]">
          {frameContent}
        </div>

        <div className="flex flex-col gap-8 lg:self-end lg:pb-4">
          <p className="fr-word hidden text-[clamp(3.5rem,5.6vw,7rem)] lg:block" aria-hidden="true">
            {words[1]}
          </p>

          <div className="flex max-w-md flex-col gap-5">
            <p className="text-base leading-7 text-[var(--muted)]">{body}</p>
            {reference ? (
              <p className="fr-mono">
                <span className="fr-muted">Order · </span>
                {reference}
              </p>
            ) : null}

            {rows && rows.length > 0 ? (
              <ol className="flex flex-col">
                {rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-3"
                  >
                    <span className={`fr-mono ${row.done ? "" : "fr-quiet"}`}>{row.label}</span>
                    <span className={`text-sm ${row.done ? "" : "fr-quiet"}`}>{row.value}</span>
                  </li>
                ))}
              </ol>
            ) : null}

            {children}

            {primary ? (
              <Link href={primary.href} className="fr-button mt-2">
                {primary.label}
              </Link>
            ) : null}
            {secondary.length > 0 ? (
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {secondary.map((action) => (
                  <Link key={action.href + action.label} href={action.href} className="fr-mono fr-link">
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
