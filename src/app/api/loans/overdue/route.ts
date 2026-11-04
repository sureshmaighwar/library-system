import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { listOverdueLoans } from "@/lib/librarian-loans";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to view overdue loans.");
    }
    if (session.user.role !== "LIBRARIAN") {
      return apiError(403, "Librarian access is required.");
    }

    const overdue = await listOverdueLoans();
    return NextResponse.json(overdue);
  } catch (error) {
    console.error(error);
    return apiError(500, "Could not load overdue loans.");
  }
}
