import { describe, expect, it } from "vitest";
import { normalizeApiError } from "@/lib/api";

describe("API error normalization", () => {
  it("prefers Error messages", () => {
    expect(normalizeApiError(new Error("Payment failed"))).toBe("Payment failed");
  });

  it("normalizes backend message payloads", () => {
    expect(normalizeApiError({ message: "Cart expired" })).toBe("Cart expired");
    expect(normalizeApiError({ error: "Not authorized" })).toBe("Not authorized");
  });

  it("falls back when the error shape is unknown", () => {
    expect(normalizeApiError({ detail: "ignored" }, "Try again")).toBe("Try again");
  });
});
