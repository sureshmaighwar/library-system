import { describe, expect, it } from "vitest";

import { adjustStock, deleteItem, updateItem } from "@/lib/items";
import type { ItemInput } from "@/lib/validations";

type StockLog = {
  id: string;
  itemId: string | null;
  action: string;
  quantity: number;
  reason: string | null;
  changedBy: string;
};

type MemoryItem = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string | null;
  coverImage: string | null;
  totalCopies: number;
  availableCopies: number;
  lowStockThreshold: number;
};

type MemoryLoan = {
  id: string;
  itemId: string;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
};

function createItemStore(seed?: { items?: MemoryItem[]; loans?: MemoryLoan[] }) {
  const items = (seed?.items ?? []).map((item) => ({ ...item }));
  const loans = (seed?.loans ?? []).map((loan) => ({ ...loan }));
  const logs: StockLog[] = [];
  let sequence = 1;

  const tx = {
    item: {
      findUnique: async ({ where }: { where: { id: string } }) => items.find((item) => item.id === where.id) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          totalCopies?: number | { increment?: number; decrement?: number };
          availableCopies?: number | { increment?: number; decrement?: number };
          title?: string;
          author?: string;
          isbn?: string;
          category?: string;
          description?: string | null;
          coverImage?: string | null;
        };
      }) => {
        const item = items.find((entry) => entry.id === where.id);
        if (!item) {
          throw new Error("Item missing");
        }
        applyCopies(item, "totalCopies", data.totalCopies);
        applyCopies(item, "availableCopies", data.availableCopies);
        if (data.title !== undefined) item.title = data.title;
        if (data.author !== undefined) item.author = data.author;
        if (data.isbn !== undefined) item.isbn = data.isbn;
        if (data.category !== undefined) item.category = data.category;
        if (data.description !== undefined) item.description = data.description;
        if (data.coverImage !== undefined) item.coverImage = data.coverImage;
        return { ...item };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; availableCopies: { gte: number } };
        data: { totalCopies: { decrement: number }; availableCopies: { decrement: number } };
      }) => {
        const item = items.find(
          (entry) => entry.id === where.id && entry.availableCopies >= where.availableCopies.gte,
        );
        if (!item) {
          return { count: 0 };
        }
        item.totalCopies -= data.totalCopies.decrement;
        item.availableCopies -= data.availableCopies.decrement;
        return { count: 1 };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = items.findIndex((item) => item.id === where.id);
        if (index >= 0) {
          items.splice(index, 1);
        }
        for (const log of logs) {
          if (log.itemId === where.id) {
            log.itemId = null;
          }
        }
      },
    },
    loan: {
      count: async ({
        where,
      }: {
        where: { itemId: string; status: { in: Array<MemoryLoan["status"]> } };
      }) =>
        loans.filter((loan) => loan.itemId === where.itemId && where.status.in.includes(loan.status)).length,
      deleteMany: async ({ where }: { where: { itemId: string; status: MemoryLoan["status"] } }) => {
        const before = loans.length;
        const kept = loans.filter((loan) => !(loan.itemId === where.itemId && loan.status === where.status));
        loans.splice(0, loans.length, ...kept);
        return { count: before - loans.length };
      },
    },
    reservation: {
      deleteMany: async () => ({ count: 0 }),
    },
    stockLog: {
      create: async ({
        data,
      }: {
        data: { itemId: string; changedBy: string; action: string; quantity: number; reason?: string | null };
      }) => {
        const log: StockLog = {
          id: `log-${sequence++}`,
          itemId: data.itemId,
          changedBy: data.changedBy,
          action: data.action,
          quantity: data.quantity,
          reason: data.reason ?? null,
        };
        logs.push(log);
        return log;
      },
      deleteMany: async ({ where }: { where: { itemId: string; id: { not: string } } }) => {
        const kept = logs.filter((log) => !(log.itemId === where.itemId && log.id !== where.id.not));
        logs.splice(0, logs.length, ...kept);
        return { count: 0 };
      },
    },
  };

  return {
    items,
    loans,
    logs,
    db: {
      $transaction: async <T,>(fn: (client: typeof tx) => Promise<T>) => fn(tx),
    },
  };
}

