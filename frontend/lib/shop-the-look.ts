/**
 * Shop the look: where a dot placed on the full photo lands once the photo is cropped
 * by `object-fit: cover` into a frame of another shape.
 */

type Size = { width: number; height: number };

const keywordFractions: Record<string, number> = {
  left: 0,
  top: 0,
  center: 0.5,
  right: 1,
  bottom: 1,
};

/** CSS object-position ("62% 40%", "center", "left top") → fractions; anything else is centred. */
export function parseObjectPosition(value?: string): { x: number; y: number } {
  const parts = String(value || "center").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const toFraction = (part: string | undefined) => {
    if (!part) return 0.5;
    if (part in keywordFractions) return keywordFractions[part];
    const percent = /^(-?\d+(?:\.\d+)?)%$/.exec(part);
    return percent ? Math.min(1, Math.max(0, Number(percent[1]) / 100)) : 0.5;
  };

  if (parts.length === 1) {
    const only = parts[0];
    if (only === "top" || only === "bottom") return { x: 0.5, y: toFraction(only) };
    return { x: toFraction(only), y: 0.5 };
  }

  // Keywords may come in either order ("top left"); percentages are always x then y.
  if (parts[0] === "top" || parts[0] === "bottom" || parts[1] === "left" || parts[1] === "right") {
    return { x: toFraction(parts[1]), y: toFraction(parts[0]) };
  }
  return { x: toFraction(parts[0]), y: toFraction(parts[1]) };
}

/**
 * Position of a photo point (fractions of the full photo) inside a frame showing the photo
 * with object-fit: cover. Returns percentages of the frame, or null when the crop hides it.
 */
export function placeOnCoverFrame(
  point: { x: number; y: number },
  frame: Size,
  photo: Size,
  objectPosition?: string
): { left: number; top: number } | null {
  if (!frame.width || !frame.height || !photo.width || !photo.height) {
    return null;
  }

  const scale = Math.max(frame.width / photo.width, frame.height / photo.height);
  const shownWidth = photo.width * scale;
  const shownHeight = photo.height * scale;
  const position = parseObjectPosition(objectPosition);
  const offsetX = (frame.width - shownWidth) * position.x;
  const offsetY = (frame.height - shownHeight) * position.y;
  const left = offsetX + point.x * shownWidth;
  const top = offsetY + point.y * shownHeight;
  // Keep a little margin so a dot never sits half outside the frame.
  const margin = 10;

  if (left < margin || top < margin || left > frame.width - margin || top > frame.height - margin) {
    return null;
  }

  return { left: (left / frame.width) * 100, top: (top / frame.height) * 100 };
}
