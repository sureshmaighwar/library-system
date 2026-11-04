import { describe, expect, it } from "vitest";

import { catalogueQuerySchema, itemSchema, loginSchema, registerSchema } from "@/lib/validations";

const catalogue = {
  search: "",
  category: "",
  available: "",
  page: "1",
  limit: "8",
};

describe("login and registration", () => {
  it("accepts a normal sign-in", () => {
    const parsed = loginSchema.safeParse({ email: "Member@Lib.com", password: "member123" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("member@lib.com");
    }
  });

  it("rejects a short registration password", () => {
    const parsed = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@lib.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a confirm-password mismatch", () => {
    const parsed = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@lib.com",
      password: "member123",
      confirmPassword: "member124",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message === "Passwords do not match")).toBe(true);
    }
  });
});

describe("query bounds", () => {
  it("rejects a page below 1 and a limit above 24", () => {
    expect(catalogueQuerySchema.safeParse({ ...catalogue, page: "0" }).success).toBe(false);
    expect(catalogueQuerySchema.safeParse({ ...catalogue, limit: "25" }).success).toBe(false);
  });

  it("rejects an item with no title or no copies", () => {
    expect(
      itemSchema.safeParse({
        title: "",
        author: "A",
        isbn: "123",
        category: "Fiction",
        description: "",
        coverImage: "",
        totalCopies: 1,
      }).success,
    ).toBe(false);
    expect(
      itemSchema.safeParse({
        title: "Book",
        author: "A",
        isbn: "123",
        category: "Fiction",
        description: "",
        coverImage: "",
        totalCopies: 0,
      }).success,
    ).toBe(false);
  });
});
