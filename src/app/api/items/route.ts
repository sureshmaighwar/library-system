import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, isUniqueViolation, readJson } from "@/lib/http";
import { createItem, listCatalogue } from "@/lib/items";
import { catalogueQuerySchema, itemSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError(401, "Sign in to view the catalogue.");
  }

  const url = new URL(request.url);
  const parsed = catalogueQuerySchema.safeParse({
    search: url.searchParams.get("search") ?? "",
    category: url.searchParams.get("category") ?? "",
    available: url.searchParams.get("available") ?? "",
    page: url.searchParams.get("page") ?? "1",
    limit: url.searchParams.get("limit") ?? "8",
  });
  if (!parsed.success) {
    return apiError(400, parsed.error.issues[0]?.message ?? "Those filters are not valid.");
  }

  const result = await listCatalogue(parsed.data);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to add an item.");
    }
    if (session.user.role !== "LIBRARIAN") {
      return apiError(403, "Only librarians can add items.");
    }

    const parsed = itemSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Check the item details and try again.");
    }

    const item = await createItem(parsed.data, session.user.id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return apiError(409, "An item with that ISBN already exists.");
    }
    console.error(error);
    return apiError(500, "Could not add that item.");
  }
}
