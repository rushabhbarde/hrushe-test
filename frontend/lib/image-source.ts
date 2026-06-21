export function shouldBypassImageOptimization(src?: string) {
  return Boolean(src && /^(data:|blob:)/i.test(src));
}

export function isPersistedMediaSource(src?: string) {
  const value = String(src || "").trim();
  return Boolean(
    value &&
    ((value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value))
  );
}
