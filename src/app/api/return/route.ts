import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { LoanError, returnLoan } from "@/lib/loans";
import { returnSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to return an item.");
    }

    const parsed = returnSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Choose a loan to return.");
    }

    const result = await returnLoan(
      session.user.id,
      parsed.data.loanId,
      session.user.role === "LIBRARIAN",
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof LoanError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not return this loan.");
  }
}
