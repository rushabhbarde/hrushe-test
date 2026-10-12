"use client";

import { useRef, useState, type PointerEvent } from "react";
import { AdminField, AdminFilterSelect } from "@/components/admin-ui";
import type { HomepageLookTag, HomepageSection, MediaAsset } from "@/lib/admin-workspace";
import type { Product } from "@/lib/catalog";
import { resolveHomepageMediaSource } from "@/lib/homepage-media";
import { getProductDisplayName } from "@/lib/product-presentation";

const MAX_DOTS = 8;

function createDotId() {
  return `look-${Math.random().toString(36).slice(2, 10)}`;
}

const clamp = (value: number) => Math.min(1, Math.max(0, Math.round(value * 1000) / 1000));

/**
 * Atelier: place "Shop the look" dots on a campaign photo. Click the photo to drop a dot,
 * drag to move it, pick the piece it points at. A separate phone photo gets its own positions.
 */
export function AdminLookEditor({
  section,
  products,
  mediaLibrary,
  onChange,
}: {
  section: HomepageSection;
  products: Product[];
  mediaLibrary: readonly MediaAsset[];
  onChange: (lookTags: HomepageLookTag[]) => void;
}) {
  const tags = section.lookTags || [];
  const sources = resolveHomepageMediaSource({ src: section.image, mobileSrc: section.mobileImage, mediaLibrary });
  const hasPhonePhoto = Boolean(sources && sources.mobileSrc !== sources.desktopSrc);
  const [photo, setPhoto] = useState<"desktop" | "phone">("desktop");
  const [selectedId, setSelectedId] = useState("");
  const photoRef = useRef<HTMLDivElement>(null);
  const dragging = useRef("");
  const onPhone = hasPhonePhoto && photo === "phone";
  const src = onPhone ? sources?.mobileSrc : sources?.desktopSrc;
  const selected = tags.find((tag) => tag.id === selectedId) || null;

  const pointAt = (event: PointerEvent) => {
    const box = photoRef.current?.getBoundingClientRect();
    if (!box) return null;
    return { x: clamp((event.clientX - box.left) / box.width), y: clamp((event.clientY - box.top) / box.height) };
  };

  const moveTag = (id: string, point: { x: number; y: number }) =>
    onChange(
      tags.map((tag) =>
        tag.id !== id ? tag : onPhone ? { ...tag, mobileX: point.x, mobileY: point.y } : { ...tag, x: point.x, y: point.y }
      )
    );

  const placeOnPhoto = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) return;
    const point = pointAt(event);
    if (!point) return;

    if (onPhone) {
      // The phone photo only repositions dots that already exist.
      const target = selected || tags.find((tag) => tag.mobileX == null);
      if (target) {
        moveTag(target.id, point);
        setSelectedId(target.id);
      }
      return;
    }

    if (tags.length >= MAX_DOTS) return;
    const tag: HomepageLookTag = { id: createDotId(), productId: "", x: point.x, y: point.y };
    onChange([...tags, tag]);
    setSelectedId(tag.id);
  };

  const position = (tag: HomepageLookTag) =>
    onPhone ? (tag.mobileX == null || tag.mobileY == null ? null : { x: tag.mobileX, y: tag.mobileY }) : { x: tag.x, y: tag.y };

  if (!src) {
    return <p className="text-sm text-[var(--muted)]">Upload the campaign photo first, then place dots on it.</p>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          {hasPhonePhoto ? (
            <div className="flex gap-5" role="group" aria-label="Which photo">
              {(["desktop", "phone"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPhoto(option)}
                  aria-pressed={photo === option}
                  className={`fr-mono fr-choice is-underlined min-h-11 ${photo === option ? "is-active" : ""}`}
                >
                  {option === "desktop" ? "Computer photo" : "Phone photo"}
                </button>
              ))}
            </div>
          ) : (
            <span className="fr-mono fr-muted">One photo for computer and phone</span>
          )}
          <span className="fr-mono fr-muted">
            {onPhone ? "Click to place the chosen dot · drag to move" : "Click the photo to drop a dot · drag to move"}
          </span>
        </div>
        <div
          ref={photoRef}
          className="relative cursor-crosshair touch-none select-none bg-[var(--fr-stone)]"
          onPointerUp={placeOnPhoto}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the editor needs the uncropped photo at its own shape */}
          <img src={src} alt="Campaign photo" draggable={false} className="block h-auto w-full" />
          {tags.map((tag, index) => {
            const point = position(tag);
            if (!point) return null;
            const product = products.find((item) => item.id === tag.productId);
            const active = tag.id === selectedId;
            return (
              <button
                key={tag.id}
                type="button"
                aria-label={`Dot ${index + 1}${product ? `: ${getProductDisplayName(product)}` : ""}`}
                className="absolute flex -translate-y-1/2 items-center gap-2"
                style={{ left: `calc(${point.x * 100}% - 7px)`, top: `${point.y * 100}%` }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragging.current = tag.id;
                  setSelectedId(tag.id);
                }}
                onPointerMove={(event) => {
                  if (dragging.current !== tag.id) return;
                  const next = pointAt(event);
                  if (next) moveTag(tag.id, next);
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  window.setTimeout(() => (dragging.current = ""), 0);
                }}
              >
                <span
                  className={`h-3.5 w-3.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.35)] ${active ? "bg-[#111111]" : "bg-white"}`}
                />
                <span className={`fr-mono px-2 py-1.5 ${active ? "bg-[#111111] text-white" : "bg-white text-[#111111]"}`}>
                  {String(index + 1).padStart(2, "0")} · {product ? getProductDisplayName(product) : "Choose a piece"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col">
        <span className="fr-mono fr-muted mb-2">
          Dots on this photo · {tags.length}/{MAX_DOTS}
        </span>
        {tags.length === 0 ? (
          <p className="py-4 text-sm leading-6 text-[var(--muted)]">
            No dots yet. Click a garment on the photo to point at the piece someone is wearing.
          </p>
        ) : null}
        {tags.map((tag, index) => (
          <div
            key={tag.id}
            className={`flex flex-col gap-3 border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] py-4 ${
              tag.id === selectedId ? "" : "opacity-80"
            }`}
            onFocusCapture={() => setSelectedId(tag.id)}
          >
            <AdminField label={`${String(index + 1).padStart(2, "0")} · Which piece is this?`}>
              <AdminFilterSelect
                value={tag.productId}
                onChange={(event) =>
                  onChange(tags.map((item) => (item.id === tag.id ? { ...item, productId: event.target.value } : item)))
                }
              >
                <option value="">Choose from your pieces…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {getProductDisplayName(product)} · ₹{product.price}
                  </option>
                ))}
              </AdminFilterSelect>
            </AdminField>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs leading-5 text-[var(--muted)]">
                {!tag.productId
                  ? "Hidden until you choose a piece."
                  : hasPhonePhoto && tag.mobileX == null
                    ? "Not placed on the phone photo yet, so phones won't show it."
                    : "Price and stock come from the piece; sold out hides the dot."}
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange(tags.filter((item) => item.id !== tag.id));
                  setSelectedId("");
                }}
                className="fr-mono fr-choice min-h-11 shrink-0"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
