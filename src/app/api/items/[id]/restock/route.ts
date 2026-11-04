import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { adjustStock, ItemError } from "@/lib/items";
import { restockSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to restock an item.");
    }
    if (session.user.role !== "LIBRARIAN") {
      return apiError(403, "Only librarians can restock items.");
    }

    const parsed = restockSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Check the restock details and try again.");
    }

    const { id } = await context.params;
    const item = await adjustStock(id, session.user.id, "ADDED_COPIES", parsed.data.quantity, parsed.data.reason);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ItemError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not restock that item.");
  }
}
