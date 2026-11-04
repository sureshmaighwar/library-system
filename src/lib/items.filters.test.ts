import { describe, expect, it } from "vitest";

import { catalogueWhere, librarianItemsWhere, pageWindow } from "@/lib/items";

describe("catalogue filters", () => {
  it("searches title and author", () => {
    const where = catalogueWhere({
      search: "Hawking",
      category: "",
      available: false,
      page: 1,
      limit: 8,
    });
    expect(where.OR).toEqual([
      { title: { contains: "Hawking", mode: "insensitive" } },
      { author: { contains: "Hawking", mode: "insensitive" } },
    ]);
  });

  it("filters by category and available copies", () => {
    const where = catalogueWhere({
      search: "",
      category: "Science",
      available: true,
      page: 1,
      limit: 8,
    });
    expect(where.category).toBe("Science");
    expect(where.availableCopies).toEqual({ gt: 0 });
  });

  it("lets librarians search by ISBN", () => {
    const where = librarianItemsWhere({ search: "9780553380163", category: "Science" });
    expect(where.OR).toEqual([
      { title: { contains: "9780553380163", mode: "insensitive" } },
      { author: { contains: "9780553380163", mode: "insensitive" } },
      { isbn: { contains: "9780553380163", mode: "insensitive" } },
    ]);
    expect(where.category).toBe("Science");
  });

  it("pages eight titles at a time", () => {
    expect(pageWindow(1, 8)).toEqual({ skip: 0, take: 8 });
    expect(pageWindow(2, 8)).toEqual({ skip: 8, take: 8 });
  });
});
