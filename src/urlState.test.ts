import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  serializeState,
  deserializeState,
  updateURL,
  updateURLImmediate,
  getDefaultState,
} from "./urlState";

describe("urlState utilities", () => {
  const mockState = {
    balances: ["eq", "bal", "test"],
    events: [
      {
        name: "test event",
        req: ["eq"],
        consumes: ["bal"],
        duration: 2.5,
      },
    ],
    eventValues: {
      "test event": 1.5,
    },
  };

  beforeEach(() => {
    // Reset location before each test
    delete (globalThis as { window?: unknown }).window;
    vi.stubGlobal("window", {
      location: {
        search: "",
        href: "http://localhost:3000",
      },
      history: {
        replaceState: vi.fn(),
      },
    });

    // Mock console.warn to suppress expected error logs in tests
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("serializeState", () => {
    it("should serialize state to base64 encoded URL params", () => {
      const result = serializeState(mockState);
      expect(result).toMatch(/^state=/);

      // Decode and verify the content
      const params = new URLSearchParams(result);
      const encoded = params.get("state");
      expect(encoded).toBeTruthy();

      const decoded = JSON.parse(atob(encoded!));
      expect(decoded).toEqual(mockState);
    });

    it("should handle empty state", () => {
      const emptyState = {
        balances: [],
        events: [],
        eventValues: {},
      };

      const result = serializeState(emptyState);
      const params = new URLSearchParams(result);
      const encoded = params.get("state");
      const decoded = JSON.parse(atob(encoded!));

      expect(decoded).toEqual(emptyState);
    });
  });

  describe("deserializeState", () => {
    it("should deserialize state from URL search params", () => {
      const serialized = serializeState(mockState);
      window.location.search = `?${serialized}`;

      const result = deserializeState();
      expect(result).toEqual(mockState);
    });

    it("should return null when no state param exists", () => {
      window.location.search = "";

      const result = deserializeState();
      expect(result).toBeNull();
    });

    it("should return null when state param is invalid", () => {
      window.location.search = "?state=invalid";

      const result = deserializeState();
      expect(result).toBeNull();
    });

    it("should handle malformed base64", () => {
      window.location.search = "?state=not-base64!";

      const result = deserializeState();
      expect(result).toBeNull();
    });

    it("should handle malformed JSON", () => {
      const invalidJson = btoa('{"invalid": json}');
      window.location.search = `?state=${invalidJson}`;

      const result = deserializeState();
      expect(result).toBeNull();
    });
  });

  describe("updateURL", () => {
    it("should debounce and update browser URL with serialized state", async () => {
      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      updateURL(mockState);

      // Should not be called immediately (debounced)
      expect(replaceStateSpy).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(replaceStateSpy).toHaveBeenCalledWith(
        {},
        "",
        expect.stringContaining("state=")
      );

      const [, , url] = replaceStateSpy.mock.calls[0];
      const urlObj = new URL(url as string);
      const stateParam = urlObj.searchParams.get("state");

      expect(stateParam).toBeTruthy();
      const decoded = JSON.parse(atob(stateParam!));
      expect(decoded).toEqual(mockState);
    });

    it("should preserve existing URL path and hash", async () => {
      window.location.href = "http://localhost:3000/path#hash";
      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      updateURL(mockState);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      const [, , url] = replaceStateSpy.mock.calls[0];
      expect(url).toContain("/path");
      expect(url).toContain("#hash");
    });
  });

  describe("updateURLImmediate", () => {
    it("should immediately update browser URL with serialized state", () => {
      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      updateURLImmediate(mockState);

      expect(replaceStateSpy).toHaveBeenCalledWith(
        {},
        "",
        expect.stringContaining("state=")
      );

      const [, , url] = replaceStateSpy.mock.calls[0];
      const urlObj = new URL(url as string);
      const stateParam = urlObj.searchParams.get("state");

      expect(stateParam).toBeTruthy();
      const decoded = JSON.parse(atob(stateParam!));
      expect(decoded).toEqual(mockState);
    });
  });

  describe("getDefaultState", () => {
    it("should return default state with expected structure", () => {
      const defaultState = getDefaultState();

      expect(defaultState).toEqual({
        balances: ["eq", "bal", "pill", "salve", "pipe"],
        events: [
          {
            name: "cast windlance",
            req: ["eq", "bal"],
            consumes: ["eq"],
            duration: 1.5,
          },
        ],
        eventValues: {},
      });
    });

    it("should return a new object each time", () => {
      const state1 = getDefaultState();
      const state2 = getDefaultState();

      expect(state1).not.toBe(state2);
      expect(state1.balances).not.toBe(state2.balances);
      expect(state1.events).not.toBe(state2.events);
      expect(state1.eventValues).not.toBe(state2.eventValues);
    });
  });

  describe("integration", () => {
    it("should serialize and deserialize state correctly", () => {
      const serialized = serializeState(mockState);
      window.location.search = `?${serialized}`;

      const deserialized = deserializeState();
      expect(deserialized).toEqual(mockState);
    });

    it("should handle complex state with multiple events and values", () => {
      const complexState = {
        balances: ["eq", "bal", "pill", "salve", "pipe", "custom"],
        events: [
          {
            name: "cast windlance",
            req: ["eq", "bal"],
            consumes: ["eq"],
            duration: 1.5,
          },
          {
            name: "drink health",
            req: ["pill"],
            consumes: ["pill"],
            duration: 0.5,
          },
          {
            name: "smoke pipe",
            req: ["pipe", "eq"],
            consumes: ["pipe"],
            duration: 3.0,
          },
        ],
        eventValues: {
          "cast windlance": 2.1,
          "drink health": 0.8,
          "smoke pipe": 1.2,
        },
      };

      const serialized = serializeState(complexState);
      window.location.search = `?${serialized}`;

      const deserialized = deserializeState();
      expect(deserialized).toEqual(complexState);
    });
  });
});
