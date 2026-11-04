import { describe, expect, it } from "vitest";

import { borrowItem, LoanError, returnLoan } from "@/lib/loans";

type Status = "ACTIVE" | "RETURNED" | "OVERDUE";

type MemoryItem = {
  id: string;
  title: string;
  author: string;
  availableCopies: number;
};

type MemoryLoan = {
  id: string;
  userId: string;
  itemId: string;
  status: Status;
  dueDate: Date;
  returnedAt: Date | null;
  fineAmount: string;
  finePaid: boolean;
  renewed: boolean;
  borrowedAt: Date;
  item: { id: string; title: string; author: string };
  user: { id: string; name: string; email: string };
};

function statusMatches(status: Status, filter: Status | { in: Status[] }) {
  if (typeof filter === "string") {
    return status === filter;
  }
  return filter.in.includes(status);
}

function createMemoryDb(seed?: { items?: MemoryItem[]; loans?: MemoryLoan[] }) {
  const items: MemoryItem[] = (seed?.items ?? []).map((item) => ({ ...item }));
  const loans: MemoryLoan[] = (seed?.loans ?? []).map((loan) => ({ ...loan }));
  let sequence = loans.length + 1;

  const tx = {
    $executeRaw: async () => 1,
    stockLog: {
      create: async () => ({ id: "log" }),
    },
    reservation: {
      updateMany: async () => ({ count: 0 }),
    },
    item: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        items.find((item) => item.id === where.id) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; availableCopies: { gt: number } };
        data: { availableCopies: { decrement: number } };
      }) => {
        const item = items.find(
          (entry) => entry.id === where.id && entry.availableCopies > where.availableCopies.gt,
        );
        if (!item) {
          return { count: 0 };
        }
        item.availableCopies -= data.availableCopies.decrement;
        return { count: 1 };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { availableCopies: { increment: number } };
      }) => {
        const item = items.find((entry) => entry.id === where.id);
        if (!item) {
          throw new Error("Item missing");
        }
        item.availableCopies += data.availableCopies.increment;
        return item;
      },
    },
    loan: {
      count: async ({ where }: { where: { userId: string; status: Status | { in: Status[] } } }) =>
        loans.filter((loan) => loan.userId === where.userId && statusMatches(loan.status, where.status)).length,
      findFirst: async ({
        where,
      }: {
        where: { userId: string; itemId: string; status: Status | { in: Status[] } };
      }) =>
        loans.find(
          (loan) =>
            loan.userId === where.userId &&
            loan.itemId === where.itemId &&
            statusMatches(loan.status, where.status),
        ) ?? null,
      findUnique: async ({ where }: { where: { id: string } }) =>
        loans.find((loan) => loan.id === where.id) ?? null,
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          itemId: string;
          borrowedAt: Date;
          dueDate: Date;
          status: Status;
          fineAmount: string;
          finePaid: boolean;
        };
      }) => {
        const item = items.find((entry) => entry.id === data.itemId);
        const loan: MemoryLoan = {
          id: `loan-${sequence++}`,
          returnedAt: null,
          renewed: false,
          item: { id: data.itemId, title: item?.title ?? "Item", author: item?.author ?? "Author" },
          user: { id: data.userId, name: "Member", email: "member@library.test" },
          ...data,
        };
        loans.push(loan);
        return loan;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id?: string; status: Status | { in: Status[] }; dueDate?: { lt: Date } };
        data: Partial<MemoryLoan>;
      }) => {
        const matches = loans.filter((loan) => {
          if (where.id && loan.id !== where.id) {
            return false;
          }
          if (!statusMatches(loan.status, where.status)) {
            return false;
          }
          if (where.dueDate && !(loan.dueDate < where.dueDate.lt)) {
            return false;
          }
          return true;
        });
        for (const loan of matches) {
          Object.assign(loan, data);
        }
        return { count: matches.length };
      },
    },
  };

  return {
    items,
    loans,
    db: {
      $transaction: async <T,>(fn: (client: typeof tx) => Promise<T>) => fn(tx),
    },
  };
}

const member = "member-1";

describe("borrowItem", () => {
  it("rejects a borrow when no copies are available", async () => {
    const memory = createMemoryDb({
      items: [{ id: "item-1", title: "Clean Code", author: "Martin", availableCopies: 0 }],
    });

    await expect(borrowItem(member, "item-1", memory.db as never)).rejects.toMatchObject({
      code: "NO_COPIES",
    });
    expect(memory.items[0]?.availableCopies).toBe(0);
    expect(memory.loans).toHaveLength(0);
  });

  it("counts overdue loans toward the three-loan limit", async () => {
    const loans = [
      openLoan("loan-1", "item-1", "ACTIVE"),
      openLoan("loan-2", "item-2", "OVERDUE"),
      openLoan("loan-3", "item-3", "ACTIVE"),
    ];
    const memory = createMemoryDb({
      items: [
        { id: "item-4", title: "Sapiens", author: "Harari", availableCopies: 2 },
        ...loans.map((loan) => ({
          id: loan.itemId,
          title: loan.item.title,
          author: loan.item.author,
          availableCopies: 1,
        })),
      ],
      loans,
    });

    await expect(borrowItem(member, "item-4", memory.db as never)).rejects.toMatchObject({
      code: "LOAN_LIMIT",
    });
    expect(memory.items.find((item) => item.id === "item-4")?.availableCopies).toBe(2);
  });

  it("rejects a second open loan for the same item", async () => {
    const memory = createMemoryDb({
      items: [{ id: "item-1", title: "Clean Code", author: "Martin", availableCopies: 2 }],
      loans: [openLoan("loan-1", "item-1", "OVERDUE")],
    });

    await expect(borrowItem(member, "item-1", memory.db as never)).rejects.toMatchObject({
      code: "DUPLICATE",
    });
    expect(memory.items[0]?.availableCopies).toBe(2);
    expect(memory.loans).toHaveLength(1);
  });
});

describe("returnLoan", () => {
  it("saves a decimal fine and does not add another copy on a second return", async () => {
    const dueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const memory = createMemoryDb({
      items: [{ id: "item-1", title: "Clean Code", author: "Martin", availableCopies: 0 }],
      loans: [{ ...openLoan("loan-1", "item-1", "ACTIVE"), dueDate }],
    });

    const first = await returnLoan(member, "loan-1", false, memory.db as never);
    const second = await returnLoan(member, "loan-1", false, memory.db as never);

    expect(first.idempotent).toBe(false);
    expect(Number(first.loan.fineAmount)).toBeGreaterThan(0);
    expect(second.idempotent).toBe(true);
    expect(memory.items[0]?.availableCopies).toBe(1);
    expect(memory.loans[0]?.status).toBe("RETURNED");
  });
});

function openLoan(id: string, itemId: string, status: Status): MemoryLoan {
  return {
    id,
    userId: member,
    itemId,
    status,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    returnedAt: null,
    fineAmount: "0.00",
    finePaid: true,
    renewed: false,
    borrowedAt: new Date(),
    item: { id: itemId, title: "Book", author: "Author" },
    user: { id: member, name: "Member", email: "member@library.test" },
  };
}
