"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";

function bookCallback(value: string | undefined) {
  if (!value || !value.startsWith("/items/")) {
    return null;
  }
  if (value.startsWith("//") || value.includes("\\") || value.includes("..") || value.includes("://")) {
    return null;
  }
  return value;
}

export async function loginAction(input: unknown, callbackUrl?: string): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    if (!result || result.error) {
      return { error: "Email or password is incorrect." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email or password is incorrect." };
    }
    throw error;
  }

  const session = await auth();
  if (session?.user.role === "LIBRARIAN") {
    redirect("/librarian/dashboard");
  }
  redirect(bookCallback(callbackUrl) ?? "/catalogue");
}

export async function registerAction(input: unknown, callbackUrl?: string): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { prisma } = await import("@/lib/prisma");
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "MEMBER",
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try logging in." };
    }
    throw error;
  }

  redirect(bookCallback(callbackUrl) ?? "/catalogue");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
