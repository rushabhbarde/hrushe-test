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
  const headers = new Headers(response.headers);

  RESPONSE_HEADERS_TO_STRIP.forEach((header) => {
    headers.delete(header);
  });

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

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

