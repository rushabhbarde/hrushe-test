const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isValidIndianPhone,
  maskPhone,
  normalizeIndianPhone,
} = require("../src/utils/phone");

test("phone normalization canonicalizes Indian mobile formats", () => {
  assert.equal(normalizeIndianPhone("+91 98765 43210"), "9876543210");
  assert.equal(normalizeIndianPhone("09876543210"), "9876543210");
  assert.equal(normalizeIndianPhone("98765-43210"), "9876543210");
});

test("phone validation rejects missing, short, and non-mobile numbers", () => {
  assert.equal(isValidIndianPhone(""), false);
  assert.equal(isValidIndianPhone("12345"), false);
  assert.equal(isValidIndianPhone("+91 51234 56789"), false);
  assert.equal(isValidIndianPhone("+91 98765 43210"), true);
});

test("phone masking avoids printing full customer numbers", () => {
  assert.equal(maskPhone("+91 98765 43210"), "******3210");
});
