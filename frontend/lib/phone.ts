const INDIAN_PHONE_PATTERN = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(value: string) {
  let digits = String(value || "").trim().replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

export function isValidIndianPhone(value: string) {
  return INDIAN_PHONE_PATTERN.test(normalizeIndianPhone(value));
}
