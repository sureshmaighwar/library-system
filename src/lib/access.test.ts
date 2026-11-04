import { describe, expect, it } from "vitest";

import { apiDenial } from "@/lib/access";

describe("api access", () => {
  it("rejects a signed-out caller on librarian and member APIs", () => {
    expect(apiDenial("/api/dashboard", "GET", null)).toBe(401);
    expect(apiDenial("/api/loans/all", "GET", null)).toBe(401);
    expect(apiDenial("/api/loans/overdue", "GET", null)).toBe(401);
    expect(apiDenial("/api/items/item-1", "PUT", null)).toBe(401);
    expect(apiDenial("/api/borrow", "POST", null)).toBe(401);
  });

  it("rejects a member on librarian APIs", () => {
    expect(apiDenial("/api/dashboard", "GET", "MEMBER")).toBe(403);
    expect(apiDenial("/api/loans/all", "GET", "MEMBER")).toBe(403);
    expect(apiDenial("/api/loans/overdue", "GET", "MEMBER")).toBe(403);
    expect(apiDenial("/api/items/item-1", "PUT", "MEMBER")).toBe(403);
    expect(apiDenial("/api/return", "POST", "MEMBER")).toBe(403);
  });

  it("lets a member borrow and a librarian return", () => {
    expect(apiDenial("/api/borrow", "POST", "MEMBER")).toBeNull();
    expect(apiDenial("/api/return", "POST", "LIBRARIAN")).toBeNull();
    expect(apiDenial("/api/dashboard", "GET", "LIBRARIAN")).toBeNull();
  });
});
