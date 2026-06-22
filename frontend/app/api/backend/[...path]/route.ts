import type { NextRequest } from "next/server";

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
    setCookies.forEach((cookie) => headers.append("set-cookie", cookie));
  } else {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      headers.append("set-cookie", setCookie);
    }
  }

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const method = request.method.toUpperCase();
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
      {
        message:
          "Backend API is unavailable. Start the backend server on http://localhost:5001 and try again.",
      },
      { status: 502 }
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
