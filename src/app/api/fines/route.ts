import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { LoanError, markFinePaid } from "@/lib/loans";
import { payFineSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to record a payment.");
    }
    if (session.user.role !== "LIBRARIAN") {
      return apiError(403, "Only librarians can mark a fine paid.");
    }

    const parsed = payFineSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Choose a fine to mark paid.");
    }

    const loan = await markFinePaid(parsed.data.loanId);
    return NextResponse.json({ loan });
  } catch (error) {
    if (error instanceof LoanError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not mark that fine paid.");
  }
}
