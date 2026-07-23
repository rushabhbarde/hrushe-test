"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type PolicySection = {
  title: string;
  body: string;
};

export type PolicyTab = {
  key: string;
  label: string;
  sections: readonly PolicySection[];
};

type PolicyLayoutProps = {
  policies: readonly PolicyTab[];
  defaultPolicyKey: string;
  label: string;
  title: string;
  description: string;
  lastUpdated: string;
};

function sectionId(policyKey: string, title: string) {
  return `${policyKey}-${title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function PolicyLayout({
  policies,
  defaultPolicyKey,
  label,
  title,
  description,
  lastUpdated,
}: PolicyLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileContentsOpen, setMobileContentsOpen] = useState(false);
  const activeTab = searchParams.get("tab") || defaultPolicyKey;

  const currentPolicy = useMemo(
    () => policies.find((policy) => policy.key === activeTab) || policies[0],
    [activeTab, policies]
  );

  const sectionItems = useMemo(
    () =>
      currentPolicy.sections.map((section) => ({
        ...section,
        id: sectionId(currentPolicy.key, section.title),
      })),
    [currentPolicy]
  );

  const [activeSectionId, setActiveSectionId] = useState(sectionItems[0]?.id || "");
  const visibleActiveSectionId = sectionItems.some((section) => section.id === activeSectionId)
    ? activeSectionId
    : sectionItems[0]?.id || "";

  useEffect(() => {
    if (!sectionItems.length) return;

    const observedSections = sectionItems
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!observedSections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];

        if (visibleEntry?.target.id) {
          setActiveSectionId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-32% 0px -56% 0px",
        threshold: [0, 1],
      }
    );

    observedSections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionItems]);

  const switchPolicy = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextPolicy = policies.find((policy) => policy.key === key);

    params.set("tab", key);
    setActiveSectionId(nextPolicy?.sections[0] ? sectionId(key, nextPolicy.sections[0].title) : "");
    setMobileContentsOpen(false);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onSectionLinkClick = (id: string) => {
    setActiveSectionId(id);
    setMobileContentsOpen(false);
  };

  return (
    <main className="bg-[#f8f7f2]">
      <div className="mx-auto max-w-[1600px] px-4 py-11 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <header className="grid gap-8 border-b border-[var(--border)] pb-9 sm:pb-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(18rem,0.22fr)] lg:items-end">
          <div className="max-w-5xl">
            <p className="eyebrow text-[var(--muted)]">{label}</p>
            <h1 className="mt-5 max-w-[13ch] text-[2.45rem] font-medium uppercase leading-[0.94] text-[var(--foreground)] sm:text-[3.6rem] lg:text-[4.7rem] xl:text-[5.15rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-[0.98rem] leading-7 text-[var(--muted)] sm:text-[1.04rem] sm:leading-8">
              {description}
            </p>
          </div>
          <div className="border-t border-[var(--border)] pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">
              {lastUpdated}
            </p>
          </div>
        </header>

        <div className="sticky top-[5.35rem] z-20 mt-7 border-y border-[var(--border)] bg-[#f8f7f2] lg:hidden">
          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left"
            onClick={() => setMobileContentsOpen((current) => !current)}
            aria-expanded={mobileContentsOpen}
            aria-controls="mobile-policy-contents"
          >
            <span>
              <span className="eyebrow block text-[var(--muted)]">Contents</span>
              <span className="mt-1 block text-sm font-medium text-[var(--foreground)]">
                {currentPolicy.label}
              </span>
            </span>
            <span className="text-xl leading-none" aria-hidden="true">
              {mobileContentsOpen ? "-" : "+"}
            </span>
          </button>

          {mobileContentsOpen ? (
            <div id="mobile-policy-contents" className="border-t border-[var(--border)] pb-4">
              <div className="grid gap-2 py-4" aria-label="Policy pages">
                {policies.map((policy) => {
                  const isActive = currentPolicy.key === policy.key;

                  return (
                    <button
                      key={`mobile-${policy.key}`}
                      type="button"
                      onClick={() => switchPolicy(policy.key)}
                      className={`min-h-11 border px-4 py-3 text-left text-sm font-medium ${
                        isActive
                          ? "border-[var(--foreground)] bg-[#f8f7f2] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-transparent text-[var(--foreground)]"
                      }`}
                    >
                      {policy.label}
                    </button>
                  );
                })}
              </div>

              <nav className="grid gap-1 border-t border-[var(--border)] pt-4" aria-label="Policy sections">
                {sectionItems.map((section) => (
                  <a
                    key={`mobile-section-${section.id}`}
                    href={`#${section.id}`}
                    onClick={() => onSectionLinkClick(section.id)}
                    className={`block py-2 text-sm leading-6 ${
                      visibleActiveSectionId === section.id
                        ? "font-medium text-[var(--foreground)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-10 pt-10 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-16 lg:pt-14">
          <aside className="hidden min-w-0 lg:block" aria-label="Policy sections">
            <div className="sticky top-32 space-y-9">
              <div>
                <p className="eyebrow border-b border-[var(--border)] pb-4 text-[var(--muted)]">
                  {label}
                </p>
                <div className="mt-4 grid gap-2" role="tablist" aria-label="Policy pages">
                  {policies.map((policy) => {
                    const isActive = currentPolicy.key === policy.key;

                    return (
                      <button
                        key={policy.key}
                        id={`policy-tab-${policy.key}`}
                        type="button"
                        onClick={() => switchPolicy(policy.key)}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls="active-policy-panel"
                        className={`group grid min-h-14 grid-cols-[0.55rem_1fr] items-center gap-3 border border-transparent px-2 py-3 text-left transition ${
                          isActive
                            ? "text-[var(--foreground)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <span
                          className={`h-px w-full transition ${
                            isActive ? "bg-[var(--foreground)]" : "bg-[var(--border)] group-hover:bg-[var(--foreground)]"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-[0.92rem] font-medium leading-5">{policy.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <nav aria-label={`${currentPolicy.label} table of contents`}>
                <p className="eyebrow border-b border-[var(--border)] pb-4 text-[var(--muted)]">
                  {currentPolicy.label}
                </p>
                <div className="mt-4 border-l border-[var(--border)]">
                  {sectionItems.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={() => onSectionLinkClick(section.id)}
                      className={`relative block py-2.5 pl-5 text-sm leading-5 transition ${
                        visibleActiveSectionId === section.id
                          ? "text-[var(--foreground)]"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <span
                        className={`absolute left-[-1px] top-2.5 h-5 w-px transition ${
                          visibleActiveSectionId === section.id ? "bg-[var(--foreground)]" : "bg-transparent"
                        }`}
                        aria-hidden="true"
                      />
                      {section.title}
                    </a>
                  ))}
                </div>
              </nav>

              <Link href="/contact" className="button-secondary inline-flex items-center px-5 py-3 text-sm transition">
                Need support?
              </Link>
            </div>
          </aside>

          <article
            id="active-policy-panel"
            role="tabpanel"
            aria-labelledby={`policy-tab-${currentPolicy.key}`}
            className="min-w-0"
          >
            <div className="grid gap-4 border-b border-[var(--border)] pb-8 lg:grid-cols-[8rem_minmax(0,46rem)] lg:gap-10">
              <p className="eyebrow text-[var(--muted)]">{currentPolicy.label}</p>
              <h2 className="text-[2rem] font-medium leading-none text-[var(--foreground)] sm:text-[2.7rem]">
                {currentPolicy.label}
              </h2>
            </div>

            <div>
              {sectionItems.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-32 grid gap-4 border-b border-[var(--border)] py-8 sm:py-10 lg:grid-cols-[8rem_minmax(0,46rem)] lg:gap-10 lg:py-12"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="min-w-0">
                    <h3 className="text-[1.35rem] font-medium leading-tight text-[var(--foreground)] sm:text-[1.65rem]">
                      {section.title}
                    </h3>
                    <div className="mt-5 max-w-3xl space-y-3 break-words text-[0.98rem] leading-8 text-[var(--muted)]">
                      {section.body.split("\n").map((paragraph, paragraphIndex) => (
                        <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
