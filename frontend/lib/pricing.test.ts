import { describe, expect, it } from "vitest";
import {
  calculateCartSubtotalPaise,
  calculateCartTotalPaise,
  calculateDeliveryChargePaise,
  formatPaise,
} from "@/lib/pricing";

describe("pricing helpers", () => {
  it("formats integer-paise values for Indian rupees", () => {
    expect(formatPaise(199900)).toBe("₹1,999");
    expect(formatPaise(199950)).toBe("₹1,999.50");
  });

  it("calculates cart totals in integer paise", () => {
    expect(
      calculateCartSubtotalPaise([
        { pricePaise: 129900, quantity: 2 },
        { pricePaise: 50000, quantity: 1 },
      ])
    ).toBe(309800);
  });

  it("calculates delivery charges and cart totals", () => {
    expect(calculateDeliveryChargePaise(90000, { freeAbovePaise: 100000, chargePaise: 9900 })).toBe(9900);
    expect(calculateDeliveryChargePaise(100000, { freeAbovePaise: 100000, chargePaise: 9900 })).toBe(0);
    expect(
      calculateCartTotalPaise([{ pricePaise: 90000, quantity: 1 }], {
        freeAbovePaise: 100000,
        chargePaise: 9900,
      })
    ).toEqual({
      subtotalPaise: 90000,
      deliveryPaise: 9900,
      totalPaise: 99900,
    });
  });
});
