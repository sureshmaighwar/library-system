import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const MEMBER_PREFIXES = ["/catalogue", "/items", "/my-loans"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user?.id);
  const role = req.auth?.user?.role;
  const isLibrarianRoute = pathname.startsWith("/librarian");
  const isMemberRoute = MEMBER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage && isLoggedIn) {
    const destination = role === "LIBRARIAN" ? "/librarian/dashboard" : "/catalogue";
    return NextResponse.redirect(new URL(destination, req.nextUrl));
  }

  if ((isLibrarianRoute || isMemberRoute) && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isLibrarianRoute && role !== "LIBRARIAN") {
    return NextResponse.redirect(new URL("/catalogue", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
