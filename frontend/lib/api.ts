import { getCustomerAuthHeaders } from "@/lib/customer-auth";

// Keep browser requests same-origin so custom domains do not depend on
// cross-origin CORS configuration for storefront data.
const API_PROXY_PREFIX = "/api/backend";
const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_PROXY_PREFIX}${normalizedPath}`;
}

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  const customerAuthHeaders = getCustomerAuthHeaders();
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  Object.entries(customerAuthHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  return headers;
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DEFAULT_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      credentials: "include",
      headers: buildHeaders(init),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Request timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function downloadApiFile(path: string, filename = "download") {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not download file");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const disposition = response.headers.get("content-disposition") || "";
  const matchedName = disposition.match(/filename="?([^"]+)"?/i)?.[1];

  anchor.href = objectUrl;
  anchor.download = matchedName || filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}
