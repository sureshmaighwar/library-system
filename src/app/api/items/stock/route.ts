import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { ItemError, adjustStock } from "@/lib/items";
import { stockSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to adjust stock.");
    }
    if (session.user.role !== "LIBRARIAN") {
      return apiError(403, "Only librarians can adjust stock.");
    }

    const parsed = stockSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Check the stock change and try again.");
    }

    const item = await adjustStock(
      parsed.data.itemId,
      session.user.id,
      parsed.data.action,
      parsed.data.quantity,
      parsed.data.reason,
    );
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ItemError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not adjust stock.");
  }
}
