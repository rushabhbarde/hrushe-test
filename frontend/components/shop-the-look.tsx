"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useCart } from "@/components/cart-provider";
import { getAvailableSizes } from "@/components/product-quick-add";
import { useToast } from "@/components/toast-provider";
import type { Product } from "@/lib/catalog";
import { resolveHomepageMediaSource } from "@/lib/homepage-media";
import { getProductDisplayName, getProductFabricLine } from "@/lib/product-presentation";
import { placeOnCoverFrame } from "@/lib/shop-the-look";

/** The slice of a product a campaign dot needs: enough to show it and add it to the bag. */
export type LookProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "displayName"
  | "price"
  | "colour"
  | "colors"
  | "accent"
  | "images"
  | "thumbnailUrl"
  | "sizes"
  | "trackInventory"
  | "variants"
  | "fabric"
  | "gsm"
  | "cottonType"
  | "fitType"
  | "modelHeight"
  | "modelWornSize"
>;

export type LookPiece = {
  id: string;
  x: number;
  y: number;
  mobileX: number | null;
  mobileY: number | null;
  product: LookProduct;
};

type LookState = { room: number; peek: number; open: number };

const closed: LookState = { room: -1, peek: -1, open: -1 };
const HIDE_DELAY_MS = 400;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

function useNaturalSize(src: string) {
  const [size, setSize] = useState({ src: "", width: 0, height: 0 });
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (!cancelled) setSize({ src, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return size.src === src ? size : { width: 0, height: 0 };
}

const lookImage = (product: LookProduct) => product.thumbnailUrl || product.images?.[0] || "";
const lookName = (product: LookProduct) => getProductDisplayName(product as Product);
const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

/**
 * Shop the look: one chapter at a time can show a piece. Hovering a dot (or tapping it on a
 * touch screen) shows that piece under "In this look"; clicking it, or that piece, opens the card.
 */
export function useShopTheLook() {
  const [state, setState] = useState<LookState>(closed);
  const hideTimer = useRef<number | undefined>(undefined);
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const keep = useCallback(() => window.clearTimeout(hideTimer.current), []);
  const peek = useCallback(
    (room: number, piece: number) => {
      keep();
      setState((current) => (current.open >= 0 ? current : { room, peek: piece, open: -1 }));
    },
    [keep]
  );
  const leave = useCallback(() => {
    keep();
    hideTimer.current = window.setTimeout(
      () => setState((current) => (current.open >= 0 ? current : closed)),
      HIDE_DELAY_MS
    );
  }, [keep]);
  const open = useCallback(
    (room: number, piece: number) => {
      keep();
      setState({ room, peek: -1, open: piece });
    },
    [keep]
  );
  const close = useCallback(() => {
    keep();
    setState(closed);
  }, [keep]);
  // Mouse: click opens the card. Touch: the first tap shows the piece, the second opens it.
  const press = useCallback(
    (room: number, piece: number) => {
      if (canHover || (state.room === room && state.peek === piece)) {
        open(room, piece);
      } else {
        keep();
        setState({ room, peek: piece, open: -1 });
      }
    },
    [canHover, keep, open, state.peek, state.room]
  );

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  return { state, canHover, keep, peek, leave, open, close, press };
}

export type ShopTheLook = ReturnType<typeof useShopTheLook>;

/** The dots, laid over a chapter's photo, plus the card when one is open. Lives inside the frame. */
export function LookDots({
  look,
  room,
  pieces,
  image,
  mobileImage,
  objectPosition,
}: {
  look: ShopTheLook;
  room: number;
  pieces: LookPiece[];
  image: string;
  mobileImage: string;
  objectPosition: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const frame = useElementSize(frameRef);
  const wide = useMediaQuery("(min-width: 640px)");
  const sources = resolveHomepageMediaSource({ src: image, mobileSrc: mobileImage });
  const separatePhonePhoto = Boolean(sources && sources.mobileSrc !== sources.desktopSrc);
  const usePhonePhoto = separatePhonePhoto && !wide;
  const photo = useNaturalSize((usePhonePhoto ? sources?.mobileSrc : sources?.desktopSrc) || "");
  const { state } = look;
  const openPiece = state.room === room && state.open >= 0 ? pieces[state.open] : null;

  return (
    <>
      <div
        ref={frameRef}
        className="absolute inset-0 z-[2]"
        onClick={() => (state.room === room && state.open < 0 ? look.close() : undefined)}
      >
        {pieces.map((piece, index) => {
          const point = usePhonePhoto
            ? piece.mobileX == null || piece.mobileY == null
              ? null
              : { x: piece.mobileX, y: piece.mobileY }
            : { x: piece.x, y: piece.y };
          const placed = point ? placeOnCoverFrame(point, frame, photo, objectPosition) : null;
          if (!placed) return null;
          const active = state.room === room && (state.peek === index || state.open === index);

          return (
            <button
              key={piece.id}
              type="button"
              className={`fr-look-dot ${active ? "is-active" : ""}`}
              style={{ left: `${placed.left}%`, top: `${placed.top}%` }}
              aria-label={`${lookName(piece.product)}, ${formatPrice(piece.product.price)}`}
              aria-pressed={active}
              onMouseEnter={look.canHover ? () => look.peek(room, index) : undefined}
              onMouseLeave={look.canHover ? look.leave : undefined}
              onFocus={look.canHover ? () => look.peek(room, index) : undefined}
              onBlur={look.canHover ? look.leave : undefined}
              onClick={(event) => {
                event.stopPropagation();
                look.press(room, index);
              }}
            />
          );
        })}
      </div>
      {openPiece ? (
        <LookCard
          piece={openPiece}
          index={state.open}
          total={pieces.length}
          onClose={look.close}
        />
      ) : null}
    </>
  );
}

function PeekRow({ product, onOpen }: { product: LookProduct; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex items-center gap-[1.125rem] text-left">
      <span className="relative block h-[6.75rem] w-[5.25rem] shrink-0 overflow-hidden bg-[var(--fr-stone)]">
        {lookImage(product) ? (
          <Image src={lookImage(product)} alt="" fill sizes="84px" className="object-cover object-[50%_30%]" />
        ) : null}
      </span>
      <span className="flex flex-col gap-2.5">
        <span className="text-[1.25rem] leading-tight">{lookName(product)}</span>
        <span className="fr-mono text-[0.875rem]! tracking-[0.12em]!">{formatPrice(product.price)}</span>
      </span>
    </button>
  );
}

/** Desktop: "In this look" under the campaign's name in the chapter list, only while a dot is hovered. */
export function LookPeek({ look, room, pieces }: { look: ShopTheLook; room: number; pieces: LookPiece[] }) {
  const { state } = look;
  const piece = state.room === room && state.peek >= 0 ? pieces[state.peek] : null;
  if (!piece) return null;

  return (
    <div
      className="fr-look-in hidden w-[15rem] flex-col gap-4 pb-3 pt-1 lg:flex"
      onMouseEnter={look.keep}
      onMouseLeave={look.leave}
      aria-live="polite"
    >
      <span className="fr-mono fr-muted">In this look</span>
      <PeekRow product={piece.product} onOpen={() => look.open(room, state.peek)} />
    </div>
  );
}

/** Phone and tablet: the same piece, as a row under the photo. */
export function LookStrip({ look, room, pieces }: { look: ShopTheLook; room: number; pieces: LookPiece[] }) {
  const { state } = look;
  const piece = state.room === room && state.peek >= 0 ? pieces[state.peek] : null;
  if (!piece) return null;

  return (
    <div className="fr-look-in mb-3 flex flex-col gap-3 border-t border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pt-3 lg:hidden" aria-live="polite">
      <span className="fr-mono fr-muted">In this look</span>
      <PeekRow product={piece.product} onOpen={() => look.open(room, state.peek)} />
    </div>
  );
}

function LookCard({
  piece,
  index,
  total,
  onClose,
}: {
  piece: LookPiece;
  index: number;
  total: number;
  onClose: () => void;
}) {
  const { addItem, openCart } = useCart();
  const { pushToast } = useToast();
  const product = piece.product;
  const sizes = getAvailableSizes(product as Product);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const closeRef = useRef<HTMLButtonElement>(null);
  const name = lookName(product);
  const details = [
    getProductFabricLine(product as Product),
    product.fitType,
    product.modelHeight ? `Model ${product.modelHeight}${product.modelWornSize ? ` wears ${product.modelWornSize}` : ""}` : "",
  ].filter(Boolean);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const add = () => {
    if (!size && sizes.length > 0) return;
    addItem({
      productId: product.id,
      name,
      price: product.price,
      size,
      color: product.colour || product.colors?.[0] || "",
      quantity: 1,
      accent: product.accent,
      image: lookImage(product),
    });
    pushToast(`${name} added to bag`);
    onClose();
    openCart();
  };

  return (
    <div
      role="dialog"
      aria-label={name}
      className="fr-look-in fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 flex flex-col gap-3.5 border-t border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[var(--background)] px-5 pb-5 pt-4 lg:absolute lg:inset-auto lg:bottom-4 lg:right-4 lg:top-4 lg:w-[19rem] lg:overflow-y-auto lg:border-0 lg:p-[1.125rem]"
    >
      <div className="flex items-baseline justify-between">
        <span className="fr-mono fr-muted">
          In this look · {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className="fr-mono fr-choice min-h-11 min-w-11 text-right">
          Close
        </button>
      </div>
      <div className="flex gap-3.5 lg:flex-col">
        <span className="relative block h-[6.75rem] w-[5.25rem] shrink-0 overflow-hidden bg-[var(--fr-stone)] lg:h-[12rem] lg:w-full">
          {lookImage(product) ? (
            <Image src={lookImage(product)} alt={name} fill sizes="(min-width: 1024px) 280px, 84px" className="object-cover object-[50%_30%]" />
          ) : null}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="fr-word text-[1.6rem] tracking-[-0.04em]">
              {name}
              <span className="fr-mark">.</span>
            </span>
            <span className="fr-mono hidden lg:inline">{formatPrice(product.price)}</span>
          </div>
          <span className="fr-mono fr-muted">
            <span className="lg:hidden">{formatPrice(product.price)} · </span>
            {details.join(" · ")}
          </span>
        </div>
      </div>
      {sizes.length > 0 ? (
        <div className="flex gap-2" role="group" aria-label="Size">
          {sizes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              aria-pressed={size === option}
              className={`fr-word min-h-12 flex-1 border border-[color-mix(in_srgb,var(--foreground)_20%,transparent)] text-[1.25rem] lg:min-h-11 lg:flex-none lg:min-w-[3.25rem] ${
                size === option ? "bg-[var(--foreground)] text-[var(--background)]" : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={add} disabled={sizes.length > 0 && !size} className="fr-button lg:mt-auto">
        {sizes.length > 0 && !size ? "Select a size" : "Add to bag"}
      </button>
      <Link href={`/product/${product.slug || product.id}`} className="fr-mono fr-link self-center">
        Details, fabric &amp; size guide
      </Link>
    </div>
  );
}
