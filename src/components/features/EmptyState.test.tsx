/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/features/EmptyState";

describe("EmptyState", () => {
  it("shows the no-results title and a catalogue link", () => {
    render(
      <EmptyState variant="no-results" href="/catalogue" actionLabel="Back to the full catalogue" />,
    );

    expect(screen.getByText("No matches")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to the full catalogue" }).getAttribute("href")).toBe("/catalogue");
  });
});
