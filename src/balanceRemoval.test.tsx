import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import * as urlState from "./urlState";

describe("Balance Removal", () => {
  beforeEach(() => {
    // Mock URL state functions
    vi.spyOn(urlState, "deserializeState").mockReturnValue(null);
    vi.spyOn(urlState, "updateURL").mockImplementation(() => {});
    vi.spyOn(urlState, "resetState").mockImplementation(() => {});
  });

  it("should display remove buttons next to each balance", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Should have remove buttons for each balance
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons.length).toBeGreaterThan(0);

    // Each balance type should have a remove button
    const balanceTypes = ["eq", "bal", "pill", "salve", "pipe"];
    expect(removeButtons.length).toBe(balanceTypes.length);
  });

  it("should remove balance when remove button is clicked", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Verify 'pill' balance exists initially
    expect(screen.getAllByText("pill").length).toBeGreaterThan(0);

    // Find and click the remove button for 'pill' balance
    const pillLabels = screen.getAllByText("pill");
    // Find the remove button associated with the pill balance
    // We need to find the button in the same container as the pill label
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });

    // Click one of the remove buttons (we'll assume it's for pill for testing)
    fireEvent.click(removeButtons[2]); // Index 2 should be pill based on default order

    // Wait for the balance to be removed
    await waitFor(() => {
      // The pill balance should be removed from checkboxes and sliders
      const remainingPillElements = screen.queryAllByText("pill");
      // Should be fewer pill elements now (removed from slider, but might still be in forms)
      expect(remainingPillElements.length).toBeLessThan(pillLabels.length);
    });
  });

  it("should remove events that depend on removed balance", async () => {
    const { container } = render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Verify that the event initially exists in the list
    await waitFor(() => {
      const eventLabels = container.querySelectorAll("ul li label");
      expect(eventLabels.length).toBe(1); // Should have one event initially
      expect(eventLabels[0].textContent).toBe("cast windlance");
    });

    // Remove the 'eq' balance - find the first "Remove" button in this specific container
    const removeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Remove",
    ) as HTMLElement;

    fireEvent.click(removeButton);

    // The 'cast windlance' event should be removed from the events list
    await waitFor(() => {
      const eventLabels = container.querySelectorAll("ul li label");
      expect(eventLabels.length).toBe(0);
    });
  });

  it("should clean up form checkboxes when balance is removed", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Check that 'eq' appears in the requirements and consumes checkboxes
    const initialEqElements = screen.getAllByText("eq");
    expect(initialEqElements.length).toBeGreaterThan(2); // At least in both checkbox groups

    // Remove the 'eq' balance
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]); // First button should be for 'eq'

    // 'eq' should be removed from the checkbox options
    await waitFor(() => {
      const remainingEqElements = screen.queryAllByText("eq");
      expect(remainingEqElements.length).toBeLessThan(initialEqElements.length);
    });
  });

  it("should handle removing all balances gracefully", async () => {
    const { container } = render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Remove all balances one by one
    const balanceTypes = ["eq", "bal", "pill", "salve", "pipe"];

    for (let i = 0; i < balanceTypes.length; i++) {
      const removeButtons = container.querySelectorAll("button");
      const removeButton = Array.from(removeButtons).find(
        (button) => button.textContent === "Remove",
      );
      if (removeButton) {
        fireEvent.click(removeButton); // Always click the first remaining button
        // Give some time for the removal to process
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // All event labels should be removed from the events list
    await waitFor(() => {
      const eventLabels = container.querySelectorAll("ul li label");
      expect(eventLabels.length).toBe(0);
    });

    // No remove buttons should remain
    const finalRemoveButtons = Array.from(
      container.querySelectorAll("button"),
    ).filter((button) => button.textContent === "Remove");
    expect(finalRemoveButtons.length).toBe(0);
  });
});
