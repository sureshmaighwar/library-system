const MEMBER_APIS = ["/api/borrow", "/api/renew", "/api/reserve", "/api/loans/my"];

/** Librarian-only API. Members and signed-out callers are rejected. */
export function isLibrarianApi(pathname: string, method: string) {
  const itemRecord = /^\/api\/items\/[^/]+$/.test(pathname);
  const restock = /^\/api\/items\/[^/]+\/restock$/.test(pathname);
  return (
    pathname.startsWith("/api/return") ||
    pathname.startsWith("/api/fines") ||
    pathname.startsWith("/api/dashboard") ||
    pathname === "/api/loans/all" ||
    pathname === "/api/loans/overdue" ||
    pathname.startsWith("/api/items/stock") ||
    (pathname === "/api/items" && method === "POST") ||
    (itemRecord && (method === "PUT" || method === "DELETE")) ||
    (restock && method === "POST")
  );
}

/** Signed-in API. A missing session is rejected before the role check. */
export function isProtectedApi(pathname: string, method: string) {
  return (
    pathname.startsWith("/api/items") ||
    MEMBER_APIS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    isLibrarianApi(pathname, method)
  );
}

/**
 * Status to return for an API call.
 * `role` is null when nobody is signed in.
 */
export function apiDenial(pathname: string, method: string, role: string | null): 401 | 403 | null {
  if (role === null && isProtectedApi(pathname, method)) {
    return 401;
  }
  if (isLibrarianApi(pathname, method) && role !== "LIBRARIAN") {
    return 403;
  }
  return null;
}
