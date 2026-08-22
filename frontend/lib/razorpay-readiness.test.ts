import { describe, expect, it } from "vitest";
import {
  RAZORPAY_LOADING_MESSAGE,
  getRazorpayLaunchBlocker,
} from "@/lib/razorpay-readiness";

describe("Razorpay launch readiness", () => {
  it("allows launch only after the script and constructor are ready", () => {
    expect(getRazorpayLaunchBlocker({ scriptReady: true, hasConstructor: true })).toBe("");
  });

  it("blocks launch while the provider script is loading", () => {
    expect(getRazorpayLaunchBlocker({ scriptReady: false, hasConstructor: false })).toBe(RAZORPAY_LOADING_MESSAGE);
  });

  it("surfaces script failure as a recoverable message", () => {
    expect(
      getRazorpayLaunchBlocker({
        scriptReady: false,
        hasConstructor: false,
        loadError: "Payment checkout could not load. Please refresh and try again.",
      })
    ).toBe("Payment checkout could not load. Please refresh and try again.");
  });
});
