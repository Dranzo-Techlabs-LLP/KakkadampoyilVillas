import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe: verify JWT signature only. Full permission checks happen in
// route handlers / server components (which have DB access).
const SESSION_COOKIE = "kv_admin";

function secret() {
  const s = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(s);
}

async function valid(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authed = await valid(token);

  const isLogin = pathname === "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");
  const isLoginApi = pathname === "/api/admin/login";

  // Admin API (except login): block unauthenticated at the edge
  if (isAdminApi && !isLoginApi) {
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Admin pages
  if (pathname.startsWith("/admin")) {
    if (isLogin) {
      // Already logged in → bounce to dashboard
      if (authed) return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (!authed) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
