import type { Prisma, PrismaClient } from "@prisma/client";

type StockChange = "ADDED_COPIES" | "LOST" | "DAMAGED";

import { OPEN_LOAN_STATUSES } from "@/lib/loans";
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

/** Search, category, and availability filter for the member catalogue. */
export function catalogueWhere(filters: CatalogueQuery): Prisma.ItemWhereInput {
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
  return where;
}

/** Librarian search also matches ISBN. */
export function librarianItemsWhere(
  filters: Pick<CatalogueQuery, "search" | "category">,
): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = {};
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { author: { contains: filters.search, mode: "insensitive" } },
      { isbn: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.category) {
    where.category = filters.category;
  }
  return where;
}

/** Page window used by both catalogues. Page 1 starts at the first row. */
export function pageWindow(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export async function listCatalogue(filters: CatalogueQuery) {
  const prisma = (await import("@/lib/prisma")).prisma;
  const where = catalogueWhere(filters);
  const window = pageWindow(filters.page, filters.limit);

  const [total, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy: { title: "asc" },
      skip: window.skip,
      take: window.take,
      select: itemSelect,
    }),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
}

export async function listLibrarianItems(filters: Pick<CatalogueQuery, "search" | "category" | "page" | "limit">) {
  const prisma = (await import("@/lib/prisma")).prisma;
  const where = librarianItemsWhere(filters);
  const window = pageWindow(filters.page, filters.limit);

  const [total, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy: { title: "asc" },
      skip: window.skip,
      take: window.take,
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
  db?: PrismaClient,
) {
  const prisma = db ?? (await import("@/lib/prisma")).prisma;

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

/**
 * Update a catalogue title. Copy changes move available stock by the same
 * amount and cannot drop below the copies that are still on loan.
 */
export async function updateItem(itemId: string, input: ItemInput, librarianId: string, db?: PrismaClient) {
  const prisma = db ?? (await import("@/lib/prisma")).prisma;

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.item.findUnique({ where: { id: itemId } });
      if (!existing) {
        throw new ItemError(404, "That item is not in the catalogue.");
      }

      const onLoan = existing.totalCopies - existing.availableCopies;
      if (input.totalCopies < onLoan) {
        throw new ItemError(409, "That would take available copies below the copies on loan.");
      }

      const delta = input.totalCopies - existing.totalCopies;
      const updated = await tx.item.update({
        where: { id: itemId },
        data: {
          title: input.title,
          author: input.author,
          isbn: input.isbn,
          category: input.category,
          description: input.description.length > 0 ? input.description : null,
          coverImage: input.coverImage.length > 0 ? input.coverImage : null,
          totalCopies: input.totalCopies,
          availableCopies: existing.availableCopies + delta,
        },
        select: itemSelect,
      });

      await tx.stockLog.create({
        data: {
          itemId,
          changedBy: librarianId,
          action: delta > 0 ? "ADDED_COPIES" : "UPDATED",
          quantity: delta > 0 ? delta : Math.abs(delta),
          reason: delta > 0 ? "Copies updated" : delta < 0 ? "Copy count reduced" : "Item details updated",
        },
      });

      return updated;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ItemError(409, "An item with that ISBN already exists.");
    }
    throw error;
  }
}

/**
 * Remove a title that has no open loan. The delete log keeps the title and
 * ISBN after the item row is gone.
 */
export async function deleteItem(itemId: string, librarianId: string, db?: PrismaClient) {
  const prisma = db ?? (await import("@/lib/prisma")).prisma;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.item.findUnique({ where: { id: itemId } });
    if (!existing) {
      throw new ItemError(404, "That item is not in the catalogue.");
    }

    const openLoans = await tx.loan.count({
      where: { itemId, status: { in: [...OPEN_LOAN_STATUSES] } },
    });
    if (openLoans > 0) {
      throw new ItemError(409, "This item is on loan and cannot be deleted.");
    }

    const deletedLog = await tx.stockLog.create({
      data: {
        itemId,
        changedBy: librarianId,
        action: "DELETED",
        quantity: existing.totalCopies,
        reason: `Removed ${existing.title} (${existing.isbn})`,
      },
    });

    await tx.stockLog.deleteMany({ where: { itemId, id: { not: deletedLog.id } } });
    await tx.reservation.deleteMany({ where: { itemId } });
    await tx.loan.deleteMany({ where: { itemId, status: "RETURNED" } });
    await tx.item.delete({ where: { id: itemId } });
  });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
