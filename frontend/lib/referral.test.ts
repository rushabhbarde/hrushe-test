import { describe, expect, it } from "vitest";
import { parseReferralCode } from "./referral";

describe("parseReferralCode", () => {
  it("accepts a friend code in any case", () => {
    expect(parseReferralCode(" hru-7k2pq ")).toBe("HRU-7K2PQ");
  });

  it("ignores anything that isn't a friend code", () => {
    expect(parseReferralCode("WELCOME10")).toBe("");
    expect(parseReferralCode("HRU-<script>")).toBe("");
    expect(parseReferralCode(null)).toBe("");
  });
});
