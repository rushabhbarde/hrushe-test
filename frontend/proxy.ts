import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const apexHost = "hrushe.in";
const wwwHost = "www.hrushe.in";

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (hostname === wwwHost) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.hostname = apexHost;
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
