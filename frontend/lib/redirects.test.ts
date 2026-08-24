import { describe, expect, it } from "vitest";
import {
  sanitizeAdminRedirect,
  sanitizeCustomerRedirect,
  sanitizeSameOriginRedirect,
} from "@/lib/redirects";

describe("redirect sanitization", () => {
  it("keeps safe same-origin customer paths", () => {
    expect(sanitizeCustomerRedirect("/shop?sort=new#top")).toBe("/shop?sort=new#top");
    expect(sanitizeCustomerRedirect("/my-orders")).toBe("/my-orders");
  });

  it("rejects absolute, protocol, encoded, backslash, and control-character bypasses", () => {
    const fallback = "/shop";

    expect(sanitizeSameOriginRedirect("//evil.example", fallback)).toBe(fallback);
    expect(sanitizeSameOriginRedirect("https://evil.example", fallback)).toBe(fallback);
    expect(sanitizeSameOriginRedirect("javascript:alert(1)", fallback)).toBe(fallback);
    expect(sanitizeSameOriginRedirect("%2F%2Fevil.example", fallback)).toBe(fallback);
    expect(sanitizeSameOriginRedirect("/%5Cevil", fallback)).toBe(fallback);
    expect(sanitizeSameOriginRedirect("/shop%0d%0aLocation:%20//evil.example", fallback)).toBe(fallback);
  });

  it("restricts admin redirects to admin routes", () => {
    expect(sanitizeAdminRedirect("/admin/orders/123")).toBe("/admin/orders/123");
    expect(sanitizeAdminRedirect("/admin?section=orders")).toBe("/admin?section=orders");
    expect(sanitizeAdminRedirect("/shop")).toBe("/admin");
    expect(sanitizeAdminRedirect("//evil.example/admin")).toBe("/admin");
  });
});
