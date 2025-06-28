interface Event {
  name: string;
  req: string[];
  consumes: string[];
  duration: number;
}

interface AppState {
  balances: string[];
  events: Event[];
  eventValues: Record<string, number>;
  timePeriod?: number;
}

export function serializeState(state: AppState): string {
  const params = new URLSearchParams();
  params.set("state", btoa(JSON.stringify(state)));
  return params.toString();
}

export function deserializeState(): AppState | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    if (!stateParam) return null;

    return JSON.parse(atob(stateParam));
  } catch (error) {
    console.warn("Failed to deserialize state from URL:", error);
    return null;
  }
}

// Debounce URL updates to prevent "Too many calls to Location or History APIs"
let updateURLTimeout: number | null = null;

export function updateURL(state: AppState): void {
  // Clear any pending update
  if (updateURLTimeout) {
    clearTimeout(updateURLTimeout);
  }

  // Schedule the update with a small delay
  updateURLTimeout = setTimeout(() => {
    const url = new URL(window.location.href);
    url.search = serializeState(state);
    window.history.replaceState({}, "", url.toString());
    updateURLTimeout = null;
  }, 100); // 100ms debounce
}

export function updateURLImmediate(state: AppState): void {
  // Cancel any pending debounced update
  if (updateURLTimeout) {
    clearTimeout(updateURLTimeout);
    updateURLTimeout = null;
  }

  const url = new URL(window.location.href);
  url.search = serializeState(state);
  window.history.replaceState({}, "", url.toString());
}

export function getDefaultState(): AppState {
  return {
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
  };
}

export function resetState(): void {
  // Clear any pending URL update before navigating
  if (updateURLTimeout) {
    clearTimeout(updateURLTimeout);
    updateURLTimeout = null;
  }

  const url = new URL(window.location.href);
  url.search = "";
  window.location.href = url.toString();
}

export function clearPendingURLUpdate(): void {
  if (updateURLTimeout) {
    clearTimeout(updateURLTimeout);
    updateURLTimeout = null;
  }
}
