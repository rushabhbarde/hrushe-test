import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("production CSP headers", () => {
  it("allows the trusted payment and analytics script hosts used in production", async () => {
    const headers = await nextConfig.headers?.();
    const csp = headers
      ?.flatMap((route) => route.headers)
      .find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toContain("https://checkout.razorpay.com");
    expect(csp).toContain("https://cdn.razorpay.com");
    expect(csp).toContain("https://static.cloudflareinsights.com");
    expect(csp).toContain("https://cloudflareinsights.com");
  });
});
