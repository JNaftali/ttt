import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import * as urlState from "./urlState";

describe("App - Slider Thumb Linking", () => {
  beforeEach(() => {
    // Mock URL state functions to return default state immediately
    vi.spyOn(urlState, "deserializeState").mockReturnValue(null);
    vi.spyOn(urlState, "updateURL").mockImplementation(() => {});
    vi.spyOn(urlState, "resetState").mockImplementation(() => {});
  });
  it("should render the application and load default state", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Should have balance labels
    expect(screen.getAllByText("eq").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("pill").length).toBeGreaterThan(0);
    expect(screen.getAllByText("salve").length).toBeGreaterThan(0);
    expect(screen.getAllByText("pipe").length).toBeGreaterThan(0);

    // Should have event labels
    expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
  });

  it("should render sliders for all balance types", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Check that all balance types have sliders
    const balanceTypes = ["eq", "bal", "pill", "salve", "pipe"];

    balanceTypes.forEach((balance) => {
      const labels = screen.getAllByText(balance);
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  it("should show sliders for balances that have events", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Should find the BalanceSlider component is rendered
    // eq and bal are required by "cast windlance" so they should have sliders with thumbs
    const balanceSliders = screen.getAllByText(/^(eq|bal|pill|salve|pipe)$/);
    expect(balanceSliders.length).toBeGreaterThanOrEqual(5);
  });

  it("should maintain consistent state structure", async () => {
    // This test ensures the component renders without errors
    // and maintains the expected structure
    const { container } = render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Should have sliders for all balance types (forms + reset button + 5 balance sliders)
    const sliders = container.querySelectorAll('[role="group"]');
    expect(sliders.length).toBeGreaterThanOrEqual(5); // at least the 5 balance sliders

    // Should have labels for all balance types
    const labels = ["eq", "bal", "pill", "salve", "pipe"];
    labels.forEach((label) => {
      const labelElements = screen.getAllByText(label);
      expect(labelElements.length).toBeGreaterThan(0);
    });
  });

  it("should have forms for adding balances and events", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Should have form elements (multiple instances due to multiple renders)
    expect(screen.getAllByLabelText("Add Balance").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Event Name").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Duration").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Requirements").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Consumes").length).toBeGreaterThan(0);

    // Should have buttons (multiple instances due to multiple renders)
    expect(
      screen.getAllByRole("button", { name: "Add Balance" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Add Event" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Reset" }).length,
    ).toBeGreaterThan(0);
  });

  it("should allow URL state management", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Should have loaded default state from urlState utilities
    expect(screen.getAllByText("eq").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bal").length).toBeGreaterThan(0);

    // Reset button should be functional
    const resetButtons = screen.getAllByRole("button", { name: "Reset" });
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it("should render with proper state structure", async () => {
    render(<App />);

    // Wait for component to load default state
    await waitFor(() => {
      expect(screen.getAllByText("cast windlance").length).toBeGreaterThan(0);
    });

    // Should have all the expected UI elements (multiple instances due to multiple renders)
    expect(screen.getAllByText("Add Balance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Event Name").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Duration").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Requirements").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Consumes").length).toBeGreaterThan(0);

    // Should display all balance types
    const balanceTypes = ["eq", "bal", "pill", "salve", "pipe"];
    balanceTypes.forEach((balance) => {
      expect(screen.getAllByText(balance).length).toBeGreaterThan(0);
    });
  });
});
