import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, isUniqueViolation, readJson } from "@/lib/http";
import { LoanError, reserveItem } from "@/lib/loans";
import { reserveSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to reserve an item.");
    }

    const parsed = reserveSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Choose an item to reserve.");
    }

    const reservation = await reserveItem(session.user.id, parsed.data.itemId);
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof LoanError) {
      return apiError(error.status, error.message);
    }
    if (isUniqueViolation(error)) {
      return apiError(409, "You are already in the queue for this item.");
    }
    console.error(error);
    return apiError(500, "Could not reserve this item.");
  }
}
