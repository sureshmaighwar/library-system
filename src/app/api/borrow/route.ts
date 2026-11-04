import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { borrowItem, LoanError } from "@/lib/loans";
import { borrowSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to borrow an item.");
    }

    if (session.user.role !== "MEMBER") {
      return apiError(403, "Only members can borrow items.");
    }

    const parsed = borrowSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Choose an item to borrow.");
    }

    const loan = await borrowItem(session.user.id, parsed.data.itemId);
    return NextResponse.json({ loan }, { status: 201 });
  } catch (error) {
    if (error instanceof LoanError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not borrow this item.");
  }
}
