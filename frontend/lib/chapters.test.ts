import { describe, expect, it } from "vitest";
import { splitChapterTitle } from "@/lib/chapters";

describe("splitChapterTitle", () => {
  it("balances the two halves", () => {
    expect(splitChapterTitle("ESCAPE THE NOISE")).toEqual(["ESCAPE", "THE NOISE."]);
    expect(splitChapterTitle("The everyday uniform")).toEqual(["The everyday", "uniform."]);
  });

  it("keeps a single word on top and strips trailing punctuation", () => {
    expect(splitChapterTitle("Linen.")).toEqual(["Linen", ""]);
    expect(splitChapterTitle("  ")).toEqual(["", ""]);
  });
});
