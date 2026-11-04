import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getLibrarianDashboard } from "@/lib/dashboard";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to open the dashboard.");
    }
    if (session.user.role !== "LIBRARIAN") {
      return apiError(403, "Librarian access is required.");
    }

    const dashboard = await getLibrarianDashboard();
    return NextResponse.json(dashboard);
  } catch (error) {
    console.error(error);
    return apiError(500, "Could not load the dashboard.");
  }
}
