import { describe, expect, it } from "vitest";
import { parseObjectPosition, placeOnCoverFrame } from "@/lib/shop-the-look";

describe("parseObjectPosition", () => {
  it("reads percentages and keywords", () => {
    expect(parseObjectPosition("62% 40%")).toEqual({ x: 0.62, y: 0.4 });
    expect(parseObjectPosition("center")).toEqual({ x: 0.5, y: 0.5 });
    expect(parseObjectPosition("top")).toEqual({ x: 0.5, y: 0 });
    expect(parseObjectPosition("top right")).toEqual({ x: 1, y: 0 });
    expect(parseObjectPosition("")).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe("placeOnCoverFrame", () => {
  it("keeps the point where it is when the frame has the photo's shape", () => {
    expect(placeOnCoverFrame({ x: 0.25, y: 0.5 }, { width: 400, height: 200 }, { width: 2000, height: 1000 })).toEqual({
      left: 25,
      top: 50,
    });
  });

  it("follows the crop when a wide photo fills a tall frame", () => {
    // 2:1 photo in a 1:1 frame, centred: the middle half of the width is shown.
    const placed = placeOnCoverFrame({ x: 0.5, y: 0.5 }, { width: 400, height: 400 }, { width: 800, height: 400 });
    expect(placed).toEqual({ left: 50, top: 50 });
    const nearEdge = placeOnCoverFrame({ x: 0.3, y: 0.5 }, { width: 400, height: 400 }, { width: 800, height: 400 });
    expect(nearEdge?.left).toBeCloseTo(10);
  });

  it("hides a point the crop cuts off", () => {
    expect(placeOnCoverFrame({ x: 0.1, y: 0.5 }, { width: 400, height: 400 }, { width: 800, height: 400 })).toBeNull();
  });

  it("respects object-position", () => {
    // Crop anchored left: the left half of the photo is shown.
    const placed = placeOnCoverFrame({ x: 0.25, y: 0.5 }, { width: 400, height: 400 }, { width: 800, height: 400 }, "left center");
    expect(placed).toEqual({ left: 50, top: 50 });
  });
});
