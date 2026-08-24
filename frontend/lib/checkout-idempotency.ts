function randomHex(bytes: number) {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    return Array.from({ length: bytes }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
    ).join("");
  }

  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createCheckoutIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `checkout-${Date.now().toString(36)}-${randomHex(16)}`;
}

export function buildCheckoutAttemptSnapshot(value: unknown) {
  return JSON.stringify(value);
}
