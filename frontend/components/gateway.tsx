"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type MouseEvent } from "react";
import { HomepageMediaFrame } from "@/components/homepage-media";
import {
  HRUSHE_LOGO_DIMENSIONS,
  HRUSHE_LOGO_PATH,
  HRUSHE_SYMBOL_LOGO_DIMENSIONS,
  HRUSHE_SYMBOL_LOGO_PATH,
} from "@/lib/brand-assets";
import {
  GATEWAY_AUTO_SWAP_MS,
  GATEWAY_INTRO_MS,
  hasSeenGatewayIntro,
  markGatewayIntroSeen,
  rememberGatewaySide,
  type GatewayOption,
} from "@/lib/gateway";

const SWIPE_THRESHOLD_PX = 40;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const subscribeNoop = () => () => {};
const getSkipIntroSnapshot = () => Boolean(prefersReducedMotion()) || hasSeenGatewayIntro();
const getSkipIntroServerSnapshot = () => false;

export function Gateway({ options }: { options: GatewayOption[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const skipIntro = useSyncExternalStore(subscribeNoop, getSkipIntroSnapshot, getSkipIntroServerSnapshot);
  const [introTimerDone, setIntroTimerDone] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const active = options[activeIndex] ?? options[0];
  const introDone = skipIntro || introTimerDone;
  const fastIntro = skipIntro && !introTimerDone;

  useEffect(() => {
    if (skipIntro) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIntroTimerDone(true);
      markGatewayIntroSeen();
    }, GATEWAY_INTRO_MS);

    return () => window.clearTimeout(timer);
  }, [skipIntro]);

  useEffect(() => {
    if (!introDone || interacted || hovering || options.length < 2 || prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveIndex((index) => (index + 1) % options.length);
      }
    }, GATEWAY_AUTO_SWAP_MS);

    return () => window.clearInterval(timer);
  }, [introDone, interacted, hovering, options.length]);

  const select = useCallback((index: number) => {
    setInteracted(true);
    setActiveIndex(index);
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      setInteracted(true);
      setActiveIndex((index) => Math.min(Math.max(index + direction, 0), options.length - 1));
    },
    [options.length]
  );

  const onEnter = (option: GatewayOption) => () => rememberGatewaySide(option.side);

  const onFramePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    pointerStartX.current = event.clientX;
    swiped.current = false;
  };

  const onFramePointerUp = (event: PointerEvent<HTMLAnchorElement>) => {
    if (pointerStartX.current === null) {
      return;
    }

    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      swiped.current = true;
      step(deltaX < 0 ? 1 : -1);
    }
  };

  const onFrameClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (swiped.current) {
      event.preventDefault();
      swiped.current = false;
      return;
    }

    rememberGatewaySide(active?.side ?? null);
  };

  if (!active) {
    return null;
  }

  const enterLabel = `Shop ${active.label.toLowerCase()}`;

  const words = options.map((option, index) => {
    const isActive = index === activeIndex;
    // `!` because the global `a, button { color: inherit }` reset in globals.css is unlayered and beats utilities.
    const colorClass = isActive ? "text-[var(--foreground)]!" : "text-[var(--muted)]!";

    return { option, index, isActive, colorClass };
  });

  return (
    <div className="relative flex min-h-svh flex-col bg-[var(--background)] text-[var(--foreground)]">
      <div
        aria-hidden="true"
        className={`gateway-intro fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] transition-opacity ease-out ${
          fastIntro ? "duration-200" : "duration-[900ms]"
        } ${introDone ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <Image
          src={HRUSHE_SYMBOL_LOGO_PATH}
          alt=""
          width={HRUSHE_SYMBOL_LOGO_DIMENSIONS.width}
          height={HRUSHE_SYMBOL_LOGO_DIMENSIONS.height}
          priority
          className={`h-20 w-20 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-28 sm:w-28 ${
            introDone ? "scale-[0.92]" : "scale-100"
          }`}
        />
      </div>

      <header
        className={`flex h-[3.375rem] shrink-0 items-center justify-start px-5 transition-opacity delay-200 duration-[900ms] sm:h-[4.5rem] sm:justify-center ${
          introDone ? "opacity-100" : "opacity-0"
        }`}
      >
        <Link href="/" aria-label="HRUSHE home" className="inline-flex items-center">
          <Image
            src={HRUSHE_LOGO_PATH}
            alt="HRUSHE"
            width={HRUSHE_LOGO_DIMENSIONS.width}
            height={HRUSHE_LOGO_DIMENSIONS.height}
            priority
            className="h-7 w-auto object-contain sm:h-11"
          />
        </Link>
      </header>

      <div
        onMouseLeave={() => setHovering(false)}
        className={`flex flex-1 flex-col gap-5 px-5 pb-7 pt-2 transition-opacity delay-300 duration-1000 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-10 lg:px-10 lg:pb-10 lg:pt-0 xl:gap-x-12 ${
          introDone ? "opacity-100" : "opacity-0"
        }`}
      >
        {words[0] ? (
          <Link
            href={words[0].option.href}
            onMouseEnter={() => {
              setHovering(true);
              setActiveIndex(0);
            }}
            onFocus={() => setActiveIndex(0)}
            onClick={onEnter(words[0].option)}
            className={`hidden justify-self-end text-[clamp(3.25rem,6.2vw,6.75rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em] transition-colors duration-500 lg:block ${words[0].colorClass}`}
          >
            {words[0].option.label}
          </Link>
        ) : null}

        <div className="flex flex-1 flex-col gap-4 lg:w-[min(30vw,calc((100svh-4.5rem)*0.52))] lg:flex-none">
          <Link
            href={active.href}
            aria-label={enterLabel}
            onPointerDown={onFramePointerDown}
            onPointerUp={onFramePointerUp}
            onClick={onFrameClick}
            className="relative block min-h-[48svh] w-full flex-1 touch-pan-y select-none overflow-hidden bg-[var(--surface-strong)] lg:aspect-[3/4] lg:min-h-0 lg:flex-none"
          >
            {options.map((option, index) => (
              <div
                key={option.id}
                aria-hidden={index !== activeIndex}
                className={`absolute inset-0 transition-opacity duration-[1100ms] ease-in-out ${
                  index === activeIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <HomepageMediaFrame
                  src={option.image}
                  mobileSrc={option.mobileImage}
                  alt={option.alt}
                  priority
                  sizes="(max-width: 1023px) 92vw, 30vw"
                  className="pointer-events-none h-full w-full object-cover"
                  objectPosition={option.objectPosition}
                />
              </div>
            ))}
          </Link>

          <div className="hidden items-center justify-between lg:flex">
            <span className="text-[0.8125rem] text-[var(--muted)]">Defined quietly.</span>
            <Link
              href={active.href}
              onClick={onEnter(active)}
              className="border-b border-current pb-1 text-[0.6875rem] font-medium uppercase tracking-[0.18em]"
            >
              {enterLabel} →
            </Link>
          </div>

          <nav aria-label="Choose a collection" className="flex items-end justify-between lg:hidden">
            {words.map(({ option, index, isActive, colorClass }) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => select(index)}
                className={`min-h-12 text-[clamp(2.75rem,13.5vw,3.5rem)]! font-bold! uppercase leading-[0.86]! tracking-[-0.055em]! transition-colors duration-500 ${colorClass}`}
              >
                {option.label}
              </button>
            ))}
          </nav>

          <Link
            href={active.href}
            onClick={onEnter(active)}
            className="flex h-13 items-center justify-center bg-[var(--foreground)] text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--background)]! lg:hidden"
          >
            {enterLabel} →
          </Link>
          <p className="text-center text-[0.8125rem] text-[var(--muted)] lg:hidden">Defined quietly.</p>
        </div>

        {words[1] ? (
          <Link
            href={words[1].option.href}
            onMouseEnter={() => {
              setHovering(true);
              setActiveIndex(1);
            }}
            onFocus={() => setActiveIndex(1)}
            onClick={onEnter(words[1].option)}
            className={`hidden justify-self-start text-[clamp(3.25rem,6.2vw,6.75rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em] transition-colors duration-500 lg:block ${words[1].colorClass}`}
          >
            {words[1].option.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
