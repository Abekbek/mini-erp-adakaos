import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login"];

const roleRouteMap: Record<string, string[]> = {
  "/owner": ["OWNER"],
  "/pos": ["OWNER", "BRANCH_ADMIN"],
  "/production": ["OWNER", "BRANCH_ADMIN", "PRODUCTION_OPERATOR"],
  "/inventory": ["OWNER", "BRANCH_ADMIN"],
  "/orders": ["OWNER", "BRANCH_ADMIN", "PRODUCTION_OPERATOR"],
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/pos", nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect root to appropriate page
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/pos", nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Protect all other routes - must be logged in
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Role-based access control
  for (const [routePrefix, allowedRoles] of Object.entries(roleRouteMap)) {
    if (pathname.startsWith(routePrefix)) {
      if (userRole && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/pos", nextUrl));
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
