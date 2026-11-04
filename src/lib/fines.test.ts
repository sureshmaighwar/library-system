import { describe, expect, it } from "vitest";

import { calculateFineCents, FINE_CENTS_PER_DAY } from "@/lib/fines";

const DAY = 24 * 60 * 60 * 1000;

describe("calculateFineCents", () => {
  const dueAt = new Date("2026-03-01T12:00:00.000Z");

  it("charges nothing when the item is returned on time", () => {
    expect(calculateFineCents(dueAt, new Date(dueAt.getTime() - DAY))).toBe(0);
    expect(calculateFineCents(dueAt, dueAt)).toBe(0);
  });

  it("charges one day when the item is exactly one day late", () => {
    expect(calculateFineCents(dueAt, new Date(dueAt.getTime() + DAY))).toBe(FINE_CENTS_PER_DAY);
  });

  it("rounds a partial overdue day up to one day", () => {
    const twelveHoursLate = new Date(dueAt.getTime() + DAY / 2);
    expect(calculateFineCents(dueAt, twelveHoursLate)).toBe(FINE_CENTS_PER_DAY);
  });

  it("charges two days when the item is a day and an hour late", () => {
    const late = new Date(dueAt.getTime() + DAY + 60 * 60 * 1000);
    expect(calculateFineCents(dueAt, late)).toBe(FINE_CENTS_PER_DAY * 2);
  });

  it("returns 0 if the item is not overdue", () => {
    expect(calculateFineCents(new Date("2026-11-10"), new Date("2026-11-08"))).toBe(0);
  });

  it("charges $1.50 for 3 full days overdue", () => {
    expect(calculateFineCents(new Date("2026-11-01"), new Date("2026-11-04"))).toBe(150);
  });

  it("bills two days when the return is 26 hours late", () => {
    expect(calculateFineCents(new Date("2026-11-01T10:00:00"), new Date("2026-11-02T12:00:00"))).toBe(100);
  });

  it("charges nothing for a same-day return", () => {
    expect(calculateFineCents(new Date("2026-11-01"), new Date("2026-11-01"))).toBe(0);
  });
});
