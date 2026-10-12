import type { NextRequest } from "next/server";
import { buildBackendUnavailableResponseBody } from "@/lib/backend-proxy-error";

export const dynamic = "force-dynamic";

const BACKEND_API_URL = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

const REQUEST_HEADERS_TO_STRIP = new Set([
  "connection",
  "content-length",
  "host",
]);

const RESPONSE_HEADERS_TO_STRIP = new Set([
  "connection",
  "content-length",
  "content-encoding",
  "transfer-encoding",
]);

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function buildBackendUrl(request: NextRequest, segments: string[]) {
  const pathname = segments.join("/");
  const search = request.nextUrl.search;
  return `${BACKEND_API_URL}/${pathname}${search}`;
}

function forwardRequestHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  REQUEST_HEADERS_TO_STRIP.forEach((header) => {
    headers.delete(header);
  });

  return headers;
}

function normalizeSameOriginCookie(cookie: string) {
  const parts = cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const cookieValue = parts.shift();

  if (!cookieValue) {
    return "";
  }

  // Browser requests reach the backend through this same-origin proxy. Remove
  // any Render/backend Domain attribute so Safari stores the cookie against
  // the visible HRUSHE host, and normalize the first-party SameSite policy.
  const attributes = parts.filter(
    (part) => !/^domain=/i.test(part) && !/^samesite=/i.test(part)
  );

  return [cookieValue, ...attributes, "SameSite=Lax"].join("; ");
}

function forwardResponseHeaders(response: Response) {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey === "set-cookie" ||
      RESPONSE_HEADERS_TO_STRIP.has(normalizedKey)
    ) {
      return;
    }

    headers.append(key, value);
  });

  // Set-Cookie cannot be comma-joined. Safari is stricter than Chromium when
  // multiple auth cookies are collapsed by a generic Headers clone, so retain
  // the token and CSRF cookies as separate upstream header values.
  const upstreamHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies = upstreamHeaders.getSetCookie?.() || [];

  if (setCookies.length > 0) {
    setCookies.forEach((cookie) => {
      const normalizedCookie = normalizeSameOriginCookie(cookie);
      if (normalizedCookie) {
        headers.append("set-cookie", normalizedCookie);
      }
    });
  } else {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      headers.append("set-cookie", normalizeSameOriginCookie(setCookie));
    }
  }

  if ((response.headers.get("content-type") || "").includes("application/json")) {
    headers.set("cache-control", "private, no-store, max-age=0, must-revalidate");
  }

  return headers;
}

const PUBLIC_CATALOG_REVALIDATE_SECONDS = 30;

/**
 * The public product list and product details are the same for every shopper, so they can
 * be reused for a few seconds instead of crossing to the backend on every visit. Atelier
 * asks with `?admin=true` (drafts, live stock) and is never served from this cache.
 */
function isPublicCatalogRead(request: NextRequest, segments: string[]) {
  return (
    request.method.toUpperCase() === "GET" &&
    segments[0] === "products" &&
    segments.length <= 2 &&
    !request.nextUrl.searchParams.has("admin")
  );
}

async function proxyPublicCatalogRead(request: NextRequest, segments: string[]) {
  // No cookies or credentials are forwarded: the cached answer is the anonymous one.
  const response = await fetch(buildBackendUrl(request, segments), {
    headers: { accept: "application/json" },
    next: { revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status >= 500) {
    throw new Error("Backend error on a public catalog read");
  }
  const headers = new Headers({
    "content-type": response.headers.get("content-type") || "application/json",
    "cache-control": "private, no-store, max-age=0, must-revalidate",
  });
  ["x-pagination-page", "x-pagination-limit", "x-pagination-total-items", "x-pagination-total-pages"].forEach((name) => {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  });

  return new Response(response.body, { status: response.status, headers });
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const method = request.method.toUpperCase();

  if (isPublicCatalogRead(request, path)) {
    try {
      return await proxyPublicCatalogRead(request, path);
    } catch {
      // Fall through to the uncached path below.
    }
  }
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  try {
    const response = await fetch(buildBackendUrl(request, path), {
      method,
      headers: forwardRequestHeaders(request),
      body,
      cache: "no-store",
      redirect: "manual",
    });

    return new Response(response.body, {
      status: response.status,
      headers: forwardResponseHeaders(response),
    });
  } catch {
    return Response.json(
      buildBackendUnavailableResponseBody(),
      { status: process.env.NODE_ENV === "development" ? 502 : 503 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
