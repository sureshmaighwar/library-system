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
});
