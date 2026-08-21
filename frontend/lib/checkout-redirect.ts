export function resolveCheckoutSuccessPath(
  redirectUrl: string | undefined,
  origin: string,
  fallbackOrderId?: string
) {
  const fallbackPath = fallbackOrderId
    ? `/checkout/success?orderId=${encodeURIComponent(fallbackOrderId)}`
    : "/checkout/success";

  try {
    const parsed = new URL(redirectUrl || fallbackPath, origin);

    if (parsed.pathname !== "/checkout/success") {
      return fallbackPath;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}
