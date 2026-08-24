import { describe, expect, it } from "vitest";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/phone";

describe("phone utilities", () => {
  it("normalizes supported Indian phone formats", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianPhone("+91-98765-43210")).toBe("9876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("9876543210");
  });

  it("validates Indian mobile numbers", () => {
    expect(isValidIndianPhone("+91 98765 43210")).toBe(true);
    expect(isValidIndianPhone("5123456789")).toBe(false);
    expect(isValidIndianPhone("12345")).toBe(false);
  });
});
