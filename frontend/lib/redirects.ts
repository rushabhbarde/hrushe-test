const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

function decodeRedirectCandidate(value: string) {
  let decoded = value;

  for (let index = 0; index < 3; index += 1) {
    try {
      const nextDecoded = decodeURIComponent(decoded);
      if (nextDecoded === decoded) {
        break;
      }
      decoded = nextDecoded;
    } catch {
      return "";
    }
  }

  return decoded;
}

export function sanitizeSameOriginRedirect(
  value: string | null | undefined,
  fallback = "/"
) {
  const safeFallback = fallback.startsWith("/") && !fallback.startsWith("//")
    ? fallback
    : "/";
  const rawValue = String(value || "").trim();

  if (!rawValue || CONTROL_CHARACTER_PATTERN.test(rawValue) || rawValue.includes("\\")) {
    return safeFallback;
  }

  const decodedValue = decodeRedirectCandidate(rawValue).trim();

  if (
    !decodedValue ||
    CONTROL_CHARACTER_PATTERN.test(decodedValue) ||
    decodedValue.includes("\\") ||
    decodedValue.startsWith("//") ||
    !decodedValue.startsWith("/") ||
    PROTOCOL_PATTERN.test(decodedValue)
  ) {
    return safeFallback;
  }

  const pathWithoutLeadingSlash = decodedValue.slice(1).trimStart();
  if (PROTOCOL_PATTERN.test(pathWithoutLeadingSlash)) {
    return safeFallback;
  }

  return decodedValue;
}

export function sanitizeCustomerRedirect(
  value: string | null | undefined,
  fallback = "/my-orders"
) {
  return sanitizeSameOriginRedirect(value, fallback);
}

export function sanitizeAdminRedirect(
  value: string | null | undefined,
  fallback = "/admin"
) {
  const sanitized = sanitizeSameOriginRedirect(value, fallback);

  if (
    sanitized === "/admin" ||
    sanitized.startsWith("/admin/") ||
    sanitized.startsWith("/admin?") ||
    sanitized.startsWith("/admin#")
  ) {
    return sanitized;
  }

  return fallback;
}
