import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { deleteItem, ItemError, updateItem } from "@/lib/items";
import { itemSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

async function librarianId() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: apiError(401, "Sign in to manage items.") };
  }
  if (session.user.role !== "LIBRARIAN") {
    return { error: apiError(403, "Only librarians can manage items.") };
  }
  return { id: session.user.id };
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const actor = await librarianId();
    if ("error" in actor) {
      return actor.error;
    }

    const parsed = itemSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Check the item details and try again.");
    }

    const { id } = await context.params;
    const item = await updateItem(id, parsed.data, actor.id);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ItemError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not update that item.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const actor = await librarianId();
    if ("error" in actor) {
      return actor.error;
    }

    const { id } = await context.params;
    await deleteItem(id, actor.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ItemError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not delete that item.");
  }
}
