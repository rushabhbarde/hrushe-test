import { NextResponse, type NextRequest } from "next/server";
import { GATEWAY_SIDE_COOKIE, getGatewayRedirectPath } from "@/lib/gateway";

export function proxy(request: NextRequest) {
  const redirectPath = getGatewayRedirectPath({
    sideCookie: request.cookies.get(GATEWAY_SIDE_COOKIE)?.value,
    referer: request.headers.get("referer"),
    host: request.nextUrl.host,
    wantsGateway: request.nextUrl.searchParams.has("choose"),
    isRscRequest: request.headers.has("rsc") || request.headers.has("next-router-prefetch"),
  });

  if (!redirectPath) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}

export const config = {
  matcher: "/",
};
