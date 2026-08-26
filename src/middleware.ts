import { NextRequest, NextResponse } from "next/server";

// Minimal shared-password gate for the admin area, via HTTP Basic Auth.
// Any username is accepted; the password must equal ADMIN_PASSWORD.
export function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD || "gws-admin";
  const auth = req.headers.get("authorization");

  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      const pass = idx >= 0 ? decoded.slice(idx + 1) : decoded;
      if (pass === expected) {
        return NextResponse.next();
      }
    } catch {
      // fall through to challenge
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GWS Admin", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
