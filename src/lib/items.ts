import type { Prisma } from "@prisma/client";

type StockChange = "ADDED_COPIES" | "LOST" | "DAMAGED";

import type { CatalogueQuery, ItemInput } from "@/lib/validations";

const itemSelect = {
  id: true,
  title: true,
  author: true,
  isbn: true,
  category: true,
  description: true,
  coverImage: true,
  totalCopies: true,
  availableCopies: true,
  lowStockThreshold: true,
} satisfies Prisma.ItemSelect;

export class ItemError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ItemError";
    this.status = status;
  }
}

export async function listItems(query?: string) {
  const prisma = (await import("@/lib/prisma")).prisma;
  const q = query?.trim();

  return prisma.item.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
            { isbn: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { title: "asc" },
    select: itemSelect,
  });
}

export async function listCategories() {
  const prisma = (await import("@/lib/prisma")).prisma;
  const rows = await prisma.item.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

export async function listCatalogue(filters: CatalogueQuery) {
  const prisma = (await import("@/lib/prisma")).prisma;
  const where: Prisma.ItemWhereInput = {};
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { author: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.available) {
    where.availableCopies = { gt: 0 };
  }

  const [total, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: itemSelect,
    }),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
}

export async function getItem(id: string) {
  const prisma = (await import("@/lib/prisma")).prisma;
  return prisma.item.findUnique({ where: { id }, select: itemSelect });
}

export async function createItem(input: ItemInput, librarianId: string) {
  const prisma = (await import("@/lib/prisma")).prisma;
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.create({
      data: {
        title: input.title,
        author: input.author,
        isbn: input.isbn,
        category: input.category,
        description: input.description.length > 0 ? input.description : null,
        coverImage: input.coverImage.length > 0 ? input.coverImage : null,
        totalCopies: input.totalCopies,
        availableCopies: input.totalCopies,
      },
      select: itemSelect,
    });
    await tx.stockLog.create({
      data: {
        itemId: item.id,
        changedBy: librarianId,
        action: "ADDED_COPIES",
        quantity: input.totalCopies,
        reason: "Initial copies",
      },
    });
    return item;
  });
}

/**
 * Add copies, or record lost and damaged copies.
 * Available stock is never allowed to drop below zero.
 */
export async function adjustStock(
  itemId: string,
  librarianId: string,
  action: StockChange,
  quantity: number,
  reason?: string,
) {
  const prisma = (await import("@/lib/prisma")).prisma;

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new ItemError(404, "That item is not in the catalogue.");
    }

    if (action === "ADDED_COPIES") {
      const updated = await tx.item.update({
        where: { id: itemId },
        data: {
          totalCopies: { increment: quantity },
          availableCopies: { increment: quantity },
        },
        select: itemSelect,
      });
      await tx.stockLog.create({
        data: { itemId, changedBy: librarianId, action, quantity, reason },
      });
      return updated;
    }

    const onLoan = item.totalCopies - item.availableCopies;
    if (item.availableCopies < quantity || item.totalCopies - quantity < onLoan) {
      throw new ItemError(409, "That would take available copies below zero.");
    }

    const updated = await tx.item.updateMany({
      where: { id: itemId, availableCopies: { gte: quantity } },
      data: {
        totalCopies: { decrement: quantity },
        availableCopies: { decrement: quantity },
      },
    });
    if (updated.count === 0) {
      throw new ItemError(409, "That would take available copies below zero.");
    }

    await tx.stockLog.create({
      data: { itemId, changedBy: librarianId, action, quantity, reason },
    });

    const next = await tx.item.findUnique({ where: { id: itemId }, select: itemSelect });
    if (!next) {
      throw new ItemError(404, "That item is not in the catalogue.");
    }
    return next;
  });
}
