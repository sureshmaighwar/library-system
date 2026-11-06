import { NextResponse } from "next/server";

import { isLibrarianApi, isProtectedApi } from "@/lib/access";
import { auth } from "@/lib/auth";

const MEMBER_PAGES = ["/catalogue", "/my-loans"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const method = req.method;
  const isLoggedIn = Boolean(req.auth?.user?.id);
  const role = req.auth?.user?.role;
  const isLibrarianPage = pathname.startsWith("/librarian");
  const isMemberPage = MEMBER_PAGES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const protectedApi = isProtectedApi(pathname, method);

  if (isAuthPage && isLoggedIn) {
    const destination = role === "LIBRARIAN" ? "/librarian/dashboard" : "/catalogue";
    return NextResponse.redirect(new URL(destination, req.nextUrl));
  }

  if (!isLoggedIn && (isLibrarianPage || isMemberPage)) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (!isLoggedIn && protectedApi) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  if (isLibrarianPage && isLoggedIn && role !== "LIBRARIAN") {
    return NextResponse.redirect(new URL("/catalogue", req.nextUrl));
  }

  if (isLibrarianApi(pathname, method) && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Librarian access is required." }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/borrow",
    "/api/return",
    "/api/renew",
    "/api/reserve",
    "/api/loans/my",
    "/api/loans/all",
    "/api/loans/overdue",
    "/api/fines/:path*",
    "/api/dashboard",
    "/api/items",
    "/api/items/:path*",
  ],
};
