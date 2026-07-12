const INDIAN_PHONE_PATTERN = /^[6-9]\d{9}$/;

function normalizeIndianPhone(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  let digits = raw.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

function isValidIndianPhone(value) {
  return INDIAN_PHONE_PATTERN.test(normalizeIndianPhone(value));
}

function maskPhone(value) {
  const normalized = normalizeIndianPhone(value);
  if (!normalized) {
    return "";
  }

  return `******${normalized.slice(-4)}`;
}

module.exports = {
  INDIAN_PHONE_PATTERN,
  isValidIndianPhone,
  maskPhone,
  normalizeIndianPhone,
};