function applyCopies(
  item: MemoryItem,
  field: "totalCopies" | "availableCopies",
  change: number | { increment?: number; decrement?: number } | undefined,
) {
  if (change === undefined) {
    return;
  }
  if (typeof change === "number") {
    item[field] = change;
    return;
  }
  if (change.increment) {
    item[field] += change.increment;
  }
  if (change.decrement) {
    item[field] -= change.decrement;
  }
}

function shelfItem(overrides: Partial<MemoryItem> = {}): MemoryItem {
  return {
    id: "item-1",
    title: "Clean Code",
    author: "Martin",
    isbn: "9780132350884",
    category: "Tech",
    description: null,
    coverImage: null,
    totalCopies: 2,
    availableCopies: 2,
    lowStockThreshold: 2,
    ...overrides,
  };
}

const input: ItemInput = {
  title: "Clean Code",
  author: "Martin",
  isbn: "9780132350884",
  category: "Tech",
  description: "",
  coverImage: "",
  totalCopies: 2,
};

describe("adjustStock", () => {
  it("adds a copy to both counts and writes a stock log", async () => {
    const memory = createItemStore({ items: [shelfItem()] });

    await adjustStock("item-1", "librarian-1", "ADDED_COPIES", 1, "Shelf check", memory.db as never);

    expect(memory.items[0]).toMatchObject({ totalCopies: 3, availableCopies: 3 });
    expect(memory.logs[0]).toMatchObject({ action: "ADDED_COPIES", quantity: 1, reason: "Shelf check" });
  });

  it("rejects removing a copy that is not on the shelf", async () => {
    const memory = createItemStore({
      items: [shelfItem({ totalCopies: 1, availableCopies: 0 })],
    });

    await expect(adjustStock("item-1", "librarian-1", "LOST", 1, "Missing", memory.db as never)).rejects.toMatchObject({
      status: 409,
    });
    expect(memory.items[0]).toMatchObject({ totalCopies: 1, availableCopies: 0 });
    expect(memory.logs).toHaveLength(0);
  });
});

describe("updateItem", () => {
  it("rejects a total below the copies currently on loan", async () => {
    const memory = createItemStore({
      items: [shelfItem({ totalCopies: 5, availableCopies: 2 })],
    });

    await expect(
      updateItem("item-1", { ...input, totalCopies: 2 }, "librarian-1", memory.db as never),
    ).rejects.toMatchObject({ status: 409 });
    expect(memory.items[0]).toMatchObject({ totalCopies: 5, availableCopies: 2 });
  });
});

describe("deleteItem", () => {
  it("rejects a delete while a loan is still open", async () => {
    const memory = createItemStore({
      items: [shelfItem()],
      loans: [{ id: "loan-1", itemId: "item-1", status: "OVERDUE" }],
    });

    await expect(deleteItem("item-1", "librarian-1", memory.db as never)).rejects.toMatchObject({ status: 409 });
    expect(memory.items).toHaveLength(1);
  });

  it("keeps the title and ISBN on the delete log after a returned loan is removed", async () => {
    const memory = createItemStore({
      items: [shelfItem({ title: "Circe", isbn: "9780316556347" })],
      loans: [{ id: "loan-1", itemId: "item-1", status: "RETURNED" }],
    });

    await deleteItem("item-1", "librarian-1", memory.db as never);

    expect(memory.items).toHaveLength(0);
    expect(memory.loans).toHaveLength(0);
    expect(memory.logs).toEqual([
      expect.objectContaining({
        action: "DELETED",
        itemId: null,
        reason: "Removed Circe (9780316556347)",
      }),
    ]);
  });
});
