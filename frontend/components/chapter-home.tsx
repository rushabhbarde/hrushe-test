"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HomepageMediaFrame } from "@/components/homepage-media";
import { OpenSupportButton } from "@/components/open-support-button";
import { LookDots, LookPeek, LookStrip, useShopTheLook, type LookPiece } from "@/components/shop-the-look";

export type Chapter = {
  id: string;
  label: string;
  top: string;
  bottom: string;
  image: string;
  mobileImage: string;
  alt: string;
  objectPosition: string;
  ctaText: string;
  ctaLink: string;
  /** Shop the look: dots on this photo, each pointing at a piece. */
  look: LookPiece[];
};

export type EditCard = {
  id: string;
  title: string;
  image: string;
  mobileImage: string;
  objectPosition: string;
  href: string;
};

/**
 * Chapters: each campaign is a room you walk through, one per screen. The title is split
 * around the photo (top word above, the rest below); the last chapter is "The edit",
 * where the category words change the photo.
 */
export function ChapterHome({
  side,
  chapters,
  edit,
}: {
  side: "Men" | "Women";
  chapters: Chapter[];
  edit: EditCard[];
}) {
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [active, setActive] = useState(0);
  const [card, setCard] = useState(0);
  const look = useShopTheLook();
  const hasEdit = edit.length > 0;
  const rail = [...chapters.map((chapter) => chapter.label), ...(hasEdit ? ["The edit"] : [])];

  useEffect(() => {
    const root = document.documentElement;
    const previous = { snap: root.style.scrollSnapType, padding: root.style.scrollPaddingTop };
    root.style.scrollSnapType = "y proximity";
    root.style.scrollPaddingTop = window.matchMedia("(min-width: 1024px)").matches ? "5.5rem" : "3.5rem";

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const index = Number((visible?.target as HTMLElement | undefined)?.dataset.chapter);
        if (!Number.isNaN(index)) {
          setActive(index);
        }
      },
      { threshold: [0.35, 0.6] }
    );
    sectionRefs.current.forEach((section) => section && observer.observe(section));

    return () => {
      observer.disconnect();
      root.style.scrollSnapType = previous.snap;
      root.style.scrollPaddingTop = previous.padding;
    };
  }, [rail.length]);

  const goTo = (index: number) => sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const n = (index: number) => String(index + 1).padStart(2, "0");
  // A title's closing full stop takes the logo's burgundy — the one mark on the screen.
  const withMark = (text: string) =>
    text.endsWith(".") ? (
      <>
        {text.slice(0, -1)}
        <span className="fr-mark">.</span>
      </>
    ) : (
      text
    );
  const currentCard = edit[card] || edit[0];

  const room = (
    index: number,
    top: string,
    bottom: string,
    media: React.ReactNode,
    below: React.ReactNode,
    extraClass = "",
    aside: React.ReactNode = null
  ) => (
    <section
      key={index}
      ref={(element) => {
        sectionRefs.current[index] = element;
      }}
      data-chapter={index}
      aria-label={`${n(index)} · ${rail[index]}`}
      className={`chapter-room relative flex min-h-[calc(100svh-7.5rem)] snap-start flex-col justify-center py-4 lg:min-h-[calc(100svh-5.5rem)] lg:px-10 lg:py-8 lg:pr-[18rem] ${extraClass}`}
    >
      {aside}
      <p className="fr-word relative z-[1] -mb-[0.14em] px-5 text-[clamp(3.5rem,16.5vw,5.5rem)] lg:-ml-[0.04em] lg:-mb-[0.2em] lg:px-0 lg:text-[clamp(5rem,8.5vw,8.5rem)]">
        {withMark(top)}
      </p>
      <div className="fr-frame ml-5 mr-11 h-[50svh] lg:mx-0 lg:aspect-[2/1] lg:h-auto lg:w-full lg:max-w-[1040px]">{media}</div>
      <div className="flex w-full flex-col lg:max-w-[1040px]">
        {bottom ? (
          <p className="fr-word relative z-[1] -mt-[0.16em] px-5 text-right text-[clamp(3.5rem,16.5vw,5.5rem)] lg:-mt-[0.22em] lg:px-0 lg:text-[clamp(5rem,8.5vw,8.5rem)]">
            {withMark(bottom)}
          </p>
        ) : null}
        <div className="px-5 pt-3 lg:px-0 lg:pt-4">{below}</div>
      </div>
    </section>
  );

  return (
    <>
    <div className="relative">
      {chapters.map((chapter, index) =>
        room(
          index,
          chapter.top,
          chapter.bottom,
          <div className="fr-frame__layer is-active">
            <HomepageMediaFrame
              src={chapter.image}
              mobileSrc={chapter.mobileImage}
              alt={chapter.alt}
              priority={index === 0}
              sizes="(min-width: 1024px) 1040px, 100vw"
              className="h-full w-full object-cover"
              objectPosition={chapter.objectPosition}
            />
            {chapter.look.length > 0 ? (
              <LookDots
                look={look}
                room={index}
                pieces={chapter.look}
                image={chapter.image}
                mobileImage={chapter.mobileImage}
                objectPosition={chapter.objectPosition}
              />
            ) : null}
          </div>,
          <>
          <LookStrip look={look} room={index} pieces={chapter.look} />
          <div className="flex items-baseline justify-between gap-4">
            <Link href={chapter.ctaLink} className="fr-mono fr-link">
              {chapter.ctaText} →
            </Link>
            {index < rail.length - 1 ? (
              <button type="button" onClick={() => goTo(index + 1)} className="fr-mono fr-choice min-h-11 lg:hidden">
                Swipe up ↑
              </button>
            ) : null}
          </div>
          </>,
          "",
          <LookPeek look={look} room={index} pieces={chapter.look} />
        )
      )}

      {hasEdit && currentCard
        ? room(
            chapters.length,
            "The",
            "edit.",
            edit.map((item, index) => (
              <div key={item.id} className={`fr-frame__layer ${index === card ? "is-active" : ""}`} aria-hidden={index !== card}>
                <HomepageMediaFrame
                  src={item.image}
                  mobileSrc={item.mobileImage}
                  alt={item.title}
                  sizes="(min-width: 1024px) 1040px, 100vw"
                  className="h-full w-full object-cover"
                  objectPosition={item.objectPosition}
                />
              </div>
            )),
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-x-4 gap-y-0 lg:gap-x-8" role="group" aria-label={`${side} categories`}>
                {edit.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCard(index)}
                    onMouseEnter={() => setCard(index)}
                    onFocus={() => setCard(index)}
                    aria-pressed={index === card}
                    className={`fr-choice fr-word min-h-10 text-[1.15rem]! lg:min-h-11 lg:text-[1.75rem]! ${index === card ? "is-active" : ""}`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              <Link href={currentCard.href} className="fr-mono fr-link self-start">
                Shop {currentCard.title.toLowerCase()} →
              </Link>
            </div>,
            "chapter-edit"
          )
        : null}

      <nav aria-label="Chapters" className="pointer-events-none absolute inset-y-0 right-1 z-20 lg:right-10">
        <div className="pointer-events-auto sticky top-[45svh] flex flex-col gap-1 lg:gap-4">
        {rail.map((label, index) => (
          <button
            key={label + index}
            type="button"
            onClick={() => goTo(index)}
            aria-current={index === active ? "step" : undefined}
            aria-label={`${n(index)} · ${label}`}
            className={`fr-mono fr-choice flex min-h-8 min-w-8 items-center justify-center gap-3 lg:justify-start ${index === active ? "is-active" : ""}`}
          >
            <span className={index === active ? "fr-mark" : undefined}>{n(index)}</span>
            <span className="hidden max-w-[12rem] truncate lg:inline">{label}</span>
          </button>
        ))}
        {active < rail.length - 1 ? (
          <button type="button" onClick={() => goTo(active + 1)} className="fr-mono fr-choice mt-4 hidden text-left lg:block">
            Scroll ↓ {rail[active + 1]}
          </button>
        ) : null}
        </div>
      </nav>
    </div>
      <section
        aria-label="Contact"
        className="flex flex-col gap-5 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] px-5 py-14 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-20"
      >
        <div className="flex flex-col gap-3">
          <span className="fr-mono fr-muted">Questions · Mon–Sat, 10–7</span>
          <p className="fr-word text-[clamp(2.75rem,10vw,5.5rem)]">Talk to us.</p>
        </div>
        <div className="flex flex-col gap-4 lg:items-end">
          <OpenSupportButton className="fr-button w-auto! px-8">Write to us</OpenSupportButton>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="tel:+919112854988" className="fr-mono fr-link">
              Call +91 91128 54988
            </a>
            <a href="mailto:team@hrushe.in" className="fr-mono fr-link normal-case!">
              team@hrushe.in
            </a>
          </div>
        </div>
      </section>

    </>
  );
}
