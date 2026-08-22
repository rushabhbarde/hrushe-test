import { describe, expect, it } from "vitest";
import {
  getCheckoutValidationMessage,
  validateCheckoutContact,
  validateCheckoutShipping,
} from "@/lib/checkout-validation";

const validForm = {
  fullName: "Aarav Mehta",
  email: "aarav@example.com",
  phone: "+91 98765 43210",
  house: "12 Studio House",
  area: "Bandra West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400050",
};

describe("checkout validation", () => {
  it("validates contact details", () => {
    expect(validateCheckoutContact(validForm)).toBe(true);
    expect(validateCheckoutContact({ ...validForm, email: "bad" })).toBe(false);
  });

  it("validates delivery details", () => {
    expect(validateCheckoutShipping(validForm)).toBe(true);
    expect(validateCheckoutShipping({ ...validForm, pincode: "123" })).toBe(false);
  });

  it("returns stable validation messages", () => {
    expect(getCheckoutValidationMessage({ ...validForm, phone: "1" }, true)).toBe("Please add your contact information.");
    expect(getCheckoutValidationMessage({ ...validForm, house: "" }, true)).toBe("Please complete all shipping details.");
    expect(getCheckoutValidationMessage(validForm, false)).toBe("Please accept the terms before payment.");
    expect(getCheckoutValidationMessage(validForm, true)).toBe("");
  });
});
