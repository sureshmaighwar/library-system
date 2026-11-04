import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { Role } from "@/types";

/** Session user, or null when nobody is signed in. */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

/**
 * Server-side role gate. Signed-out visitors go to login.
 * A signed-in user with the wrong role goes to that role's home.
 */
export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== role) {
    redirect(user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/catalogue");
  }
  return user;
}
